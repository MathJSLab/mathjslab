import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { ClassEventListener } from './ClassEventListener';
import type { HostEffectResult } from './execution-contracts';
import { Interpreter } from './Interpreter';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';

const definitions = readFileSync(join(process.cwd(), 'test/node/fixtures/resumable-classes.m'), 'utf8');
const initialize = 'global classTrace; classTrace=0; box=RetainedBox(); ';
jest.setTimeout(15000);

describe('Retained class callbacks', () => {
    test.each([
        ['obj=RetainedPrivateEnd(); obj=trim(obj); [values(obj),classTrace]', '[1,2,0,6]\n', 1],
        ['boxes=[RetainedVectorBox(),RetainedVectorBox()]; boxes(classIndex()).Values(end)=9; [boxes(1).peek(),classTrace]', '[1,2,9,6121234]\n', 4],
        ['value=subsref(box,substruct(".","waitPeek","()",{})); [value,classTrace]', '[1,1]\n', 1],
        ['name="Value"; box.(name)=7; value=box.(name); [value,classTrace]', '[7,3412]\n', 2],
        ['[box.Value,box.Value]=size([1,2]); [box.peek(),classTrace]', '[2,3434]\n', 2],
        ['a=RetainedValue(); b=a; b.Value=7; [a.peek(),b.peek(),classTrace]', '[1,7,34]\n', 1],
        ['set(box,"Value",7); value=get(box,"Value"); [value,classTrace]', '[7,3412]\n', 2],
        ['addlistener(box,"Changed",@classListener); box.notify("Changed"); classTrace', '56\n', 1],
        ['obj=RetainedDisposable(); delete(obj); [isvalid(obj),classTrace]', '[false,4]\n', 1],
        ['obj=RetainedDisposable(); obj.delete(); [isvalid(obj),classTrace]', '[false,4]\n', 1],
        ['boxes=[box,RetainedBox()]; boxes(2).Value=7; [boxes(2).Value,classTrace]', '[7,3412]\n', 2],
        ['cells={box}; cells{1}.Value=7; [cells{1}.Value,classTrace]', '[7,3412]\n', 2],
        ['box.Value+=2; [box.peek(),classTrace]', '[3,1234]\n', 2],
        ['boxes=[box,RetainedBox()]; value=boxes(2).Value; [value,classTrace]', '[1,12]\n', 1],
        ['boxes=[box,RetainedBox()]; values=boxes.waitPeek(); [values,classTrace]', '[1,1,11]\n', 2],
        ['boxes=[box,RetainedBox()]; values=waitPeek(boxes); [values,classTrace]', '[1,1,11]\n', 2],
        ['indexed=RetainedIndexed(); a=indexed(end); [a,classTrace]', '[12,67]\n', 2],
        ['a=RetainedConcat(); b=RetainedConcat(); value=[a,b]; [value,classTrace]', '[2,2]\n', 1],
        ['a=RetainedConcat(); b=RetainedConcat(); value=[a;b]; [value,classTrace]', '[12,3]\n', 1],
        ['a=RetainedConcat(); b=RetainedConcat(); value=horzcat(a,b); [value,classTrace]', '[2,2]\n', 1],
        ['indexed=RetainedIndexed(); [a,b]=indexed(3); [a,b,classTrace]', '[13,123,97]\n', 2],
        ['indexed=RetainedIndexed(); [~,b]=indexed(3); [b,classTrace]', '[23,97]\n', 2],
        ['indexed=RetainedIndexed(); indexed(3)=20; [peek(indexed),classTrace]', '[23,8]\n', 1],
        ['indexed=RetainedIndexed(); [a,b]=subsref(indexed,substruct("()",{3})); [a,b,classTrace]', '[13,123,97]\n', 2],
        ['indexed=RetainedIndexed(); indexed=subsasgn(indexed,substruct("()",{3}),20); [peek(indexed),classTrace]', '[23,8]\n', 1],
        ['box.Value=7; value=box.Value; [value,classTrace]', '[7,3412]\n', 2],
        ['addlistener(box,"Value","PreGet",@classListener); addlistener(box,"Value","PostGet",@classListener); value=box.Value; [value,classTrace]', '[1,561256]\n', 3],
        ['addlistener(box,"Value","PreSet",@classListener); addlistener(box,"Value","PostSet",@classListener); box.Value=7; [box.peek(),classTrace]', '[7,563456]\n', 3],
        ['addlistener(box,"Normal","PostSet",@classListener); box.Normal=2; box.Normal=2; [box.Normal,classTrace]', '[2,56]\n', 1],
        ['addlistener(box,"Changed",@classListener); box.fire(); classTrace', '56\n', 1],
        ['addlistener(box,"Changed",@classListener); notify(box,"Changed"); classTrace', '56\n', 1],
        ['boxes=[box,RetainedBox()]; values=[boxes.Value]; [values,classTrace]', '[1,1,1212]\n', 2],
        ['boxes=[box,RetainedBox()]; boxes.Value=3; [boxes.Value,classTrace]', '[3,3,34341212]\n', 4],
    ])('preserves synchronous behavior: %s', async (source, expected, waits) => {
        const interpreter = Interpreter.Create();
        const result = interpreter.Execute((definitions + initialize + source).replace(/pause\(0\);?/g, ''));
        expect(interpreter.Unparse(result.list[result.list.length - 1]) + '\n').toBe(expected);
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(definitions + initialize + source);
            expect(result.diagnostics).toEqual([]);
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: expected });
            expect(request).toHaveBeenCalledTimes(waits);
            expect((await session.execute('box.backing')).status).toBe('error');
        } finally {
            await runtime.dispose();
        }
    });
    test.each(['getter', 'setter', 'listener', 'subsref'] as const)('detaches scopes, output masks and class access during a failed %s', (phase) => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(definitions + initialize + 'listener=addlistener(box,"Changed",@classListener); indexed=RetainedIndexed(); destination=99;');
        const scope = interpreter.context.currentScope;
        const source = phase === 'getter' ? 'destination=box.Value;' : phase === 'setter' ? 'box.Value=7;' : phase === 'listener' ? 'notify(box,"Changed");' : 'destination=indexed(3);';
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        expect(step.state).toBe('effect');
        expect(interpreter.context.currentScope).toBe(scope);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.requestedOutputCount).toBe(1);
        expect(interpreter.context.requestedOutputMask()).toEqual([true]);
        expect(() => interpreter.Execute('box.backing')).toThrow(/private/);
        if (step.state !== 'effect') throw new Error('Expected callback wait');
        step = step.fail(new Error('class host failed'));
        expect(step.state).toBe('error');
        expect(interpreter.context.currentScope).toBe(scope);
        expect(interpreter.Unparse(interpreter.Execute('[destination,box.peek()]'))).toBe('[99,1]\n');
        const listener = scope.resolveName('listener')!.node;
        expect(ClassEventListener.isInstanceOf(listener) && listener.notifying).toBe(false);
    });

    test.each(['abort', 'timeout', 'reset', 'dispose'] as const)('unwinds listeners and skips pending writes on %s', async (action) => {
        let entered!: () => void;
        const waiting = new Promise<void>((resolve) => {
            entered = resolve;
        });
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
            await session.execute(definitions + initialize + 'listener=addlistener(box,"Value","PostSet",@classListener);');
            const active = session.execute('box.Normal=2; box.Value=7; pending=1;', { signal: controller.signal, ...(action === 'timeout' ? { timeoutMs: 1000 } : {}) });
            await waiting;
            if (action === 'abort') controller.abort('cancel class callback');
            else if (action === 'reset' || action === 'dispose') await session[action]();
            expect((await active).status).toBe(action === 'timeout' ? 'timeout' : 'cancelled');
            const following = action === 'dispose' ? undefined : await session.execute(action === 'reset' ? 'exist("box","var")' : '[box.Normal,box.peek(),exist("pending","var")]');
            expect(following?.outputs[0]).toEqual(action === 'dispose' ? undefined : { type: 'text', text: action === 'reset' ? '0\n' : '[2,1,0]\n' });
            expect((await other.execute('exist("box","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test('executes the packaged consumer fixture', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({}) } });
        try {
            const session = await runtime.createSession();
            const tail = readFileSync(join(process.cwd(), 'test/compatibility/fixtures/classes-cycle.m'), 'utf8');
            const result = await session.execute(definitions + tail);
            expect(result.diagnostics).toEqual([]);
            expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('cancellation clears notification guards and skips later listeners', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(definitions + initialize + 'first=addlistener(box,"Changed",@classListener); second=addlistener(box,"Changed",@classListener);');
        let step = interpreter.CreateExecutionMachine(interpreter.Parse('notify(box,"Changed");')).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected listener wait');
        expect(step.cancel('cancel listener').state).toBe('cancelled');
        for (const name of ['first', 'second']) {
            const listener = interpreter.context.currentScope.resolveName(name)!.node;
            expect(ClassEventListener.isInstanceOf(listener) && listener.notifying).toBe(false);
        }
        expect(interpreter.Unparse(interpreter.Execute('classTrace'))).toBe('5\n');
    });
    test('keeps committed handle mutations after a failing post-set listener', async () => {
        let requests = 0;
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async () => {
                    if (++requests === 2) throw new Error('listener failed');
                    return {};
                },
            },
        });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + initialize + 'listener=addlistener(box,"Value","PostSet",@classListener);');
            expect((await session.execute('box.Value=7; pending=1;')).status).toBe('error');
            const result = await session.execute('[box.peek(),classTrace,exist("pending","var")]');
            expect(result.outputs[0]).toMatchObject({ text: '[7,345,0]\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('requires the async API for real waits inside accessors', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(definitions + initialize);
        expect(() => interpreter.Execute('box.Value')).toThrow(expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }));
        expect(interpreter.Unparse(interpreter.Execute('box.peek()'))).toBe('1\n');
    });
    test('restores numeric configuration when a getter resumes between sessions', async () => {
        let entered!: () => void;
        let release!: (_value: HostEffectResult) => void;
        const waiting = new Promise<void>((resolve) => {
            entered = resolve;
        });
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: () =>
                    new Promise((resolve) => {
                        release = resolve;
                        entered();
                    }),
            },
        });
        try {
            const first = await runtime.createSession();
            const second = await runtime.createSession();
            await first.execute(
                'configure("precision",20); classdef PrecisionGetter; properties (Dependent); Value; end; methods; function value=get.Value(obj), pause(0); value=getconfig("precision"); end; end; end; obj=PrecisionGetter();',
            );
            const active = first.execute('obj.Value');
            await waiting;
            const isolated = await second.execute('configure("precision",40); getconfig("precision")');
            expect(isolated.outputs[0]).toMatchObject({ text: '{precision,40}\n' });
            release({});
            expect((await active).outputs[0]).toMatchObject({ text: '{precision,20}\n' });
            expect((await second.execute('exist("obj","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test('preserves the public array-element iterator request shape', () => {
        const interpreter = Interpreter.Create();
        const values = [Complex.one(), Complex.create(2)];
        const execution = MultiArray.evaluateElements(MultiArray.toRowVector(values), interpreter);
        let next = execution.next();
        const seen: unknown[] = [];
        while (!next.done) {
            expect(Object.keys(next.value)).toEqual(['element']);
            seen.push(next.value.element);
            next = execution.next([next.value.element]);
        }
        expect(seen).toEqual(values);
        expect(interpreter.Unparse(next.value)).toBe('[1,2]');
    });
});
