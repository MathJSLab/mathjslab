import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HostEffectResult } from './execution-contracts';
import { Interpreter } from './Interpreter';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
const definitions = readFileSync(join(process.cwd(), 'test/node/fixtures/resumable-protocols.m'), 'utf8');
const init = 'global protocolTrace; protocolTrace=0; ';
jest.setTimeout(15000);
describe('Retained class coercion and index protocols', () => {
    test.each([
        ['value=nthargout(2,@protocolPair); [value,protocolTrace]', '[102,9]\n', 1],
        ['value=nthargout([2,1],@protocolPair); isequal(value,{102,101})&&protocolTrace==9', 'true\n', 1],
        ['value=nthargout(2,@size,RetainedProtocol(2)); [value,protocolTrace]', '[102,5]\n', 1],
        ['value=spfun(@protocolMap,[1,0;2,3]); isequal(value,[2,0;4,6])&&protocolTrace==123', 'true\n', 3],
        ['value=spfun(@(x)double(RetainedProtocol(x)),[1,0,2]); [value,protocolTrace]', '[1,0,2,44]\n', 2],
        ['global protocolA; protocolA=[7,8]; p=MutatingProtocolIndex(); result=subsasgn(protocolA,substruct("()",{p}),9); [protocolA,result,protocolTrace]', '[7,99,9,8,3]\n', 1],
        ['p=RetainedProtocol(2); box=ProtocolContainer(); C={box.apply}; value=subsref(C,substruct("{}",{1},"()",{p})); [value,protocolTrace]', '[2,4]\n', 1],
        ['p=RetainedProtocol(2); C={p.double}; value=subsref(C,substruct("{}",{1},"()",{})); [value,protocolTrace]', '[2,4]\n', 1],
        ['p=RetainedProtocol(2); q=RetainedProtocol(3); C={p.double,q.double}; [a,b]=subsref(C,substruct("{}",{":"},"()",{})); [a,b,protocolTrace]', '[2,3,44]\n', 2],
        ['p=RetainedProtocol(2); q=RetainedProtocol(3); C={p.double,q.double}; [~,b]=subsref(C,substruct("{}",{":"},"()",{})); [b,protocolTrace]', '[3,44]\n', 2],
        ['p=RetainedProtocol(2); p+=3; [p,protocolTrace]', '[5,6]\n', 1],
        ['p=RetainedProtocol(0); box=ProtocolContainer(); box.values(p)=9; [box.values,protocolTrace]', '[9,8,3]\n', 1],
        ['p=RetainedProtocol(0); box=ProtocolContainer(); value=subsref(box,substruct(".","values","()",{p})); [value,protocolTrace]', '[7,3]\n', 1],
        ['p=RetainedProtocol(0); box=ProtocolContainer(); box=subsasgn(box,substruct(".","values","()",{p}),9); [box.values,protocolTrace]', '[9,8,3]\n', 1],
        ['p=RetainedProtocol(0); boxes=[ProtocolContainer(),ProtocolContainer()]; value=subsref(boxes,substruct("()",{p},".","values","()",{1})); [value,protocolTrace]', '[7,3]\n', 1],
        ['p=RetainedProtocol(0); C={ProtocolContainer()}; value=subsref(C,substruct("{}",{p},".","values","()",{1})); [value,protocolTrace]', '[7,3]\n', 1],
        ['box=ProtocolContainer(); listener=addlistener(box,"Changed",@(a,b)0); listener.Enabled=RetainedProtocol(0); [listener.Enabled,protocolTrace]', '[false,1]\n', 1],
        ['p=RetainedProtocol(0); descriptor=substruct("()",{p}); value=subsref([7,8],descriptor); isobject(descriptor.subs{1})&&value==7&&protocolTrace==3', 'true\n', 1],
        ['p=RetainedProtocol(2); [~,b]=feval("size",p); [b,protocolTrace]', '[2,5]\n', 1],
        ['values=[RetainedProtocol(1),RetainedProtocol(2)]; result=values+[10;20]; isequal(result,[11,12;21,22])&&protocolTrace==6666', 'true\n', 4],
        ['values=[RetainedProtocol(1),RetainedProtocol(2)]; result=feval("plus",values,10); [result,protocolTrace]', '[11,12,66]\n', 2],
        ['values=[RetainedProtocol(1),RetainedProtocol(2)]; result=-values; [result,protocolTrace]', '[-1,-2,77]\n', 2],
        ['p=RetainedProtocol(1); result=p:3; [result,protocolTrace]', '[1,3,8]\n', 1],
        ['p=RetainedProtocol(1); result=colon(p,3); [result,protocolTrace]', '[1,3,8]\n', 1],
        ['p=RetainedProtocol(0); A=[7,8]; value=subsref(A,substruct("()",{p})); [value,protocolTrace]', '[7,3]\n', 1],
        ['p=RetainedProtocol(0); A=[7,8]; A=subsasgn(A,substruct("()",{p}),9); [A,protocolTrace]', '[9,8,3]\n', 1],
        ['p=RetainedProtocol(0); C={7,8}; value=C{p}; [value,protocolTrace]', '[7,3]\n', 1],
        ['p=RetainedProtocol(0); text="ab"; value=text(p); [double(value),protocolTrace]', '[97,3]\n', 1],
        ['p=RetainedProtocol(1); assert(p); protocolTrace', '1\n', 1],
        ['function [a,b]=masked(p), if p, a=1; else, a=0; end; b=2; end; [~,b]=masked(RetainedProtocol(1)); [b,protocolTrace]', '[2,1]\n', 1],
        ['p=RetainedProtocol(1); value=0; if p, value=7; end; [value,protocolTrace]', '[7,1]\n', 1],
        ['p=RetainedProtocol(1); value=0; while p, value+=1; p.value=0; end; [value,protocolTrace]', '[1,11]\n', 2],
        ['p=RetainedProtocol(0); value=p&&error("replayed"); [value,protocolTrace]', '[false,1]\n', 1],
        ['p=RetainedProtocol(1); value=p&&p; [value,protocolTrace]', '[true,11]\n', 2],
        ['p=RetainedProtocol(1); value=0; switch p, case {0,1}, value=7; end; [value,protocolTrace]', '[7,22]\n', 2],
        ['p=RetainedProtocol(2); value=double(p)+feval("double",p); [value,protocolTrace]', '[4,44]\n', 2],
        ['p=RetainedProtocol(2); [~,b]=size(p); [b,protocolTrace]', '[2,5]\n', 1],
        ['p=RetainedProtocol(0); A=[7,8]; value=A(p); [value,protocolTrace]', '[7,3]\n', 1],
        ['p=RetainedProtocol(0); A=[7,8]; A(p)=9; [A,protocolTrace]', '[9,8,3]\n', 1],
        ['p=RetainedProtocol(0); A=[7,8]; A(p)+=2; [A,protocolTrace]', '[9,8,3]\n', 1],
        ['indices=[RetainedProtocol(1),RetainedProtocol(0)]; A=[7,8]; value=A(indices); [value,protocolTrace]', '[8,7,33]\n', 2],
        ['values=[RetainedProtocol(1),RetainedProtocol(1)]; result=0; if values, result=7; end; [result,protocolTrace]', '[7,11]\n', 2],
    ])('matches synchronous execution: %s', async (source, expected, waits) => {
        const interpreter = Interpreter.Create();
        const result = interpreter.Execute((definitions + init + source).replace(/pause\(0\);?/g, ''));
        expect(interpreter.Unparse(result.list[result.list.length - 1]) + '\n').toBe(expected);
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(definitions + init + source);
            expect(result.diagnostics).toEqual([]);
            expect(result.outputs[0]).toMatchObject({ text: expected });
            expect(request).toHaveBeenCalledTimes(waits);
        } finally {
            await runtime.dispose();
        }
    });
    test.each(['if p, destination=7; end', 'destination=A(p);', 'A(p)=7;', 'destination=double(p);', 'destination=nthargout(2,@protocolPair);', 'destination=spfun(@protocolMap,A);'])(
        'restores context on cancelled protocol: %s',
        (source) => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(definitions + init + 'p=RetainedProtocol(0); A=[1,2]; destination=99;');
            const scope = interpreter.context.currentScope;
            let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
            while (step.state === 'progress') step = step.continue();
            expect(step.state).toBe('effect');
            expect(interpreter.context.currentScope).toBe(scope);
            expect(interpreter.context.isInsideUserFunction()).toBe(false);
            expect(interpreter.context.requestedOutputMask()).toEqual([true]);
            if (step.state !== 'effect') throw new Error('Expected protocol wait');
            expect(step.cancel().state).toBe('cancelled');
            expect(interpreter.Unparse(interpreter.Execute('[A,destination]'))).toBe('[1,2,99]\n');
        },
    );
    test.each(['abort', 'timeout', 'reset', 'dispose'] as const)('cleans retained builtin frames on %s', async (action) => {
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
            await session.execute(definitions + init + 'p=RetainedProtocol(3); destination=99;');
            const active = session.execute('destination=double(p);', { signal: controller.signal, ...(action === 'timeout' ? { timeoutMs: 1000 } : {}) });
            await waiting;
            if (action === 'abort') controller.abort('protocol abort');
            else if (action === 'reset' || action === 'dispose') await session[action]();
            expect((await active).status).toBe(action === 'timeout' ? 'timeout' : 'cancelled');
            const following = action === 'dispose' ? undefined : await session.execute(action === 'reset' ? 'exist("destination","var")' : '[destination,protocolTrace]');
            expect(following?.outputs[0]).toEqual(action === 'dispose' ? undefined : { type: 'text', text: action === 'reset' ? '0\n' : '[99,4]\n' });
            expect((await other.execute('exist("p","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test.each(['if p, destination=7; end', 'destination=A(p);', 'A(p)=7;', 'destination=double(p);', 'destination=nthargout(2,@protocolPair);', 'destination=spfun(@protocolMap,A);'])(
        'restores metadata after a failed protocol: %s',
        (source) => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(definitions + init + 'p=RetainedProtocol(0); A=[1,2]; destination=99;');
            const scope = interpreter.context.currentScope;
            let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
            while (step.state === 'progress') step = step.continue();
            if (step.state !== 'effect') throw new Error('Expected protocol wait');
            expect(step.fail(new Error('protocol host failed')).state).toBe('error');
            expect(interpreter.context.currentScope).toBe(scope);
            expect(interpreter.context.classMethodDispatch).toBeUndefined();
            expect(interpreter.context.requestedOutputMask()).toEqual([true]);
            expect(interpreter.Unparse(interpreter.Execute('[A,destination]'))).toBe('[1,2,99]\n');
        },
    );
    test('rejects invalid index results after a wait before writing', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({}) } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + init + 'p=RetainedProtocol(-1); A=[1,2];');
            const result = await session.execute('A(p)=7;');
            expect(result.status).toBe('error');
            expect(result.diagnostics[0]?.message).toMatch(/zero-based real integer/);
            expect((await session.execute('[A,protocolTrace]')).outputs[0]).toMatchObject({ text: '[1,2,3]\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test('keeps explicit builtin conversion as a native bypass', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + init + 'p=RetainedProtocol(2);');
            expect((await session.execute('builtin("double",p)')).status).toBe('error');
            expect(request).not.toHaveBeenCalled();
        } finally {
            await runtime.dispose();
        }
    });
    test('requires asynchronous execution for a real coercion wait', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(definitions + init + 'p=RetainedProtocol(1);');
        expect(() => interpreter.Execute('if p, value=7; end')).toThrow(expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }));
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });
    test('restores precision when builtin coercion resumes after another session', async () => {
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
                'configure("precision",20); classdef ConfigProtocol; methods; function value=double(obj), pause(0); value=getconfig("precision"); end; end; end; obj=ConfigProtocol();',
            );
            const active = first.execute('double(obj)');
            await waiting;
            await second.execute('configure("precision",40);');
            release({});
            expect((await active).outputs[0]).toMatchObject({ text: '{precision,20}\n' });
            expect((await second.execute('getconfig("precision")')).outputs[0]).toMatchObject({ text: '{precision,40}\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test('executes the installed-consumer protocol fixture', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({}) } });
        try {
            const session = await runtime.createSession();
            const source = definitions + readFileSync(join(process.cwd(), 'test/compatibility/fixtures/protocols-cycle.m'), 'utf8');
            const result = await session.execute(source);
            expect(result.diagnostics).toEqual([]);
            expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test('validates the native receiver before invoking an index protocol', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + init + 'p=RetainedProtocol(0);');
            const result = await session.execute('subsref([7,8],substruct("{}",{p}))');
            expect(result.status).toBe('error');
            expect(result.diagnostics[0]?.message).toMatch(/cannot be indexed/);
            expect(request).not.toHaveBeenCalled();
        } finally {
            await runtime.dispose();
        }
    });
    test('does not turn a failed nested index conversion into missing-element growth', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + init + 'p=RetainedProtocol(-1); S=struct();');
            expect((await session.execute('S.values(p).x=9;')).status).toBe('error');
            expect(request).toHaveBeenCalledTimes(1);
            expect((await session.execute('[isfield(S,"values"),protocolTrace]')).outputs[0]).toMatchObject({ text: '[false,3]\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test('stops mapped callbacks after a resumed scalar-result failure', async () => {
        const request = jest.fn(async () => ({}));
        const runtime = createInProcessMathJSLabRuntime({ host: { request } });
        try {
            const session = await runtime.createSession();
            await session.execute(definitions + init + 'destination=99;');
            const result = await session.execute('destination=spfun(@protocolBadMap,[1,2]);');
            expect(result.status).toBe('error');
            expect(result.diagnostics[0]?.message).toMatch(/must return a scalar/);
            expect(request).toHaveBeenCalledTimes(1);
            expect((await session.execute('[destination,protocolTrace]')).outputs[0]).toMatchObject({ text: '[99,7]\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
