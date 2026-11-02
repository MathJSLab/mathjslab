import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from './Interpreter';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
import type { HostEffectResult } from './execution-contracts';

const definitions = readFileSync(join(process.cwd(), 'test/node/fixtures/resumable-validation.m'), 'utf8');
const initialize = 'global validationTrace validationCleanup; validationTrace=0; validationCleanup=0; ';

// Complete language fixtures include synchronous and asynchronous driver comparisons.
jest.setTimeout(15000);

describe('Resumable argument and stored-property validation', () => {
    test.each([
        ['y=validated(); [y,validationTrace]', '[4,12342]\n', 4],
        ['y=validatedRepeating([1,2],[3,4,5]); [y,validationTrace]', '[2,2323]\n', 4],
        ['[~,y]=validatedMasked(); [y,validationTrace]', '[3,2]\n', 1],
        ['[~,a,b]=validatedRepeatingOutput(); [a,b,validationTrace]', '[3,4,22]\n', 2],
        ['y=validatedNamed(); [y,validationTrace]', '[3,123]\n', 3],
        ['box=ValidationBox(); [box.x,validationTrace]', '[1,12]\n', 2],
        ['box=ValidationValueBox(); other=box; validationTrace=0; box.x=validationStep(5,1); [box.x,other.x,validationTrace]', '[5,1,12]\n', 4],
        ['box=ValidationBox(); validationTrace=0; box.x=5; [box.x,validationTrace]', '[5,2]\n', 3],
        [
            'classdef OrderedBox; properties; x double {validationCheck}=validationStep(1,1); end; methods; function obj=OrderedBox(v), global validationTrace; validationTrace=10*validationTrace+4; end; end; end; box=OrderedBox(validationStep(2,3)); validationTrace',
            '1234\n',
            3,
        ],
        [
            'classdef BoundBox; properties; x double {mustBeGreaterThan(x,validationStep(0,3)),mustBeLessThan(0,x)}=1; end; end; box=BoundBox(); box.x=5; [box.x,validationTrace]',
            '[5,33]\n',
            2,
        ],
    ])('retains order, scopes and output masks: %s', async (source, expected, waits) => {
        const interpreter = Interpreter.Create();
        const synchronous = interpreter.Execute(definitions.replace(/pause\(0\);/g, '') + initialize + source);
        expect(interpreter.Unparse(synchronous.list[synchronous.list.length - 1]) + '\n').toBe(expected);
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(definitions + initialize + source);
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: expected });
            expect(request).toHaveBeenCalledTimes(waits);
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['validated(-1)', 'box.x=-1', '[a,b]=validatedMasked()'])('keeps pending writes out after a resumed validation failure: %s', async (source) => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({}) } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + initialize + 'box=ValidationBox(); destination=99; a=98; b=97;');
            const result = await session.execute(source.startsWith('validated') ? `destination=${source};` : source);
            expect(result.status).toBe('error');
            expect(result.diagnostics[0].message).toContain('validation rejected value');
            expect((await session.execute('[destination,box.x,a,b]')).outputs[0]).toMatchObject({ text: '[99,1,98,97]\n' });
            expect((await session.execute('2+2')).status).toBe('success');
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['input', 'output', 'property default', 'property write'] as const)('unwinds %s validation and detaches frames while waiting', (phase) => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(definitions + initialize + 'destination=99;');
        const source =
            phase === 'input'
                ? 'destination=validated(3);'
                : phase === 'output'
                  ? '[~,destination]=validatedMasked();'
                  : phase === 'property default'
                    ? 'destination=ValidationBox();'
                    : 'box=ValidationBox(); box.x=3;';
        for (const action of ['fail', 'cancel'] as const) {
            const scope = interpreter.context.currentScope;
            let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
            while (step.state === 'progress') step = step.continue();
            // Defaults evaluate before validation; advance their successful delay first.
            if (phase === 'property default' && step.state === 'effect') {
                step = step.resume({});
                while (step.state === 'progress') step = step.continue();
            }
            if (phase === 'property write') {
                for (let index = 0; index < 2 && step.state === 'effect'; index++) {
                    step = step.resume({});
                    while (step.state === 'progress') step = step.continue();
                }
            }
            if (step.state !== 'effect') throw new Error('Expected a validator wait');
            expect(interpreter.context.currentScope).toBe(scope);
            expect(interpreter.context.isInsideUserFunction()).toBe(false);
            expect(interpreter.context.requestedOutputCount).toBe(1);
            step = action === 'fail' ? step.fail(new Error('validator host failed')) : step.cancel('stop validation');
            expect(step.state).toBe(action === 'fail' ? 'error' : 'cancelled');
            expect(interpreter.context.currentScope).toBe(scope);
            expect(interpreter.context.isInsideUserFunction()).toBe(false);
            expect(interpreter.context.requestedOutputMask()).toEqual([true]);
            expect(interpreter.Unparse(interpreter.Execute('destination'))).toBe('99\n');
        }
    });

    test.each(['abort', 'timeout', 'reset', 'dispose'] as const)('recovers after %s during a validator and leaves another session independent', async (action) => {
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
            await session.execute(definitions + initialize + 'destination=99;');
            const active = session.execute('destination=validated(3);', { signal: controller.signal, ...(action === 'timeout' ? { timeoutMs: 1000 } : {}) });
            await waiting;
            if (action === 'abort') controller.abort('stop validator');
            else if (action === 'reset' || action === 'dispose') await session[action]();
            expect((await active).status).toBe(action === 'timeout' ? 'timeout' : 'cancelled');
            const recovered = action === 'dispose' ? undefined : await session.execute(action === 'reset' ? 'exist("destination","var")' : '[destination,validationCleanup]');
            expect(recovered?.outputs[0]).toEqual(action === 'dispose' ? undefined : { type: 'text', text: action === 'reset' ? '0\n' : '[99,1]\n' });
            expect((await other.execute('exist("destination","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('reports the synchronous wait diagnostic without executing the function body', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(definitions + initialize + 'destination=99;');
        expect(() => interpreter.Execute('destination=validated(3);')).toThrow('requires an asynchronous driver');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.Unparse(interpreter.Execute('[destination,validationTrace,validationCleanup]'))).toBe('[99,2,1]\n');
    });

    test('rejects shape mismatches before callbacks and preserves language catch for resumed failures', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + initialize + 'function y=scalarOnly(x), arguments, x (1,1) double {validationCheck}; end; y=x; end;');
            const invalid = await session.execute('scalarOnly([1,2])');
            expect(invalid.status).toBe('error');
            expect(invalid.diagnostics[0].message).toContain('expected size 1x1');
            expect(request).not.toHaveBeenCalled();
            expect((await session.execute('try, validated(-1); catch, recovered=7; end; [recovered,validationCleanup]')).outputs[0]).toMatchObject({ text: '[7,1]\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('loads resources inside validators using their retained function workspace', async () => {
        const effects: string[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    effects.push(effect.type);
                    return effect.type === 'read-text' ? { value: 'pause(0); if x<0, error("resource validation failed"); end;' } : {};
                },
            },
        });
        try {
            const session = await runtime.createSession();
            const result = await session.execute('function resourceCheck(x), load("constraint.m"); end; function y=f(x), arguments, x double {resourceCheck}; end; y=x; end; f(3)');
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: '3\n' });
            expect(effects).toEqual(['read-text', 'delay']);
        } finally {
            await runtime.dispose();
        }
    });

    test('restores session precision when a validator resumes after another session changes configuration', async () => {
        let entered!: () => void;
        let release!: (_value: HostEffectResult) => void;
        const waiting = new Promise<void>((resolve) => (entered = resolve));
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
            await first.execute('configure("precision",20);');
            const active = first.execute(
                'function checkprecision(x), pause(0); global insidePrecision; insidePrecision=getconfig("precision"); end; function y=f(x), arguments, x double {checkprecision}; end; y=x; end; f(3); global insidePrecision; insidePrecision',
            );
            await waiting;
            await second.execute('configure("precision",40);');
            release({});
            expect((await active).outputs[0]).toMatchObject({ text: '{precision,20}\n' });
            expect((await second.execute('getconfig("precision")')).outputs[0]).toMatchObject({ text: '{precision,40}\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('removes class access grants during a suspended private static validator', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            'classdef ValidationOwner; properties (Access=private); secret=7; end; methods; function y=read(obj,v), arguments, obj ValidationOwner, v double {feval("ValidationOwner.validate",v)}; end; y=obj.secret+v; end; end; methods (Static,Access=private); function validate(v), pause(0); end; end; end; obj=ValidationOwner(); destination=99;',
        );
        let step = interpreter.CreateExecutionMachine(interpreter.Parse('destination=obj.read(3);')).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        expect(step.state).toBe('effect');
        const definition = interpreter.context.resolveClassDefinition('ValidationOwner')!;
        expect(interpreter.context.canAccessClassMember(definition, 'private')).toBe(false);
        if (step.state !== 'effect') throw new Error('Expected validator wait');
        step = step.cancel('cancel private validator');
        expect(step.state).toBe('cancelled');
        expect(interpreter.context.canAccessClassMember(definition, 'private')).toBe(false);
        expect(interpreter.Unparse(interpreter.Execute('destination'))).toBe('99\n');
        expect(() => interpreter.Execute('obj.secret')).toThrow('private');
    });
});
