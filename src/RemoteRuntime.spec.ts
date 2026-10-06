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

    public constructor(executionDelay = 0, creationDelay = 0) {
        const scope: RuntimeWorkerServerScope = {
            postMessage: (message) => {
                const deliver = (): void => this.client.forEach((listener) => listener({ data: message } as MessageEvent<RuntimeOutboundMessage>));
                if ('requestId' in message && message.ok && message.result.type === 'executed' && executionDelay > 0) setTimeout(deliver, executionDelay);
                else if ('requestId' in message && message.ok && message.result.type === 'created' && creationDelay > 0) setTimeout(deliver, creationDelay);
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
    public fail(error: Error): void {
        this.failures.get('error')!.forEach((listener) => listener({ error, message: error.message } as ErrorEvent));
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

    test('keeps multiple session workspaces and lifecycles independent', async () => {
        const workers: LoopbackWorker[] = [];
        const runtime = new RemoteMathJSLabRuntime(() => {
            const worker = new LoopbackWorker();
            workers.push(worker);
            return worker;
        });
        const first = await runtime.createSession({ id: 'first' });
        const second = await runtime.createSession({ id: 'second' });
        await first.execute('x=11;');
        await second.execute('x=22;');
        await first.dispose();
        expect(workers[0]!.terminated).toBe(true);
        expect(workers[1]!.terminated).toBe(false);
        await expect(second.execute('x')).resolves.toMatchObject({ status: 'success', outputs: expect.arrayContaining([expect.objectContaining({ type: 'text', text: '22\n' })]) });
        await runtime.dispose();
        expect(workers[1]!.terminated).toBe(true);
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

    test('cancels an active request immediately when the session is disposed', async () => {
        const worker = new LoopbackWorker(50);
        const runtime = new RemoteMathJSLabRuntime(() => worker);
        const session = await runtime.createSession();
        const execution = session.execute('x=9;');
        await session.dispose();
        await expect(execution).resolves.toMatchObject({ status: 'cancelled', diagnostics: [{ code: 'MATHJSLAB_DISPOSED' }] });
        expect(worker.terminated).toBe(true);
        await expect(session.execute('1')).rejects.toThrow('MathJSLab runtime session is disposed.');
        await runtime.dispose();
    });

    test('disposes a session whose Worker creation is still pending', async () => {
        const worker = new LoopbackWorker(0, 50);
        const runtime = new RemoteMathJSLabRuntime(() => worker);
        const creating = runtime.createSession();
        await new Promise((resolve) => setTimeout(resolve, 5));
        await runtime.dispose();
        await expect(creating).rejects.toThrow('MathJSLab runtime session is disposed.');
        expect(worker.terminated).toBe(true);
    });

    test('recovers with a clean Worker after an active Worker failure', async () => {
        const workers: LoopbackWorker[] = [];
        const runtime = new RemoteMathJSLabRuntime(() => {
            const worker = new LoopbackWorker(50);
            workers.push(worker);
            return worker;
        });
        const session = await runtime.createSession();
        const failed = session.execute('x=9;');
        await new Promise((resolve) => setTimeout(resolve, 5));
        workers[0]!.fail(new Error('simulated Worker failure'));
        await expect(failed).resolves.toMatchObject({ status: 'error', diagnostics: [{ code: 'MATHJSLAB_WORKER_ERROR', message: 'simulated Worker failure' }] });
        await expect(session.execute('exist("x","var")')).resolves.toMatchObject({
            status: 'success',
            outputs: expect.arrayContaining([expect.objectContaining({ type: 'text', text: '0\n' })]),
        });
        expect(workers).toHaveLength(2);
        await runtime.dispose();
    });

    test('aborts parallel parfor children and keeps the parent session reusable', async () => {
        const workers: LoopbackWorker[] = [];
        const runtime = new RemoteMathJSLabRuntime(
            () => {
                const worker = new LoopbackWorker(50);
                workers.push(worker);
                return worker;
            },
            { maxWorkers: 3 },
        );
        const session = await runtime.createSession({ parfor: 'strict' });
        const controller = new AbortController();
        const execution = session.execute('parfor i=1:6; A(i)=i^2; end; A', { signal: controller.signal });
        setTimeout(() => controller.abort('stop parfor'), 5);
        await expect(execution).resolves.toMatchObject({ status: 'cancelled', diagnostics: [{ code: 'MATHJSLAB_ABORTED' }] });
        await expect(session.execute('exist("A","var")')).resolves.toMatchObject({
            status: 'success',
            outputs: expect.arrayContaining([expect.objectContaining({ type: 'text', text: '0\n' })]),
        });
        expect(workers.filter((worker) => worker.terminated).length).toBeGreaterThanOrEqual(1);
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
