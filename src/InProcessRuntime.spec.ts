import { Interpreter } from './Interpreter';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';

const abortableDelayHost = {
    request: async (_effect: unknown, context: { signal?: AbortSignal }): Promise<{ value?: unknown }> =>
        new Promise((resolve, reject) => {
            const timeout = setTimeout(() => resolve({}), 100);
            context.signal?.addEventListener(
                'abort',
                () => {
                    clearTimeout(timeout);
                    reject(context.signal?.reason);
                },
                { once: true },
            );
        }),
};

describe('InProcessMathJSLabRuntime', () => {
    test.each(['make()(2)', 'make().virtual'])('preserves synchronous class dispatch on a retained return: %s', async (expression) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        try {
            const source =
                'classdef ReturnedProbe; methods; function y=subsref(obj,s), y=42; end; end; end; function y=make(), global calls; calls+=1; pause(0.001); y=ReturnedProbe(); end; global calls; calls=0; ' +
                expression;
            const result = await session.execute(source);
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: '42\n' });
            expect(request).toHaveBeenCalledTimes(1);
            expect((await session.execute('global calls; calls')).outputs[0]).toMatchObject({ text: '1\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('retains receiver, arguments and field order without replaying the factory', async () => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        try {
            const source =
                'function y=make(a), global trace; trace=trace*10+a; pause(a/1000); y=struct("a",[10,20,30]); end; function y=field(), global trace; trace=trace*10+3; pause(0.003); y="a"; end; function y=idx(a), global trace; trace=trace*10+a; pause(a/1000); y=a; end; global trace; trace=0; x=0; a=make(++x).(field())(idx(++x):end); sum(a)+x';
            expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '52\n' });
            expect(effects).toEqual([3, 1, 2]);
            expect((await session.execute('global trace; trace')).outputs[0]).toMatchObject({ text: '312\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test.each([
        ['function y=make(), pause(0.001); y=[10,20,30]; end; make()(g(2):end)', '[20,30]\n', [1, 2]],
        ['function y=make(), pause(0.001); y={10,20}; end; [a,b]=make(){g(1):end}; a+b', '30\n', [1, 1]],
        ['function y=make(), pause(0.001); y=struct("a",[10,20]); end; make().(g("a"))(g(2))', '20\n', [3, 1, 2]],
        ['function y=make(), pause(0.001); y={struct("a",10),struct("a",20)}; end; [a,b]=make(){:}.a; a+b', '30\n', [1]],
        ['function y=make(), pause(0.001); y="abc"; end; make()(g(2):end)', 'bc\n', [1, 2]],
        ['function y=make(), pause(0.001); y=@g; end; make()(2)', '2\n', [1, 2]],
    ] as const)('retains normally dispatched returned receivers: %s', async (source, expected, delays) => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        try {
            const result = await session.execute('function y=g(a), if isnumeric(a), pause(a/1000); else, pause(0.003); end; y=a; end; ' + source);
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: expected });
            expect(effects).toEqual(delays);
        } finally {
            await runtime.dispose();
        }
    });

    test.each([
        ['a=[10,20,30]; sum(a([f(1),end]))', '40\n', [1000]],
        ['c={10,20}; a=[c{:},f(3)]; sum(a)', '33\n', [3000]],
        ['c={10,20}; a={c{:},f(3)}; a{1}+a{2}+a{3}', '33\n', [3000]],
        ['a=[[],f(1);f(2),f(3)]; 99', undefined, [1000, 2000, 3000]],
        ['try, a=[f(1),f(2),f(3)]; catch, end; x', '2\n', [1000, 2000]],
    ] as const)('preserves expansion, construction and failure order: %s', async (body, expected, delays) => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    if (body.startsWith('try') && effects.length === 2) throw new Error('literal host failure');
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        try {
            const result = await session.execute('function y=f(a), global x; x+=1; pause(a); y=a; end; global x; x=0; ' + body);
            expect(result.status).toBe(expected ? 'success' : 'error');
            const output = result.outputs[0];
            expect(output?.type === 'text' ? output.text : undefined).toBe(expected);
            expect(effects).toEqual(delays);
            expect((await session.execute('global x; x')).outputs[0]).toMatchObject({ text: `${effects.length}\n` });
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['[f(x++),f(x++);f(x++),f(x++)]', '{f(x++),f(x++)}'])('resumes literal elements once: %s', async (literal) => {
        const effects: unknown[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    effects.push(effect);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        try {
            const result = await session.execute(`function y=f(a), pause(a); y=a+1; end; x=0; a=${literal}; x`);
            expect(result.status).toBe('success');
            const count = literal.startsWith('[') ? 4 : 2;
            expect(result.outputs[0]).toMatchObject({ text: `${count}\n` });
            expect(effects).toEqual(Array.from({ length: count }, (_, index) => ({ type: 'delay', milliseconds: index * 1000 })));
        } finally {
            await runtime.dispose();
        }
    });
    test.each([
        'function y=f(x), y=x+1; end; a=[f(1),f(2)]; sum(a)',
        'function y=f(x), y=x+1; end; c={f(1),f(2)}; c{1}+c{2}',
        'x=2; x+=3; x',
        'a=[1,2]; sum(a)',
        's=0; for i=1:3, s+=i; end; s',
    ])('matches synchronous execution: %s', async (source) => {
        const interpreter = Interpreter.Create();
        const sync = interpreter.Evaluate(interpreter.Parse(source));
        const runtime = createInProcessMathJSLabRuntime();
        const session = await runtime.createSession();
        const result = await session.execute(source);
        const last = sync.type === 'LIST' ? sync.list[sync.list.length - 1] : sync;
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: `${interpreter.Unparse(last)}\n` });
        await runtime.dispose();
    });

    test('evaluates arguments and effects once and preserves previous value', async () => {
        const effects: unknown[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    effects.push(effect);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('x=0; 42; pause(x++); pause(x++);');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: '42\n' });
        expect(effects).toEqual([
            { type: 'delay', milliseconds: 0 },
            { type: 'delay', milliseconds: 1000 },
        ]);
        expect((await session.execute('x')).outputs[0]).toMatchObject({ text: '2\n' });
        await runtime.dispose();
    });

    test.each(['pause=[7,8]; pause(1)', 'function y=pause(x), y=x+4; end; pause(3)'])('honors name resolution: %s', async (source) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '7\n' });
        expect(request).not.toHaveBeenCalled();
        await runtime.dispose();
    });

    test('suspends inside an ordinary function body', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        expect((await session.execute('function f(), pause(0); end; f()')).status).toBe('success');
        expect(request).toHaveBeenCalledTimes(1);
        await runtime.dispose();
    });

    test.each(['function y=f(a), pause(a); y=a+4; end; x=0; z=x+++f(x++); z', 'function y=f(a), pause(a); y=a+4; end; h=@f; x=0; z=x+++h(x++); z'])(
        'retains evaluated arguments and operands: %s',
        async (source) => {
            const request = jest.fn(async (_effect: unknown) => ({}));
            const runtime = createInProcessMathJSLabRuntime({ host: { request } });
            const session = await runtime.createSession();
            expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '5\n' });
            expect(request).toHaveBeenCalledTimes(1);
            expect(request.mock.calls[0][0]).toEqual({ type: 'delay', milliseconds: 1000 });
            expect((await session.execute('x')).outputs[0]).toMatchObject({ text: '2\n' });
            await runtime.dispose();
        },
    );

    test('returns through nested calls and catches a host failure in the callee', async () => {
        const request = jest.fn(async () => {
            throw new Error('host failed');
        });
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const source = 'function y=f(a), try, pause(a); catch, y=a+6; end; end; function y=g(a), y=2+f(a); end; z=g(3); z';
        expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '11\n' });
        expect(request).toHaveBeenCalledTimes(1);
        await runtime.dispose();
    });

    test('keeps short-circuit calls unevaluated', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        expect((await session.execute('function y=f(), pause(0); y=1; end; 0 && f(); 1 || f()')).status).toBe('success');
        expect(request).not.toHaveBeenCalled();
        await runtime.dispose();
    });

    test('stores persistent state once per retained call and keeps locals out of the workspace', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const source = 'function y=f(), persistent n=0; n+=1; pause(0); localOnly=99; y=n; end; a=f(); b=f(); a+b';
        expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '3\n' });
        expect(request).toHaveBeenCalledTimes(2);
        expect((await session.execute('exist("localOnly","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        await runtime.dispose();
    });

    test.each(['function y=f(a), y=a; end; z=f(pause(0))', 'function f(), load("x"); end; f()'])('rejects waits at remaining call boundaries: %s', async (source) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        expect((await session.execute(source)).status).toBe('error');
        expect(request).not.toHaveBeenCalled();
        await runtime.dispose();
    });

    test.each([
        ['function y=g(a), pause(a); y=a+1; end; function y=f(a,b), y=10*a+b; end; x=0; z=f(g(x++),g(x++)); z+x', '14\n', [0, 1000]],
        ['function y=g(a), pause(a); y=a+1; end; function y=f(a=2,b=g(a)), y=a+b; end; f()', '5\n', [2000]],
        ['function y=g(a), pause(a); y=a+1; end; function y=f(a=2,b=g(a)), y=a+b; end; f(:,g(4))', '7\n', [4000]],
        ['function y=g(), pause(0); y=isargout(1); end; function [a,b]=f(x), b=x+nargout; end; [~,z]=f(g()); z', '3\n', [0]],
        ['function [a,b]=f(x), pause(0); a=x; b=x+1; end; [a,b]=f(3); a+b', '7\n', [0]],
        ['function y=g(), pause(0); y=2; end; function y=f(varargin), y=sum([varargin{:}]); end; c={3,4}; f(g(),c{:})', '9\n', [0]],
    ])('resumes input/default binding and requested outputs: %s', async (source, expected, milliseconds) => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute(source);
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: expected });
        expect(effects).toEqual(milliseconds);
        await runtime.dispose();
    });

    test.each(['Scale=g()', ''])('resumes name-value arguments and defaults: %s', async (argument) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const source = 'function y=g(), pause(0); y=3; end; function y=f(opts), arguments, opts.Scale=g(); end; y=opts.Scale; end; f(' + argument + ')';
        expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '3\n' });
        // The existing declaration semantics evaluate defaults before explicit overrides.
        expect(request).toHaveBeenCalledTimes(argument ? 2 : 1);
        await runtime.dispose();
    });

    test('a binding failure reaches the caller catch and skips later arguments and the body', async () => {
        const request = jest.fn(async () => {
            throw new Error('binding failed');
        });
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const source =
            'function y=g(), pause(0); y=1; end; function y=f(a,b), global entered; entered=1; y=a+b; end; ' +
            'global entered; entered=0; x=0; caught=0; try, z=f(g(),x++); catch, caught=1; end; caught+x+entered';
        expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '1\n' });
        expect(request).toHaveBeenCalledTimes(1);
        await runtime.dispose();
    });

    test('argument binding yields cooperative checkpoints before the callee body starts', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const session = await runtime.createSession();
        await session.execute('global entered; entered=0');
        const source = 'function y=g(), while true, end; y=1; end; function y=f(a), global entered; entered=1; y=a; end; f(g())';
        expect((await session.execute(source, { timeoutMs: 100 })).status).toBe('timeout');
        expect((await session.execute('global entered; entered')).outputs[0]).toMatchObject({ text: '0\n' });
        await runtime.dispose();
    });

    test.each([
        ['function y=g(a), pause(a); y=a+1; end; x=0; c=4; h=@(a) c+g(a); c=100; z=-h(g(x++)); z+x', '-5\n', [0, 1000]],
        ['function y=g(a), pause(a); y=a+1; end; z=(@(a) -g(a))(2); z', '-3\n', [2000]],
        ['function y=g(a), pause(a); y=a; end; x=0; if g(x++)==0 & g(x++)==1, x+=10; end; x', '12\n', [0, 1000]],
        ['function y=g(a), pause(a); y=a; end; x=0; if g(0) & g(x++), x=99; end; if g(1) | g(x++), x+=2; end; x', '2\n', [0, 1000]],
        ['function y=g(a), pause(a); y=a; end; x=0; switch g(x++), case g(1), x=99; case g(0), x+=5; end; x', '6\n', [0, 1000, 0]],
        ['function y=g(a), pause(a); y=a; end; x=0; while g(x++)<3, end; x', '4\n', [0, 1000, 2000, 3000]],
        ['function y=g(a), pause(a); y=a; end; x=0; do, x+=1; continue; until g(x)>=2; x', '2\n', [1000, 2000]],
        ['function y=g(a), pause(a); y=a; end; s=0; for i=(g(1):g(2):g(5)), s+=i; end; s', '9\n', [1000, 5000, 2000]],
        ["function y=g(a), pause(a); y=a; end; z=(g(2)+1)'; z", '3\n', [2000]],
    ])('resumes anonymous/unary/control expressions: %s', async (source, expected, milliseconds) => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute(source);
        expect(result.diagnostics).toEqual([]);
        expect(result).toMatchObject({ status: 'success' });
        expect(result.outputs[0]).toMatchObject({ text: expected });
        expect(effects).toEqual(milliseconds);
        await runtime.dispose();
    });

    test.each([
        ['x=0; z=plus(g(x++),g(x++)); z+x', '3\n', [0, 1000]],
        ['x=0; z=max(g(x++),g(x++)); z+x', '2\n', [0, 1000]],
        ['x=0; a=[10,20,30]; z=a(g(++x)); z+x', '11\n', [1000]],
        ['x=0; c={10,20,30}; z=c{g(++x)}; z+x', '11\n', [1000]],
        ['x=0; a=[10,20,30]; z=a(g(++x):end); sum(z)+x', '61\n', [1000]],
        ['x=0; a=[10,20,30]; z=a(:,g(++x)); sum(z)+x', '11\n', [1000]],
        ["x=0; a='abc'; z=a(g(++x):end); z", 'abc\n', [1000]],
        ['c={2,3}; z=plus(g(1),c{g(1)}); z', '3\n', [1000, 1000]],
        ['a=[1,2;3,4]; function y=m(), pause(0); y=[1,2;3,4]; end; [r,c]=size(m()); r+c', '4\n', [0]],
        ["a=[10,20,30]; function y=h(), assignin('base','a',99); pause(0); y=1; end; z=a(h():end); sum(z)+a", '159\n', [0]],
        ['C=reshape({1,2,3,4,5,6,7,8},[2,2,2]); [a,b,c,d]=C{:,:,g(2)}; a+b+c+d', '26\n', [2000]],
        ['A=reshape(1:8,[2,2,2]); z=A(:,:,g(2)); sum(z(:))', '26\n', [2000]],
        ['pause(g(0)); 7', '7\n', [0, 0]],
    ])('retains builtin and native index inputs: %s', async (body, expected, delays) => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(a), pause(a); y=a; end; ' + body);
        expect(result.diagnostics).toEqual([]);
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: expected });
        expect(effects).toEqual(delays);
        await runtime.dispose();
    });

    test.each(["feval('sum',g())", "builtin('sum',g())"])('rejects waits in raw forwarded inputs before requesting the host: %s', async (call) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        expect((await session.execute('function y=g(), pause(0); y=1; end; ' + call)).status).toBe('error');
        expect(request).not.toHaveBeenCalled();
        expect((await session.execute('1+1')).outputs[0]).toMatchObject({ text: '2\n' });
        await runtime.dispose();
    });

    test.each(['a=2', 'a=[1,2]', "a='ab'"])('validates native receivers before evaluating indices: %s', async (setup) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(), pause(0); y=1; end; ' + setup + '; a{g()}');
        expect(result.status).toBe('error');
        expect(result.diagnostics[0].message).toContain('matrix cannot be indexed with {');
        expect(request).not.toHaveBeenCalled();
        await runtime.dispose();
    });

    test.each([
        ['a=[10,20]; x=0; a(g(++x))=g(++x); sum(a)+x', '13\n', [1000, 2000]],
        ['x=1; x+=g(++x); x', '4\n', [2000]],
        ['a=[10,20]; x=0; a(g(++x))+=g(++x); sum(a)+x', '33\n', [1000, 2000]],
        ['a=[10,20]; x=0; a(g(++x))=9; sum(a)+x', '30\n', [1000]],
        ['a(g(1))=g(3); a', '[3]\n', [3000, 1000]],
        ['c={10,20}; c{g(1)}=g(3); c{1}+c{2}', '23\n', [3000, 1000]],
        ["function y=s(), pause(0); y='Z'; end; t='abc'; t(g(2))=s(); t", 'aZc\n', [0, 2000]],
        ['a=reshape(1:8,[2,2,2]); a(:,:,g(2))=g(9); sum(a(:))', '46\n', [9000, 2000]],
        ['function y=emptyvalue(), pause(0); y=[]; end; a=[10,20,30]; a(g(2))=emptyvalue(); sum(a)', '40\n', [0, 2000]],
        ["function y=indexvalue(), assignin('base','t','xyz'); pause(0); y=2; end; t='abc'; t(indexvalue())='Q'; t", 'aQc\n', [0]],
        ['a=[10,20]; a(end+g(1))=g(9); sum(a)', '39\n', [9000, 1000]],
        ["function y=rhs(), assignin('base','a',[100,200]); pause(0); y=2; end; a=[10,20]; a(g(1))+=rhs(); sum(a)", '302\n', [0, 1000]],
        ['a=[10,20]; a(g(1))*=g(2); sum(a)', '40\n', [2000, 1000]],
        ['a=[10,20,30]; z=a(g(1):g(3))(g(2)); z', '20\n', [1000, 3000, 2000]],
        ["t='abcd'; z=t(g(2):end)(g(2)); z", 'c\n', [2000, 2000]],
    ])('retains assignment and numeric/string chain stages: %s', async (body, expected, delays) => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(a), pause(a); y=a; end; ' + body);
        expect(result.diagnostics).toEqual([]);
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: expected });
        expect(effects).toEqual(delays);
        await runtime.dispose();
    });

    test.each([
        ['g=[1,2]; c={[10,20]}; c{g(1)}(g(2))=g(1); sum(c{1})', '11\n', []],
        ['c={[10,20],[30,40]}; [~,b]=c{:}(g(2)); b', '40\n', [2000, 2000]],
        ['c={[10,20],[30,40]}; [a,b]=c{:}(end-g(0)); a+b', '60\n', [0, 0]],
        ['c={[10,20,30,40]}; x=0; c{g(++x)}(end-g(++x))=g(++x); sum(c{1})+x', '86\n', [1000, 2000, 3000]],
        ['s.a=[10,20]; s.a(end-g(1))=g(3); sum(s.a)', '23\n', [1000, 3000]],
        ['s.a=[10,20]; s.a(g(2))=g(3); sum(s.a)', '13\n', [2000, 3000]],
        ['s.a=[10,20]; s.a(g(2))+=g(3); sum(s.a)', '33\n', [2000, 3000]],
        ['c={[10,20]}; c{g(1)}(g(2))=g(3); sum(c{1})', '13\n', [1000, 2000, 3000]],
        ['c={[10,20]}; c{g(1)}(g(2))+=g(3); sum(c{1})', '33\n', [1000, 2000, 3000]],
        ["function y=fieldname(), pause(0); y='a'; end; s.a=10; s.(fieldname())=g(3); s.a", '3\n', [0, 3000]],
        ["function y=fieldname(), pause(0); y='a'; end; s.a=[10,20]; s.(fieldname())(g(2))=g(3); sum(s.a)", '13\n', [0, 2000, 3000]],
        ['c={[10,20],[30,40]}; c{g(2)}(g(1))', '30\n', [2000, 1000]],
        ['s.a=[10,20]; s.a(g(2))', '20\n', [2000]],
        ["function y=fieldname(), pause(0); y='a'; end; s.a=[10,20]; s.(fieldname())(g(2))", '20\n', [0, 2000]],
        ['c={struct("a",[10,20])}; c{g(1)}.a(g(2))', '20\n', [1000, 2000]],
        ['c={[10,20],[30,40]}; [a,b]=c{:}(g(2)); a+b', '60\n', [2000, 2000]],
        ['c={struct("a",10),struct("a",20)}; [a,b]=c{g(1):g(2)}.a; a+b', '30\n', [1000, 2000]],
    ])('retains native field/cell preparation and receiver chains: %s', async (body, expected, delays) => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(a), pause(a); y=a; end; ' + body);
        expect(result.diagnostics).toEqual([]);
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: expected });
        expect(effects).toEqual(delays);
        await runtime.dispose();
    });

    test('invalid dynamic destination names stop before RHS effects and leave the session reusable', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(a), pause(a); y=a; end; s.a=10; x=0; s.(g(++x))=g(++x)');
        expect(result.status).toBe('error');
        expect(result.diagnostics[0].message).toContain('field names must be strings');
        expect(request).toHaveBeenCalledTimes(1);
        expect((await session.execute('s.a+x')).outputs[0]).toMatchObject({ text: '11\n' });
        await runtime.dispose();
    });

    test('a failed descriptor wait reaches catch without evaluating the RHS or mutating the target', async () => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') {
                        effects.push(effect.milliseconds);
                        if (effects.length === 2) throw new Error('descriptor stopped');
                    }
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(a), pause(a); y=a; end; c={[10,20]}; x=0; caught=0; try, c{g(++x)}(g(++x))=g(++x); catch, caught=1; end; sum(c{1})+x+caught');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: '33\n' });
        expect(effects).toEqual([1000, 2000]);
        await runtime.dispose();
    });

    test('a missing compound target fails after RHS but before index effects', async () => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(a), pause(a); y=a; end; x=0; a(g(++x))+=g(1)');
        expect(result.status).toBe('error');
        expect(result.diagnostics[0].message).toContain('must be defined first');
        expect(effects).toEqual([1000]);
        expect((await session.execute('x')).outputs[0]).toMatchObject({ text: '0\n' });
        await runtime.dispose();
    });

    test('an index wait failure reaches catch without writing or replaying the RHS', async () => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') {
                        effects.push(effect.milliseconds);
                        if (effects.length === 2) throw new Error('index failed');
                    }
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('function y=g(a), pause(a); y=a; end; a=[10,20]; x=0; caught=0; try, a(g(++x))=g(++x); catch, caught=1; end; sum(a)+x+caught');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: '33\n' });
        expect(effects).toEqual([1000, 2000]);
        await runtime.dispose();
    });

    test('a suspended predicate failure reaches catch without selecting a branch', async () => {
        const request = jest.fn(async () => {
            throw new Error('predicate failed');
        });
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const source = 'function y=g(), pause(0); y=1; end; x=0; caught=0; try, if g(), x=99; else, x=100; end; catch, caught=1; end; x+caught';
        expect((await session.execute(source)).outputs[0]).toMatchObject({ text: '1\n' });
        expect(request).toHaveBeenCalledTimes(1);
        await runtime.dispose();
    });

    test.each(['if pause(0), end', 'switch pause(0), case 1, end', 'for i=(pause(0)), end'])('rejects no-output effects used as control values: %s', async (source) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        expect((await session.execute(source)).status).toBe('error');
        expect(request).not.toHaveBeenCalled();
        await runtime.dispose();
    });

    test('propagates host failure without executing the following instruction', async () => {
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async () => {
                    throw new Error('host failed');
                },
            },
        });
        const session = await runtime.createSession();
        expect(await session.execute('x=1; pause(0); x=99')).toMatchObject({ status: 'error', diagnostics: [{ message: 'host failed' }] });
        expect((await session.execute('x')).outputs[0]).toMatchObject({ text: '1\n' });
        await runtime.dispose();
    });

    test.each(['x=1; pause(0); x=99', 'function f(), pause(0); end; x=1; f(); x=99', 'function y=g(), pause(0); y=1; end; function y=f(a), y=a; end; x=1; z=f(g()); x=99'])(
        'cancels an uncooperative host and isolates configuration: %s',
        async (source) => {
            let finish!: (_result: { value?: unknown }) => void;
            const runtime = createInProcessMathJSLabRuntime({
                host: {
                    request: () =>
                        new Promise((resolve) => {
                            finish = resolve;
                        }),
                },
            });
            const first = await runtime.createSession();
            const second = await runtime.createSession();
            await first.execute("configure('precision',20)");
            const controller = new AbortController();
            const execution = first.execute(source, { signal: controller.signal });
            await second.execute("configure('precision',40)");
            controller.abort('stop');
            expect(await execution).toMatchObject({ status: 'cancelled' });
            finish({});
            expect((await first.execute('x')).outputs[0]).toMatchObject({ text: '1\n' });
            expect((await first.execute("getconfig('precision')")).outputs[0]).toMatchObject({ text: '{precision,20}\n' });
            expect((await second.execute("getconfig('precision')")).outputs[0]).toMatchObject({ text: '{precision,40}\n' });
            await runtime.dispose();
        },
    );

    test.each([
        ['x=0; if x++==0, pause(0); x+=10; else, x=99; end; x', 11, 1],
        ['x=0; switch x++, case 0, pause(0); x+=10; otherwise, x=99; end; x', 11, 1],
        ['n=0; s=0; for i=1:(n++ +3), pause(0); s+=i; end; s+n', 7, 3],
        ['x=0; while x<3, pause(x++); end; x', 3, 3],
        ['x=0; do, x+=1; pause(0); until x>=3; x', 3, 3],
    ])('resumes migrated control frames without replay: %s', async (source, expected, count) => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const result = await session.execute(String(source));
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: `${expected}\n` });
        expect(request).toHaveBeenCalledTimes(Number(count));
        await runtime.dispose();
    });

    test('propagates continue, break and return through resumed nested blocks', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        const result = await session.execute('s=0; for i=1:5, pause(0); if i==2, continue; end; if i==4, break; end; s+=i; end; s');
        expect(result.outputs[0]).toMatchObject({ text: '4\n' });
        expect(request).toHaveBeenCalledTimes(4);
        expect((await session.execute('x=1; if true, pause(0); return; end; x=99')).status).toBe('success');
        expect((await session.execute('x')).outputs[0]).toMatchObject({ text: '1\n' });
        await runtime.dispose();
    });

    test('delivers host failure to language catch and executes cleanup once', async () => {
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async () => {
                    throw new Error('host failed');
                },
            },
        });
        const session = await runtime.createSession();
        const result = await session.execute('x=0; try, unwind_protect, x+=1; pause(0); x=99; unwind_protect_cleanup, x+=10; end_unwind_protect; catch e, caught=e.message; x+=100; end; x');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ text: '111\n' });
        expect((await session.execute('caught')).outputs[0]).toMatchObject({ text: expect.stringContaining('host failed') });
        await runtime.dispose();
    });

    test('can suspend in cleanup and preserves the original failure', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        const session = await runtime.createSession();
        expect((await session.execute('x=0; unwind_protect, x+=1; error("body failed"); unwind_protect_cleanup, pause(0); x+=10; end_unwind_protect')).status).toBe('error');
        expect(request).toHaveBeenCalledTimes(1);
        expect((await session.execute('x')).outputs[0]).toMatchObject({ text: '11\n' });
        await runtime.dispose();
    });

    test('cancels an infinite loop at checkpoints, bypasses catch and executes synchronous cleanup', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const session = await runtime.createSession();
        await session.execute('x=0; caught=0; cleaned=0');
        const result = await session.execute('try, unwind_protect, while true, x+=1; end; unwind_protect_cleanup, cleaned+=1; end_unwind_protect; catch, caught=1; end', { timeoutMs: 100 });
        expect(result.status).toBe('timeout');
        expect((await session.execute('caught')).outputs[0]).toMatchObject({ text: '0\n' });
        expect((await session.execute('cleaned')).outputs[0]).toMatchObject({ text: '1\n' });
        expect((await session.execute('x>0')).status).toBe('success');
        await runtime.dispose();
    });

    test.each([
        "function y=g(), pause(0); y=1; end; c={[1,2]}; c{g()}(2)=3; observed=getconfig('precision'); observed",
        "function y=g(), pause(0); y='a'; end; s.a=1; s.(g())=2; observed=getconfig('precision'); observed",
        "for i=1:1, pause(0); observed=getconfig('precision'); end; observed",
        "function y=f(), pause(0); y=getconfig('precision'); end; observed=f(); observed",
        "function y=g(), pause(0); y=getconfig('precision'); end; function y=f(a), y=a; end; observed=f(g()); observed",
        "function y=g(), pause(0); y=getconfig('precision'); end; function y=f(a=g()), y=a; end; observed=f(); observed",
        "function y=g(), pause(0); y=getconfig('precision'); end; h=@()g(); observed=h(); observed",
        "function y=g(), pause(0); y=1; end; if g(), observed=getconfig('precision'); end; observed",
        "function y=g(), pause(0); y='precision'; end; observed=getconfig(g()); observed",
        "function y=g(), pause(0); y=1; end; a={getconfig('precision')}; observed=a{g()}; observed",
        "function y=g(), pause(0); y=1; end; a=[1,2]; a(g())=3; observed=getconfig('precision'); observed",
        "function y=g(), pause(0); y=getconfig('precision'); end; c={g()}; observed=c{1}; observed",
        "function y=g(), pause(0); y={getconfig('precision')}; end; observed=g(){1}; observed",
    ])('restores session numeric configuration after a retained wait: %s', async (source) => {
        let release!: (_value: { value?: unknown }) => void;
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: () =>
                    new Promise((resolve) => {
                        release = resolve;
                    }),
            },
        });
        const first = await runtime.createSession();
        const second = await runtime.createSession();
        await first.execute("configure('precision',20)");
        const execution = first.execute(source);
        await second.execute("configure('precision',40)");
        release({});
        expect((await execution).outputs[0]).toMatchObject({ text: '{precision,20}\n' });
        const checkpointed = first.execute("for i=1:100, observed=getconfig('precision'); end; observed");
        await second.execute("configure('precision',40)");
        expect((await checkpointed).outputs[0]).toMatchObject({ text: '{precision,20}\n' });
        expect((await second.execute("getconfig('precision')")).outputs[0]).toMatchObject({ text: '{precision,40}\n' });
        await runtime.dispose();
    });

    test('checkpoints cover empty loops', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const session = await runtime.createSession();
        expect((await session.execute('while true, end', { timeoutMs: 5 })).status).toBe('timeout');
        expect((await session.execute('1+1')).outputs[0]).toMatchObject({ text: '2\n' });
        await runtime.dispose();
    });

    test('cancels a nested wait without entering catch and restores spmd context', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: () => new Promise(() => undefined) } });
        const session = await runtime.createSession();
        const controller = new AbortController();
        const execution = session.execute(
            'caught=0; cleaned=0; spmdIndex=9; spmd, try, unwind_protect, pause(0); unwind_protect_cleanup, cleaned+=1; end_unwind_protect; catch, caught=1; end; end',
            { signal: controller.signal },
        );
        controller.abort('stop nested wait');
        expect((await execution).status).toBe('cancelled');
        expect((await session.execute('caught')).outputs[0]).toMatchObject({ text: '0\n' });
        expect((await session.execute('cleaned')).outputs[0]).toMatchObject({ text: '1\n' });
        expect((await session.execute('spmdIndex')).outputs[0]).toMatchObject({ text: '9\n' });
        await runtime.dispose();
    });

    test('bounds cancellation unwind when cleanup contains an infinite loop', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: () => new Promise(() => undefined) } });
        const session = await runtime.createSession();
        const controller = new AbortController();
        const execution = session.execute('cleaned=0; unwind_protect, pause(0); unwind_protect_cleanup, cleaned+=1; while true, end; end_unwind_protect', { signal: controller.signal });
        controller.abort('stop cleanup');
        expect((await execution).status).toBe('cancelled');
        expect((await session.execute('cleaned')).outputs[0]).toMatchObject({ text: '1\n' });
        await runtime.dispose();
    });

    test('keeps workspaces independent and exposes structured output', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const first = await runtime.createSession();
        const second = await runtime.createSession();

        await expect(first.execute('x = 41;')).resolves.toMatchObject({ status: 'success' });
        const result = await first.execute('x + 1');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '42\n' });
        await expect(second.execute('x')).resolves.toMatchObject({ status: 'error' });

        await runtime.dispose();
    });

    test('isolates numeric configuration between sessions', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const first = await runtime.createSession();
        const second = await runtime.createSession();

        await first.execute("configure('precision', 20)");
        await second.execute("configure('precision', 40)");
        const firstResult = await first.execute("getconfig('precision')");
        const secondResult = await second.execute("getconfig('precision')");

        expect(firstResult.outputs[0]).toMatchObject({ type: 'text', text: '{precision,20}\n' });
        expect(secondResult.outputs[0]).toMatchObject({ type: 'text', text: '{precision,40}\n' });
        await runtime.dispose();
    });

    test('reports pre-aborted executions without evaluating source', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const session = await runtime.createSession();
        const controller = new AbortController();
        controller.abort('replaced');
        await expect(session.execute('x = 1', { signal: controller.signal })).resolves.toMatchObject({ status: 'cancelled' });
        await runtime.dispose();
    });

    test('interrupts an active host effect and keeps the session reusable', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: abortableDelayHost });
        const session = await runtime.createSession();
        const execution = session.execute('pause(1)');
        await new Promise((resolve) => setTimeout(resolve, 5));
        await session.interrupt('stop active effect');
        await expect(execution).resolves.toMatchObject({ status: 'cancelled', diagnostics: [{ code: 'MATHJSLAB_ABORTED', message: 'stop active effect' }] });
        await expect(session.execute('1+1')).resolves.toMatchObject({
            status: 'success',
            outputs: expect.arrayContaining([expect.objectContaining({ type: 'text', text: '2\n' })]),
        });
        await runtime.dispose();
    });

    test('times out an active host effect and permits a retry', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: abortableDelayHost });
        const session = await runtime.createSession();
        await expect(session.execute('pause(1)', { timeoutMs: 5 })).resolves.toMatchObject({ status: 'timeout', diagnostics: [{ code: 'MATHJSLAB_TIMEOUT' }] });
        await expect(session.execute('1+1')).resolves.toMatchObject({ status: 'success' });
        await runtime.dispose();
    });

    test('cancels active host effects when the session is disposed', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: abortableDelayHost });
        const session = await runtime.createSession();
        const execution = session.execute('pause(1)');
        await new Promise((resolve) => setTimeout(resolve, 5));
        await session.dispose();
        await expect(execution).resolves.toMatchObject({ status: 'cancelled', diagnostics: [{ code: 'MATHJSLAB_DISPOSED' }] });
        await expect(session.execute('1')).rejects.toThrow('MathJSLab runtime session is disposed.');
        await runtime.dispose();
    });

    test('suspends at a resource capability and resumes the same workspace', async () => {
        const effects: string[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    effects.push(effect.type);
                    return { value: 'loaded = base + 2;' };
                },
            },
        });
        const session = await runtime.createSession({ id: 'effects' });
        const result = await session.execute('base = 40; load("memory:test.m"); loaded');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '42\n' });
        expect(effects).toEqual(['read-text']);
        await runtime.dispose();
    });

    test('lets a host adapter publish serializable visualization descriptors', async () => {
        const runtime = createInProcessMathJSLabRuntime({
            evaluate: (_interpreter, operation) => ({ value: operation(), outputs: [{ type: 'visualization', renderer: 'test', request: { series: [1, 2] } }] }),
        });
        const session = await runtime.createSession();
        const result = await session.execute('1+1');
        expect(result.outputs).toContainEqual({ type: 'visualization', renderer: 'test', request: { series: [1, 2] } });
        await runtime.dispose();
    });

    test('never parallelizes parfor silently', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const fallback = await runtime.createSession({ parfor: 'fallback' });
        const strict = await runtime.createSession({ parfor: 'strict' });
        const source = 's=0; parfor i=1:3, s+=i; end; s';
        await expect(fallback.execute(source)).resolves.toMatchObject({ status: 'success', diagnostics: [{ code: 'MATHJSLAB_PARFOR_SEQUENTIAL_FALLBACK' }] });
        await expect(strict.execute(source)).resolves.toMatchObject({ status: 'error', diagnostics: [{ code: 'MATHJSLAB_PARFOR_NOT_ELIGIBLE' }] });
        await runtime.dispose();
    });
});
