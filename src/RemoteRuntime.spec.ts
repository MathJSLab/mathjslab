import { RemoteMathJSLabRuntime, type RuntimeWorkerEndpoint } from './RemoteRuntime';
import { RuntimeWorkerServer, type RuntimeWorkerServerScope } from './RuntimeWorkerServer';
import type { RuntimeInboundMessage, RuntimeOutboundMessage } from './runtime-protocol';

class LoopbackWorker implements RuntimeWorkerEndpoint {
    private readonly client = new Set<(_event: MessageEvent<RuntimeOutboundMessage>) => void>();
    private readonly server = new Set<(_event: MessageEvent<RuntimeInboundMessage>) => void>();
    private readonly failures = new Map<string, Set<(_event: Event) => void>>([
        ['error', new Set()],
        ['messageerror', new Set()],
    ]);
    public readonly runtimeServer: RuntimeWorkerServer;
    public terminated = false;

    public constructor(executionDelay = 0) {
        const scope: RuntimeWorkerServerScope = {
            postMessage: (message) => {
                const deliver = (): void => this.client.forEach((listener) => listener({ data: message } as MessageEvent<RuntimeOutboundMessage>));
                if ('requestId' in message && message.ok && message.result.type === 'executed' && executionDelay > 0) setTimeout(deliver, executionDelay);
                else queueMicrotask(deliver);
            },
            addEventListener: (_type, listener) => void this.server.add(listener),
            removeEventListener: (_type, listener) => void this.server.delete(listener),
        };
        this.runtimeServer = new RuntimeWorkerServer(scope);
    }

    public postMessage(message: RuntimeInboundMessage): void {
        queueMicrotask(() => this.server.forEach((listener) => listener({ data: message } as MessageEvent<RuntimeInboundMessage>)));
    }
    public addEventListener(type: 'message' | 'error' | 'messageerror', listener: ((_event: MessageEvent<RuntimeOutboundMessage>) => void) | ((_event: Event) => void)): void {
        if (type === 'message') this.client.add(listener as (_event: MessageEvent<RuntimeOutboundMessage>) => void);
        else this.failures.get(type)!.add(listener as (_event: Event) => void);
    }
    public removeEventListener(type: 'message' | 'error' | 'messageerror', listener: ((_event: MessageEvent<RuntimeOutboundMessage>) => void) | ((_event: Event) => void)): void {
        if (type === 'message') this.client.delete(listener as (_event: MessageEvent<RuntimeOutboundMessage>) => void);
        else this.failures.get(type)!.delete(listener as (_event: Event) => void);
    }
    public terminate(): void {
        this.terminated = true;
        void this.runtimeServer.dispose();
    }
}

describe('RemoteMathJSLabRuntime', () => {
    test('keeps a session workspace in its worker', async () => {
        const workers: LoopbackWorker[] = [];
        const runtime = new RemoteMathJSLabRuntime(() => {
            const worker = new LoopbackWorker();
            workers.push(worker);
            return worker;
        });
        const session = await runtime.createSession();
        await session.execute('x = 9;');
        const result = await session.execute('x * 2');
        expect(result).toMatchObject({ status: 'success' });
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '18\n' });
        await runtime.dispose();
        expect(workers[0]!.terminated).toBe(true);
    });

    test('terminates on abort and recreates a clean worker on the next call', async () => {
        const workers: LoopbackWorker[] = [];
        const runtime = new RemoteMathJSLabRuntime(() => {
            const worker = new LoopbackWorker();
            workers.push(worker);
            return worker;
        });
        const session = await runtime.createSession();
        await session.execute('x = 9;');
        await session.interrupt('cancelled');
        const result = await session.execute('exist("x", "var")');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '0\n' });
        expect(workers).toHaveLength(2);
        await runtime.dispose();
    });

    test('terminates on timeout and recreates a clean worker on the next call', async () => {
        const workers: LoopbackWorker[] = [];
        const runtime = new RemoteMathJSLabRuntime(() => {
            const worker = new LoopbackWorker(50);
            workers.push(worker);
            return worker;
        });
        const session = await runtime.createSession();
        await expect(session.execute('x = 9;', { timeoutMs: 5 })).resolves.toMatchObject({ status: 'timeout' });
        const result = await session.execute('exist("x", "var")');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '0\n' });
        expect(workers).toHaveLength(2);
        await runtime.dispose();
    });

    test('mediates host effects across the worker protocol', async () => {
        const runtime = new RemoteMathJSLabRuntime(() => new LoopbackWorker(), {
            host: { request: async (effect) => ({ value: effect.type === 'read-text' ? 'answer = 42;' : undefined }) },
        });
        const session = await runtime.createSession();
        const result = await session.execute('load("virtual.m"); answer');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '42\n' });
        await runtime.dispose();
    });

    test('executes the proven sliced parfor subset on multiple workers', async () => {
        let workers = 0;
        const runtime = new RemoteMathJSLabRuntime(
            () => {
                workers++;
                return new LoopbackWorker();
            },
            { maxWorkers: 3 },
        );
        const session = await runtime.createSession({ parfor: 'strict' });
        const result = await session.execute('parfor i=1:6; A(i)=i^2; end; A');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '[1,4,9,16,25,36]\n' });
        expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'MATHJSLAB_PARFOR_PARALLEL' }));
        expect(workers).toBeGreaterThan(1);
        await runtime.dispose();
    });

    test('transports broadcasts and combines an associative reduction deterministically', async () => {
        const runtime = new RemoteMathJSLabRuntime(() => new LoopbackWorker(), { maxWorkers: 3 });
        const session = await runtime.createSession({ parfor: 'strict' });
        await session.execute('scale=2; total=0;');
        const sliced = await session.execute('parfor k=1:3; A(k)=scale*k; end; A');
        expect(sliced.outputs[0]).toMatchObject({ type: 'text', text: '[2,4,6]\n' });
        const reduction = await session.execute('parfor k=1:4; total+=scale*k; end; total');
        expect(reduction.outputs[0]).toMatchObject({ type: 'text', text: '20\n' });
        await runtime.dispose();
    });
});
