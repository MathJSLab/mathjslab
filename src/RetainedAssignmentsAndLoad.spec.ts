import { Interpreter } from './Interpreter';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
import type { RuntimeHost } from './runtime-contracts';

const functions =
    'function y=ix(v), global visits; visits=10*visits+v; pause(0); y=v; end; function [a,b,c]=pair(), global visits; visits=10*visits+3; pause(0); a=10; b=20; c=30; end; global visits; visits=0; ';

describe('Retained native output destinations and loaded function scripts', () => {
    test.each([
        ['A=[0,0]; [A(ix(1)),A(ix(2)),~]=pair(); [A,visits]', '[10,20,312]\n', 3],
        ['A=[0,0]; [A(ix(1)),A(ix(1))]=pair(); [A,visits]', '[20,0,311]\n', 3],
        ['A=[0,0]; [A(end),A(ix(1))]=pair(); [A,visits]', '[20,10,31]\n', 2],
        ['C={0,0}; [C{ix(1)},C{ix(2)}]=pair(); [C{:},visits]', '[10,20,123]\n', 3],
        ['C={0,0}; [C{ix(1):ix(2)}]=pair(); [C{:},visits]', '[10,20,123]\n', 3],
        ['function s=field(), pause(0); s="x"; end; S=struct("x",0); A=[0,0]; [S.(field()),A(ix(1))]=pair(); [S.x,A,visits]', '[10,20,0,31]\n', 3],
        ['S=struct("x",[0,0]); A=0; [S.x(ix(1)),A]=pair(); [S.x,A,visits]', '[10,0,20,13]\n', 2],
        ['C={struct("x",0),struct("x",0)}; A=0; [C{ix(1)}.x,A]=pair(); [C{1}.x,A,visits]', '[10,20,13]\n', 2],
        ['C={{0},{0}}; [C{ix(1)}{1},C{ix(2)}{1}]=pair(); [C{1}{1},C{2}{1},visits]', '[10,20,123]\n', 3],
        ['function [a,b]=masked(), pause(0); a=99; b=10*isargout(1)+isargout(2); end; A=0; [~,A(ix(1))]=masked(); [A,visits]', '[1,1]\n', 2],
    ])('preserves synchronous order and evaluates destinations once: %s', async (tail, expected, waits) => {
        const synchronous = Interpreter.Create();
        const evaluated = synchronous.Execute((functions + tail).split('pause(0);').join(''));
        expect(synchronous.Unparse(evaluated.list[evaluated.list.length - 1]) + '\n').toBe(expected);
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(functions + tail);
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: expected });
            expect(request).toHaveBeenCalledTimes(waits);
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['host failure', 'abort', 'timeout', 'reset', 'dispose'] as const)('keeps completed writes but skips pending output destinations on %s', async (action) => {
        let entered!: () => void;
        const waiting = new Promise<void>((resolve) => (entered = resolve));
        let fail!: (_reason: Error) => void;
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: () =>
                    new Promise((_resolve, reject) => {
                        fail = reject;
                        entered();
                    }),
            },
        });
        const controller = new AbortController();
        try {
            const session = await runtime.createSession();
            const other = await runtime.createSession();
            await session.execute('A=[0,0];');
            const active = session.execute('function y=waitindex(), pause(0); y=2; end; [A(1),A(waitindex())]=size([1,2]);', {
                signal: controller.signal,
                ...(action === 'timeout' ? { timeoutMs: 1000 } : {}),
            });
            await waiting;
            if (action === 'host failure') fail(new Error('destination failed'));
            else if (action === 'abort') controller.abort('stop destination');
            else if (action === 'reset' || action === 'dispose') await session[action]();
            const result = await active;
            expect(result.status).toBe(action === 'host failure' ? 'error' : action === 'timeout' ? 'timeout' : 'cancelled');
            const following = action === 'dispose' ? undefined : await session.execute(action === 'reset' ? 'exist("A","var")' : 'A');
            expect(following?.outputs[0]).toEqual(action === 'dispose' ? undefined : { type: 'text', text: action === 'reset' ? '0\n' : '[1,0]\n' });
            expect((await other.execute('exist("A","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('loads nested scripts into the function workspace and restores temporary functions and source metadata', async () => {
        const scripts: Record<string, string> = {
            outer: 'x+=2; load("inner"); x=temporary(x); global loadedName; loadedName=mfilename(); function y=temporary(v), pause(0); y=2*v; end;',
            inner: 'x+=1; pause(0);',
        };
        const effects: string[] = [];
        const host: RuntimeHost = {
            request: async (effect) => {
                effects.push(effect.type === 'read-text' ? effect.reference : effect.type);
                return effect.type === 'read-text' ? { value: scripts[effect.reference] } : {};
            },
        };
        const runtime = createInProcessMathJSLabRuntime({ host });
        try {
            const session = await runtime.createSession();
            const result = await session.execute('function y=f(), x=3; load("outer"); y=x; end; z=f(); z');
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: '12\n' });
            expect(effects).toEqual(['outer', 'inner', 'delay', 'delay']);
            expect((await session.execute('[exist("x","var"),exist("temporary","file")]')).outputs[0]).toMatchObject({ text: '[0,0]\n' });
            expect((await session.execute('global loadedName; loadedName')).outputs[0]).toMatchObject({ text: 'outer\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['host failure', 'script failure', 'abort', 'timeout', 'reset', 'dispose'] as const)('unwinds loaded function scopes on %s', async (action) => {
        let entered!: () => void;
        const waiting = new Promise<void>((resolve) => (entered = resolve));
        let fail!: (_reason: Error) => void;
        const host: RuntimeHost = {
            request: (effect) => {
                if (effect.type === 'read-text' && action !== 'host failure') return Promise.resolve({ value: 'global completed; completed+=1; pause(0); error("loaded failure");' });
                return new Promise((resolve, reject) => {
                    fail = reject;
                    entered();
                    if (action === 'script failure') resolve({});
                });
            },
        };
        const runtime = createInProcessMathJSLabRuntime({ host });
        const controller = new AbortController();
        try {
            const session = await runtime.createSession();
            await session.execute('global completed; completed=0; destination=99;');
            const active = session.execute('function y=f(), x=3; load("resource"); y=x; end; destination=f();', {
                signal: controller.signal,
                ...(action === 'timeout' ? { timeoutMs: 1000 } : {}),
            });
            await waiting;
            if (action === 'host failure') fail(new Error('read failed'));
            else if (action === 'abort') controller.abort('stop loaded script');
            else if (action === 'reset' || action === 'dispose') await session[action]();
            expect((await active).status).toBe(action.includes('failure') ? 'error' : action === 'timeout' ? 'timeout' : 'cancelled');
            const after: unknown[] = [];
            if (action !== 'dispose' && action !== 'reset')
                for (const source of ['destination', 'global completed; completed', 'exist("x","var")']) after.push((await session.execute(source)).outputs[0]);
            expect(after).toEqual(
                action === 'dispose' || action === 'reset'
                    ? []
                    : [
                          { type: 'text', text: '99\n' },
                          { type: 'text', text: action === 'host failure' ? '0\n' : '1\n' },
                          { type: 'text', text: '0\n' },
                      ],
            );
        } finally {
            await runtime.dispose();
        }
    });

    test('retains the resource depth guard, host validation and synchronous wait diagnostic', async () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('function f(), load("a"); end; f();')).toThrow('requires an asynchronous driver');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({ value: 'load("again");' }) } });
        try {
            const session = await runtime.createSession();
            expect((await session.execute('load("again");')).diagnostics[0].message).toContain('maximum nesting depth');
            expect((await session.execute('2+2')).outputs[0]).toMatchObject({ text: '4\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('restores the owning numeric configuration when a resource arrives after another session advances', async () => {
        let release!: (_value: { value: string }) => void;
        let entered!: () => void;
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
            const active = first.execute('function y=f(), x=0; load("settings"); y=x; end; f()');
            await waiting;
            await second.execute('configure("precision",40);');
            release({ value: 'x=getconfig("precision");' });
            expect((await active).outputs[0]).toMatchObject({ text: '{precision,20}\n' });
            expect((await second.execute('getconfig("precision")')).outputs[0]).toMatchObject({ text: '{precision,40}\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('delivers invalid resource responses to language catch without leaking function frames', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({ value: 123 }) } });
        try {
            const session = await runtime.createSession();
            const result = await session.execute('function y=f(), localOnly=1; try, load("invalid"); catch, y=7; end; end; f()');
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: '7\n' });
            expect((await session.execute('exist("localOnly","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
