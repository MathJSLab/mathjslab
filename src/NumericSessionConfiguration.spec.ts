import { Complex, type RealTypeDescriptor } from './Complex';
import { ComplexDecimal, Decimal } from './ComplexDecimal';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
import { RemoteMathJSLabRuntime, type RuntimeWorkerEndpoint } from './RemoteRuntime';
import { RuntimeWorkerServer, type RuntimeWorkerServerScope } from './RuntimeWorkerServer';
import type { RuntimeInboundMessage, RuntimeOutboundMessage } from './runtime-protocol';
import { RuntimeEnvironment } from './RuntimeEnvironment';

class NumericLoopbackWorker implements RuntimeWorkerEndpoint {
    private readonly client = new Set<(_event: MessageEvent<RuntimeOutboundMessage>) => void>();
    private readonly server = new Set<(_event: MessageEvent<RuntimeInboundMessage>) => void>();
    private readonly runtime: RuntimeWorkerServer;
    public terminated = false;
    public constructor(private readonly _legacy = false) {
        const scope: RuntimeWorkerServerScope = {
            postMessage: (message) =>
                queueMicrotask(() => {
                    if (this._legacy && 'result' in message && message.result.type === 'created') message = { ...message, result: { type: 'created' } };
                    this.client.forEach((listener) => listener({ data: message } as MessageEvent<RuntimeOutboundMessage>));
                }),
            addEventListener: (_type, listener) => {
                this.server.add(listener);
            },
            removeEventListener: (_type, listener) => {
                this.server.delete(listener);
            },
        };
        this.runtime = new RuntimeWorkerServer(scope);
    }
    public postMessage(message: RuntimeInboundMessage): void {
        queueMicrotask(() => this.server.forEach((listener) => listener({ data: message } as MessageEvent<RuntimeInboundMessage>)));
    }
    public addEventListener(type: string, listener: unknown): void {
        if (type === 'message') this.client.add(listener as (_event: MessageEvent<RuntimeOutboundMessage>) => void);
    }
    public removeEventListener(type: string, listener: unknown): void {
        if (type === 'message') this.client.delete(listener as (_event: MessageEvent<RuntimeOutboundMessage>) => void);
    }
    public terminate(): void {
        this.terminated = true;
        void this.runtime.dispose();
    }
}

