import { Complex } from './Complex';
import { Interpreter } from './Interpreter';
import { RandomStream } from './RandomStream';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';

describe('Session-owned reproducible random streams', () => {
    test('matches the xoshiro128** reference transition vector', () => {
        const stream = new RandomStream();
        stream.restore(0, [1, 2, 3, 4]);
        expect(Array.from({ length: 5 }, () => stream.nextUint32())).toEqual([11520, 0, 5927040, 70819200, 2031721883]);
    });

    test('rejects the incomplete top interval rather than reducing it modulo the width', () => {
        const stream = new RandomStream();
        const next = jest.spyOn(stream, 'nextUint32').mockReturnValueOnce(0xffffffff).mockReturnValueOnce(4);
        expect(stream.integer(-2, 3)).toBe(2);
        expect(next).toHaveBeenCalledTimes(2);
    });

    test('state snapshots are detached and invalid restores are atomic', () => {
        const stream = new RandomStream();
        const before = stream.state;
        const detached = stream.state;
        detached.words[0] = 42;
        expect(stream.state).toEqual(before);
        expect(() => stream.restore(1, [0, 0, 0, 0])).toThrow();
        expect(() => stream.restore(1, [1, 2, -1, 4])).toThrow();
        expect(stream.state).toEqual(before);
    });

    test.each(['number', 'decimal'] as const)('preserves sequence, dimensions and bounds with %s', async (engine) => {
        const previous = Complex.engine;
        Complex.engine = engine;
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({}) } });
        try {
            const session = await runtime.createSession();
            for (const source of [
                'rng(42); s=rng(); a=rand(2,3); b=randi([-3,4],2,3); rng(s); aa=rand(2,3); bb=randi([-3,4],2,3); isequal(a,aa)&&isequal(b,bb)',
                'rng(9); a=rand(2,3); rng(9); b=[rand(),rand(),rand(),rand(),rand(),rand()]; isequal(a(:),b(:))',
                'rng(7); s=rng(); rand(0,3); randi(3,0,2); t=rng(); isequal(s,t)',
                'a=randi(1,2,3); b=randi([0,0],2,3); c=randi([-2,-2],2,3); all(a(:)==1)&&all(b(:)==0)&&all(c(:)==-2)',
                'rng(2); a=randi(3,1,300); all(a>=1)&&all(a<=3)&&any(a==1)&&any(a==3)',
                'rng(4); s=rng(); old=rng(5); isequal(s,old)',
                'rng("default"); a=rand(); rng(0,"xoshiro128ss-v1"); a==rand()',
                'rng("shuffle"); s=rng(); a=rand(); rng(s); a==rand()',
                'function d=randomDim(), pause(0); d=2; end; rng(19); a=rand(randomDim(),3); rng(19); isequal(a,rand(2,3))',
                'rng(17); [~]=rng(18); a=rand(); rng(18); a==rand()',
            ]) {
                const result = await session.execute(source);
                expect(result.diagnostics).toEqual([]);
                expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
            }
        } finally {
            await runtime.dispose();
            Complex.engine = previous;
        }
    });

    test.each([
        'rng(-1)',
        'rng(1.5)',
        'rng(4294967296)',
        'rng(1,"twister")',
        'rng("unknown")',
        'randi(0)',
        'randi([2,1])',
        'randi([-2147483648,2147483648])',
        'randi(9007199254740992)',
        'randi([1,2,3])',
    ])('rejects %s without consuming state', (source) => {
        const interpreter = Interpreter.Create();
        const stream = () => interpreter.Unparse(interpreter.Execute('rng()'));
        const before = stream();
        expect(() => interpreter.Execute(source)).toThrow();
        expect(stream()).toEqual(before);
    });

    test('rejects malformed restored state and supports cross-interpreter restore', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        try {
            const session = await runtime.createSession();
            await session.execute('rng(3); s=rng(); bad=s; bad.State=[0,0,0,0];');
            expect((await session.execute('rng(bad)')).status).toBe('error');
            expect((await session.execute('t=rng(); isequal(s,t)')).outputs[0]).toMatchObject({ text: 'true\n' });
            expect((await session.execute('rng(3); before=rand(); clear all; after=rand(); rng(3); a=rand(); b=rand(); after==b')).outputs[0]).toMatchObject({ text: 'true\n' });
            await session.reset();
            expect((await session.execute('a=rand(); rng("default"); a==rand()')).outputs[0]).toMatchObject({ text: 'true\n' });
            const first = Interpreter.Create();
            const second = Interpreter.Create();
            first.Execute('rng(91); rand(3);');
            const state = first.Execute('rng()').list[0];
            second.context.currentScope.defineName('state', state);
            second.Execute('rng(state);');
            expect(second.Unparse(second.Execute('rand(2)'))).toEqual(first.Unparse(first.Execute('rand(2)')));
        } finally {
            await runtime.dispose();
        }
    });

    test('isolates interleaved sessions across a wait and cancellation preserves consumed draws', async () => {
        let entered!: () => void;
        let release!: (_value: import('./execution-contracts').HostEffectResult) => void;
        let waiting = new Promise<void>((resolve) => {
            entered = resolve;
        });
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async () => {
                    entered();
                    return await new Promise((resolve) => {
                        release = resolve;
                    });
                },
            },
        });
        try {
            const first = await runtime.createSession();
            const second = await runtime.createSession();
            await first.execute('configure("precision",20); rng(42);');
            await second.execute('configure("precision",40); rng(42);');
            const pending = first.execute('a=rand(); pause(1); b=rand(); [a,b]');
            await waiting;
            const reference = await second.execute('[rand(),rand()]');
            await second.execute('rng(999); rand(5);');
            release({});
            expect((await pending).outputs.find((output) => output.type === 'data')).toEqual(reference.outputs.find((output) => output.type === 'data'));
            waiting = new Promise<void>((resolve) => {
                entered = resolve;
            });
            const controller = new AbortController();
            const aborted = first.execute('consumed=rand(); pause(1); pendingValue=rand();', { signal: controller.signal });
            await waiting;
            controller.abort();
            expect((await aborted).status).toBe('cancelled');
            release({});
            await second.execute('rng(42); rand(); rand(); rand();');
            expect((await first.execute('rand()')).outputs.find((output) => output.type === 'data')).toEqual(
                (await second.execute('rand()')).outputs.find((output) => output.type === 'data'),
            );
            expect((await first.execute('exist("pendingValue","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
