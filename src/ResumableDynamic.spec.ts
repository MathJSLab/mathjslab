import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from './Interpreter';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
import type { HostEffectResult } from './execution-contracts';

const definitions = readFileSync(join(process.cwd(), 'test/node/fixtures/resumable-dynamic.m'), 'utf8');
const initialize = 'global dynamicTrace dynamicCalls; dynamicTrace=0; dynamicCalls=0; ';
jest.setTimeout(15000);

describe('Retained dynamic execution and loop preparation', () => {
    test.each([
        ['eval("pause(0); x=4;"); x', '4\n', 1],
        ['dynamicLocal()', '3\n', 1],
        ['callerValue=9; y=dynamicOuter(); [y,callerValue]', '[3,9]\n', 1],
        ['function y=writebase(), evalin("base","pause(0); baseValue=7;"); y=2; end; y=writebase(); [baseValue,y]', '[7,2]\n', 1],
        ['[~,b]=eval("dynamicPair()"); b==20 && dynamicCalls==1', 'true\n', 1],
        ['[text,~,b]=evalc("dynamicPair()"); b==20 && isequal(text,"20") && dynamicCalls==1', 'true\n', 1],
        ['[a,b]=feval("eval","dynamicPair()"); [a,b,dynamicCalls]', '[10,21,1]\n', 1],
        ['[a,b]=builtin("eval","dynamicPair()"); [a,b,dynamicCalls]', '[10,21,1]\n', 1],
        ['eval(dynamicStep("pause(0); x=4;",1)); [x,dynamicTrace,dynamicCalls]', '[4,1,1]\n', 2],
        ['eval("x=1; pause(0); error(\'primary failed\');","pause(0); x+=2;"); x', '3\n', 2],
        ['A=[0,0]; total=0; for A(dynamicStep(1,1))=dynamicStep([2,3],3), total+=A(1); end; [A,total,dynamicTrace]', '[3,0,5,311]\n', 3],
        ['A=0; C={0}; total=0; for [A(dynamicStep(1,1)),C{dynamicStep(1,2)}]=[2,4;3,5], total+=A(1)+C{1}; end; [A,C{1},total,dynamicTrace]', '[4,5,14,2121]\n', 4],
        ['box=DynamicBox(); dynamicTrace=0; total=0; for box.value=[2,3], total+=box.value; end; [box.value,total,dynamicTrace]', '[3,5,22]\n', 3],
        ['spmdIndex=9; spmdSize=7; spmd(dynamicStep(0,1),dynamicStep(2,2)), value=spmdIndex+spmdSize; pause(0); end; [value,spmdIndex,spmdSize,dynamicTrace]', '[2,9,7,12]\n', 3],
    ])('preserves synchronous semantics while retaining waits: %s', async (source, expected, waits) => {
        const interpreter = Interpreter.Create();
        const result = interpreter.Execute((definitions + initialize + source).replace(/pause\(0\);?/g, ''));
        expect(interpreter.Unparse(result.list[result.list.length - 1]) + '\n').toBe(expected);
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            const evaluated = await session.execute(definitions + initialize + source);
            expect(evaluated.status).toBe('success');
            expect(evaluated.outputs[0]).toMatchObject({ text: expected });
            expect(request).toHaveBeenCalledTimes(waits);
        } finally {
            await runtime.dispose();
        }
    });

    test('retains static workspace restrictions, catch metadata and control-flow transfers', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({}) } });
        try {
            const session = await runtime.createSession();
            const source = `function y=staticDynamic(), x=1; eval("x=2; pause(0); newDynamic=7;","x+=3;"); y=x; function inner(), end; end;
function y=dynamicReturn(), y=1; eval("pause(0); return","y=99"); y=2; end;
function y=dynamicBaseReturn(), y=1; evalin("base","pause(0); return"); y=2; end;
function y=dynamicBreak(), y=0; for k=1:3, y=k; eval("pause(0); break","y=99"); end; end;
[staticDynamic(),dynamicReturn(),dynamicBaseReturn(),dynamicBreak()]`;
            const result = await session.execute(source);
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: '[5,1,2,1]\n' });
            expect((await session.execute('exist("newDynamic","var")')).outputs[0]).toMatchObject({ text: '0\n' });
            const caught = await session.execute('eval("pause(0); error(\'dynamic caught\');","pause(0); message=lasterr();"); message');
            expect(caught.status).toBe('success');
            expect(caught.outputs[0]).toMatchObject({ text: 'dynamic caught\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['abort', 'timeout', 'reset', 'dispose'] as const)('bypasses eval catch code and unwinds on %s', async (action) => {
        let entered!: () => void;
        const waiting = new Promise<void>((resolve) => (entered = resolve));
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: () => {
                    entered();
                    return new Promise<HostEffectResult>(() => {});
                },
            },
        });
        const controller = new AbortController();
        try {
            const session = await runtime.createSession();
            const other = await runtime.createSession();
            const active = session.execute(
                'caught=0; cleaned=0; destination=99; eval("x=1; unwind_protect; pause(0); unwind_protect_cleanup; cleaned+=1; end_unwind_protect; destination=7;","caught=1;");',
                { signal: controller.signal, ...(action === 'timeout' ? { timeoutMs: 1000 } : {}) },
            );
            await waiting;
            if (action === 'abort') controller.abort('stop dynamic execution');
            else if (action === 'reset' || action === 'dispose') await session[action]();
            expect((await active).status).toBe(action === 'timeout' ? 'timeout' : 'cancelled');
            const following = action === 'dispose' ? undefined : await session.execute(action === 'reset' ? 'exist("destination","var")' : '[x,caught,cleaned,destination]');
            expect(following?.outputs[0]).toEqual(action === 'dispose' ? undefined : { type: 'text', text: action === 'reset' ? '0\n' : '[1,0,1,99]\n' });
            expect((await other.execute('exist("x","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['primary', 'catch', 'binding', 'workers'] as const)('restores scopes and masks after host failure during %s', (phase) => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(definitions + initialize + 'destination=99; A=0; count=0; spmdIndex=9;');
        const source =
            phase === 'primary'
                ? 'destination=eval("pause(0); 7");'
                : phase === 'catch'
                  ? 'destination=eval("error(\'bad\')","pause(0); 7");'
                  : phase === 'binding'
                    ? 'for A(dynamicStep(1,1))=[2,3], count+=1; end;'
                    : 'spmd(dynamicStep(1,1)), destination=7; end;';
        const scope = interpreter.context.currentScope;
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        expect(step.state).toBe('effect');
        expect(interpreter.context.currentScope).toBe(scope);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        if (step.state !== 'effect') throw new Error('Expected dynamic wait');
        step = step.fail(new Error('dynamic host failed'));
        expect(step.state).toBe('error');
        expect(interpreter.context.currentScope).toBe(scope);
        expect(interpreter.context.requestedOutputCount).toBe(1);
        expect(interpreter.context.requestedOutputMask()).toEqual([true]);
        expect(interpreter.Unparse(interpreter.Execute('[destination,A,count,spmdIndex]'))).toBe('[99,0,0,9]\n');
    });

    test('validates SPMD counts in order before installing worker names or entering the body', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + initialize + 'spmdIndex=9; entered=0;');
            const failed = await session.execute('spmd(dynamicStep(-1,1),dynamicStep(2,2)), entered=1; end;');
            expect(failed.status).toBe('error');
            expect(request).toHaveBeenCalledTimes(1);
            expect((await session.execute('[dynamicTrace,spmdIndex,entered]')).outputs[0]).toMatchObject({ text: '[1,9,0]\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('reports the synchronous wait diagnostic rather than evaluating an eval catch string', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute('destination=99; caught=0;');
        expect(() => interpreter.Execute('destination=eval("pause(0); 7","caught=1;");')).toThrow('requires an asynchronous driver');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.Unparse(interpreter.Execute('[destination,caught]'))).toBe('[99,0]\n');
    });
});