describe('Numeric session creation and backend lifetime', () => {
    test.each(['local', 'remote'] as const)('initializes both backends before parsing and resets initial settings: %s', async (driver) => {
        const runtime = driver === 'local' ? createInProcessMathJSLabRuntime() : new RemoteMathJSLabRuntime(() => new NumericLoopbackWorker());
        const host = new RuntimeEnvironment().settings;
        try {
            for (const engine of ['number', 'decimal'] as const) {
                const session = await runtime.createSession({ numeric: { engine, complex: { precision: 40 } } });
                expect((await session.execute('1+1')).outputs[0]).toMatchObject({ text: '2\n' });
                expect((await session.execute('getconfig("real")')).outputs[0]).toMatchObject({ text: `{real,${engine}}\n` });
                expect((await session.execute('i*i==-1 && pi>3 && true')).outputs[0]).toMatchObject({ text: 'true\n' });
                expect(
                    (
                        await session.execute(
                            'classdef ConfigBox; properties; value=2; end; methods; function y=plusOne(obj), y=obj.value+1; end; end; end; box=ConfigBox(); fun=@(x)x+1; box.plusOne()==3 && fun(2)==3',
                        )
                    ).outputs[0],
                ).toMatchObject({ text: 'true\n' });
                await session.execute('configure("precision",20); a=9;');
                await session.reset();
                expect((await session.execute('getconfig("precision")')).outputs[0]).toMatchObject({ text: `{precision,${engine === 'number' ? 15 : 40}}\n` });
                expect((await session.execute('exist("a","var")')).outputs[0]).toMatchObject({ text: '0\n' });
                const other = engine === 'number' ? 'decimal' : 'number';
                await session.execute('a=9; matrix=[1,2;3,4]; cell={matrix,1+i}; fun=@(x)x+a;');
                for (const backend of [other, engine]) {
                    const switched = await session.execute(`configure("real","${backend}"); a==9 && sum(matrix(:))==10 && cell{2}==1+i && fun(2)==11 && sin(pi/2)>0.99 && atan2(1,1)>0.7`);
                    expect(switched.diagnostics).toEqual([]);
                    expect(switched.outputs[0]).toMatchObject({ text: 'true\n' });
                    expect((await session.execute('getconfig("real")')).outputs[0]).toMatchObject({ text: `{real,${backend}}\n` });
                }
                const list = await session.execute("configure({'real','decimal';'precision',40}); a+matrix(1,1)");
                expect(list.diagnostics).toEqual([]);
                expect(list.outputs[0]).toMatchObject({ text: '10\n' });
                await session.execute('configure();');
                expect((await session.execute('getconfig("real")')).outputs[0]).toMatchObject({ text: '{real,decimal}\n' });
                expect((await session.execute('getconfig("precision")')).outputs[0]).toMatchObject({ text: '{precision,336}\n' });
            }
            expect(new RuntimeEnvironment().settings).toEqual(host);
        } finally {
            await runtime.dispose();
        }
    });

    test('keeps suspended values, closures, classes, RNG and native names isolated across backends', async () => {
        let entered!: () => void;
        let release!: (_value: import('./execution-contracts').HostEffectResult) => void;
        const waiting = new Promise<void>((resolve) => {
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
            const first = await runtime.createSession({ numeric: { engine: 'decimal', complex: { precision: 40 } } });
            const second = await runtime.createSession({ numeric: { engine: 'number' } });
            await first.execute('classdef NumericBox; properties; value=2; end; end; b=NumericBox(); a=1e-30; f=@(x)x+a; rng(42); s=rng();');
            const pending = first.execute('pause(1); isequal(b.value,2) && abs(f(1e-30)/1e-30-2)<1e-12 && i*i==-1');
            await waiting;
            expect((await second.execute('rng(19); sum(1:10)+real(i)')).outputs[0]).toMatchObject({ text: '55\n' });
            release({});
            expect((await pending).outputs[0]).toMatchObject({ text: 'true\n' });
            expect((await first.execute('t=rng(); isequal(s,t)')).outputs[0]).toMatchObject({ text: 'true\n' });
            expect((await second.execute('exist("b","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['local', 'remote'] as const)('switches live graphs inside functions and loops without losing class, RNG or session state: %s', async (driver) => {
        const runtime = driver === 'local' ? createInProcessMathJSLabRuntime() : new RemoteMathJSLabRuntime(() => new NumericLoopbackWorker());
        try {
            const session = await runtime.createSession();
            const other = await runtime.createSession({ numeric: { engine: 'decimal', complex: { precision: 40 } } });
            const run = async (source: string, text = 'true\n') => {
                const result = await session.execute(source);
                expect({ source, diagnostics: result.diagnostics }).toEqual({ source, diagnostics: [] });
                expect(result.outputs[0]).toMatchObject({ text });
            };
            await run(
                'classdef SwitchBox < handle; properties; value=3; end; methods; function y=inc(obj), obj.value+=1; y=obj.value; end; end; end; box=SwitchBox(); alias=box; data=struct(); data.v={[1,2],3+i}; global shared; shared=4; rng(42); saved=rng(); true',
            );
            await run(
                'function y=switcher(x), persistent count=2; configure("real","number"); count+=x; y=count; end; for k=1:3; total=switcher(k); end; total==8 && box.inc()==4 && alias.value==4 && shared==4 && data.v{2}==3+i && isequal(saved,rng())',
            );
            await run('configure({"real","decimal";"precision",40}); box.inc()==5 && alias.value==5 && switcher(1)==9');
            await run('configure("real","decimal"); configure("precision",40); (1+1e-30)>1 && sin(pi/2)>0.99 && data.v{1}(2)==2');
            expect((await other.execute('getconfig("precision")')).outputs[0]).toMatchObject({ text: '{precision,40}\n' });
            expect((await other.execute('exist("box","var")')).outputs[0]).toMatchObject({ text: '0\n' });
            await session.reset();
            expect((await session.execute('exist("box","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['local', 'remote'] as const)('rejects invalid creation without mutating host configuration: %s', async (driver) => {
        const runtime = driver === 'local' ? createInProcessMathJSLabRuntime() : new RemoteMathJSLabRuntime(() => new NumericLoopbackWorker());
        const host = new RuntimeEnvironment().settings;
        try {
            for (const numeric of [
                null as never,
                { engine: 'number' as const, complex: null as never },
                { engine: 'invalid' as RealTypeDescriptor },
                { engine: 'decimal' as const, complex: { precision: 0 } },
                { engine: 'number' as const, complex: { precision: 0 } },
                { engine: 'decimal' as const, complex: { precisionCompare: -1 } },
                { engine: 'decimal' as const, complex: { precision: 3 } },
            ]) {
                await expect(runtime.createSession({ numeric })).rejects.toThrow();
                expect(new RuntimeEnvironment().settings).toEqual(host);
            }
            const session = await runtime.createSession({ numeric: { engine: 'decimal', complex: { precision: 3, precisionCompare: 0 } } });
            expect((await session.execute('1+1')).outputs[0]).toMatchObject({ text: '2\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('defaults remain immutable and invalid multi-key decimal setup is atomic', () => {
        const environment = new RuntimeEnvironment();
        environment.run(() => {
            Complex.engine = 'decimal';
            const defaults = { ...Complex.defaultSettings };
            Complex.set({ precision: 40 });
            expect(Complex.defaultSettings).toEqual(defaults);
            const before = { ...Complex.settings };
            expect(() => Complex.set({ precision: 20, rounding: 99 as never })).toThrow();
            expect(Complex.settings).toEqual(before);
            expect(Decimal.precision).toBe(40);
            Complex.engine = 'decimal';
            expect(Complex.settings.precision).toBe(40);
            expect(() => {
                Complex.engine = 'bad' as RealTypeDescriptor;
            }).toThrow();
            expect(Complex.engine).toBe('decimal');
            expect(ComplexDecimal.settings.precision).toBe(40);
        });
    });

    test.each(['local', 'remote'] as const)('copies creation options and honors runtime numeric defaults: %s', async (driver) => {
        const numeric = { engine: 'decimal' as const, complex: { precision: 40 } };
        const options = { sessionDefaults: { numeric } };
        const runtime = driver === 'local' ? createInProcessMathJSLabRuntime(options) : new RemoteMathJSLabRuntime(() => new NumericLoopbackWorker(), options);
        try {
            const first = await runtime.createSession();
            numeric.complex.precision = 20;
            await first.reset();
            expect((await first.execute('getconfig("precision")')).outputs[0]).toMatchObject({ text: '{precision,40}\n' });
            const second = await runtime.createSession({ numeric: { engine: 'number' } });
            expect((await second.execute('getconfig("real")')).outputs[0]).toMatchObject({ text: '{real,number}\n' });
            expect((await first.execute('1+1')).outputs[0]).toMatchObject({ text: '2\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('rejects a stale Worker that does not acknowledge numeric configuration', async () => {
        const worker = new NumericLoopbackWorker(true);
        const runtime = new RemoteMathJSLabRuntime(() => worker);
        try {
            await expect(runtime.createSession({ numeric: { engine: 'number' } })).rejects.toMatchObject({ code: 'MATHJSLAB_NUMERIC_CONFIGURATION_UNSUPPORTED' });
            expect(worker.terminated).toBe(true);
        } finally {
            await runtime.dispose();
        }
    });
});
