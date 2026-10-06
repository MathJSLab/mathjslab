import { runtimeProtocolVersion, serializeRuntimeError, type RuntimeCommand, type RuntimeInboundMessage, type RuntimeOutboundMessage, type RuntimeResponseValue } from './runtime-protocol';
import { ParforAnalyzer } from './ParforAnalyzer';
import type {
    ExecutionOptions,
    ExecutionResult,
    MathJSLabRuntime,
    ParforPolicy,
    ParseResult,
    RuntimeDiagnostic,
    RuntimeHost,
    RuntimeOptions,
    RuntimeSession,
    SessionOptions,
} from './runtime-contracts';

export interface RuntimeWorkerEndpoint {
    postMessage(message: RuntimeInboundMessage, transfer?: ArrayBuffer[]): void;
    addEventListener(type: 'message', listener: (event: MessageEvent<RuntimeOutboundMessage>) => void): void;
    addEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
    removeEventListener(type: 'message', listener: (event: MessageEvent<RuntimeOutboundMessage>) => void): void;
    removeEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
    terminate(): void | Promise<number>;
}

export type RuntimeWorkerFactory = () => RuntimeWorkerEndpoint;
type Pending = { resolve(value: RuntimeResponseValue): void; reject(reason: unknown): void };
const errorDiagnostic = (code: string, message: string): RuntimeDiagnostic => ({ code, severity: 'error', message });

class RemoteRuntimeSession implements RuntimeSession {
    private worker: RuntimeWorkerEndpoint | undefined;
    private readonly pending = new Map<string, Pending>();
    private readonly effectControllers = new Map<string, AbortController>();
    private nextRequest = 0;
    private creating: Promise<void> | undefined;
    private disposing: Promise<void> | undefined;
    private disposed = false;

    public constructor(
        private readonly factory: RuntimeWorkerFactory,
        private readonly sessionId: string,
        private readonly parfor?: ParforPolicy,
        private readonly host?: RuntimeHost,
        private readonly maxWorkers = 1,
        private readonly onDispose?: (session: RemoteRuntimeSession) => void,
    ) {}

    public async initialize(): Promise<void> {
        await this.ensureWorker();
    }

    public async parse(source: string): Promise<ParseResult> {
        const result = await this.request({ type: 'parse', sessionId: this.sessionId, source });
        if (result.type !== 'parsed') throw new Error(`Unexpected runtime response: ${result.type}`);
        return result.result;
    }

    public async execute(source: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
        if (this.disposed) throw new Error('MathJSLab runtime session is disposed.');
        if (options.signal?.aborted) return { status: 'cancelled', outputs: [], diagnostics: [errorDiagnostic('MATHJSLAB_ABORTED', String(options.signal.reason ?? 'Execution cancelled'))] };
        if (/\bparfor\b/i.test(source)) {
            const parallel = await this.tryParallelParfor(source, options);
            if (parallel) return parallel;
            if (this.parfor === 'strict') {
                return {
                    status: 'error',
                    outputs: [],
                    diagnostics: [errorDiagnostic('MATHJSLAB_PARFOR_NOT_ELIGIBLE', 'parfor body is outside the proven independent sliced-assignment subset.')],
                };
            }
        }
        return this.executeWithoutParallel(source, options);
    }

    private async tryParallelParfor(source: string, options: ExecutionOptions): Promise<ExecutionResult | undefined> {
        if (this.parfor === 'off' || this.maxWorkers < 2) return undefined;
        const deadline = options.timeoutMs === undefined ? undefined : Date.now() + options.timeoutMs;
        const activeOptions = (): ExecutionOptions => {
            if (options.signal?.aborted) throw options.signal.reason ?? new Error('Execution cancelled');
            if (deadline === undefined) return options;
            const timeoutMs = deadline - Date.now();
            if (timeoutMs <= 0) throw Object.assign(new Error(`Execution exceeded ${options.timeoutMs} ms`), { code: 'MATHJSLAB_TIMEOUT' });
            return { ...options, timeoutMs };
        };
        const analysis = ParforAnalyzer.analyze(source);
        if (!analysis.eligible) return undefined;
        const { plan } = analysis;
        const broadcastValues = new Map<string, string>();
        for (const name of plan.broadcasts) {
            const result = await this.executeWithoutParallel(name, activeOptions());
            if (result.status !== 'success' || result.outputs[0]?.type !== 'text') return undefined;
            broadcastValues.set(name, result.outputs[0].text.trim());
        }
        const values = [...plan.values];
        const queue = values.slice();
        const results = new Map<number, string>();
        const workerCount = Math.min(this.maxWorkers, values.length);
        const runners = Array.from({ length: workerCount }, async (_, workerIndex) => {
            const child = new RemoteRuntimeSession(this.factory, `${this.sessionId}-parfor-${workerIndex}-${Date.now()}`, 'off', this.host, 1);
            await child.initialize();
            try {
                while (queue.length) {
                    const value = queue.shift()!;
                    const broadcasts = [...broadcastValues].map(([name, encoded]) => `${name}=(${encoded});`).join(' ');
                    const result = await child.execute(`${broadcasts} ${plan.loopVariable}=${value}; ${plan.expression}`, activeOptions());
                    if (result.status !== 'success' || result.outputs[0]?.type !== 'text') {
                        throw Object.assign(new Error(result.diagnostics[0]?.message ?? `parfor iteration ${value} failed.`), {
                            code: result.status === 'timeout' ? 'MATHJSLAB_TIMEOUT' : result.status === 'cancelled' ? 'MATHJSLAB_ABORTED' : 'MATHJSLAB_PARFOR_ITERATION_ERROR',
                        });
                    }
                    results.set(value, result.outputs[0].text.trim());
                }
            } finally {
                await child.dispose();
            }
        });
        try {
            await Promise.all(runners);
            for (const value of values) {
                const assignment =
                    plan.output.kind === 'sliced' ? `${plan.output.name}(${value})=(${results.get(value)!});` : `${plan.output.name}${plan.output.operator}(${results.get(value)!});`;
                const assigned = await this.executeWithoutParallel(assignment, activeOptions());
                if (assigned.status !== 'success') return assigned;
            }
            const result = await this.executeWithoutParallel(plan.output.name, activeOptions());
            return {
                ...result,
                diagnostics: [
                    ...result.diagnostics,
                    { code: 'MATHJSLAB_PARFOR_PARALLEL', severity: 'info', message: `parfor executed ${values.length} iterations on ${workerCount} Workers.` },
                ],
            };
        } catch (error) {
            const timeout = typeof error === 'object' && error !== null && Reflect.get(error, 'code') === 'MATHJSLAB_TIMEOUT';
            const cancelled = options.signal?.aborted === true;
            return {
                status: timeout ? 'timeout' : cancelled ? 'cancelled' : 'error',
                outputs: [],
                diagnostics: [
                    errorDiagnostic(
                        timeout ? 'MATHJSLAB_TIMEOUT' : cancelled ? 'MATHJSLAB_ABORTED' : 'MATHJSLAB_PARFOR_ITERATION_ERROR',
                        error instanceof Error ? error.message : String(error),
                    ),
                ],
            };
        }
    }

    private async executeWithoutParallel(source: string, options: ExecutionOptions): Promise<ExecutionResult> {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let timedOut = false;
        const interrupt = (): void => this.destroyWorker();
        const aborted = (): void => interrupt();
        options.signal?.addEventListener('abort', aborted, { once: true });
        const execution = this.request({ type: 'execute', sessionId: this.sessionId, source });
        const guarded = new Promise<RuntimeResponseValue>((resolve, reject) => {
            execution.then(resolve, reject);
            if (options.timeoutMs !== undefined) {
                timeout = setTimeout(() => {
                    timedOut = true;
                    interrupt();
                    reject(new Error(`Execution exceeded ${options.timeoutMs} ms`));
                }, options.timeoutMs);
            }
        });
        try {
            const result = await guarded;
            if (result.type !== 'executed') throw new Error(`Unexpected runtime response: ${result.type}`);
            return result.result;
        } catch (error) {
            const cancelled = options.signal?.aborted === true;
            const disposed = this.disposed;
            return {
                status: timedOut ? 'timeout' : cancelled || disposed ? 'cancelled' : 'error',
                outputs: [],
                diagnostics: [
                    errorDiagnostic(
                        timedOut ? 'MATHJSLAB_TIMEOUT' : disposed ? 'MATHJSLAB_DISPOSED' : cancelled ? 'MATHJSLAB_ABORTED' : 'MATHJSLAB_WORKER_ERROR',
                        error instanceof Error ? error.message : String(error),
                    ),
                ],
            };
        } finally {
            if (timeout !== undefined) clearTimeout(timeout);
            options.signal?.removeEventListener('abort', aborted);
        }
    }

    public async interrupt(reason: unknown = 'Execution interrupted'): Promise<void> {
        this.destroyWorker(new Error(String(reason)));
    }

    public async reset(): Promise<void> {
        const result = await this.request({ type: 'reset', sessionId: this.sessionId });
        if (result.type !== 'reset') throw new Error(`Unexpected runtime response: ${result.type}`);
    }

    public async dispose(): Promise<void> {
        if (this.disposed) return;
        if (!this.disposing) {
            this.disposing = (async () => {
                this.disposed = true;
                this.destroyWorker(new Error('MathJSLab runtime session is disposed.'));
                this.onDispose?.(this);
            })();
        }
        await this.disposing;
    }

    private async ensureWorker(): Promise<void> {
        if (this.disposed) throw new Error('MathJSLab runtime session is disposed.');
        if (this.worker) return;
        if (!this.creating) {
            this.creating = (async () => {
                const worker = this.factory();
                this.worker = worker;
                worker.addEventListener('message', this.receive);
                worker.addEventListener('error', this.fail);
                worker.addEventListener('messageerror', this.fail);
                const result = await this.send({ type: 'create', sessionId: this.sessionId, ...(this.parfor ? { parfor: this.parfor } : {}) });
                if (result.type !== 'created') throw new Error(`Unexpected runtime response: ${result.type}`);
            })();
        }
        try {
            await this.creating;
        } finally {
            this.creating = undefined;
        }
    }

    private async request(command: RuntimeCommand): Promise<RuntimeResponseValue> {
        await this.ensureWorker();
        return this.send(command);
    }

    private send(command: RuntimeCommand): Promise<RuntimeResponseValue> {
        const worker = this.worker;
        if (!worker) return Promise.reject(new Error('MathJSLab Worker is unavailable.'));
        const requestId = `runtime-${++this.nextRequest}`;
        return new Promise((resolve, reject) => {
            this.pending.set(requestId, { resolve, reject });
            try {
                worker.postMessage({ protocol: runtimeProtocolVersion, requestId, command });
            } catch (error) {
                this.pending.delete(requestId);
                reject(error);
            }
        });
    }

    private readonly receive = (event: MessageEvent<RuntimeOutboundMessage>): void => {
        const response = event.data;
        if (!response || response.protocol !== runtimeProtocolVersion) return;
        if ('effectId' in response) {
            void this.handleEffect(response.effectId, response.effect, response.context);
            return;
        }
        const pending = this.pending.get(response.requestId);
        if (!pending) return;
        this.pending.delete(response.requestId);
        if (response.ok) pending.resolve(response.result);
        else {
            const error = new Error(response.error.message);
            error.name = response.error.name;
            if (response.error.stack) error.stack = response.error.stack;
            pending.reject(error);
        }
    };

    private async handleEffect(effectId: string, effect: Parameters<RuntimeHost['request']>[0], context: Parameters<RuntimeHost['request']>[1]): Promise<void> {
        const worker = this.worker;
        if (!worker) return;
        const controller = new AbortController();
        this.effectControllers.set(effectId, controller);
        try {
            if (!this.host) throw new Error(`No RuntimeHost is configured for effect '${effect.type}'.`);
            const result = await this.host.request(effect, { ...context, signal: controller.signal });
            if (worker === this.worker) worker.postMessage({ protocol: runtimeProtocolVersion, type: 'effect-result', effectId, ok: true, result });
        } catch (error) {
            if (worker === this.worker) worker.postMessage({ protocol: runtimeProtocolVersion, type: 'effect-result', effectId, ok: false, error: serializeRuntimeError(error) });
        } finally {
            this.effectControllers.delete(effectId);
        }
    }

    private readonly fail = (event: Event): void => {
        const candidate = Reflect.get(event, 'error');
        const message = Reflect.get(event, 'message');
        this.destroyWorker(candidate instanceof Error ? candidate : new Error(typeof message === 'string' ? message : 'MathJSLab Worker failed.'));
    };

    private destroyWorker(reason: Error = new Error('MathJSLab Worker was terminated.')): void {
        const worker = this.worker;
        this.worker = undefined;
        if (worker) {
            worker.removeEventListener('message', this.receive);
            worker.removeEventListener('error', this.fail);
            worker.removeEventListener('messageerror', this.fail);
            void worker.terminate();
        }
        for (const pending of this.pending.values()) pending.reject(reason);
        this.pending.clear();
        for (const controller of this.effectControllers.values()) controller.abort(reason);
        this.effectControllers.clear();
    }
}

export class RemoteMathJSLabRuntime implements MathJSLabRuntime {
    private readonly sessions = new Set<RemoteRuntimeSession>();
    private nextSession = 0;
    private disposed = false;

    public constructor(
        private readonly workerFactory: RuntimeWorkerFactory,
        private readonly options: RuntimeOptions = {},
    ) {}

    public async createSession(options: SessionOptions = {}): Promise<RuntimeSession> {
        if (this.disposed) throw new Error('MathJSLab runtime is disposed.');
        if (options.interpreter) throw new Error('Remote runtime sessions require serializable package-level configuration.');
        const suggested = typeof navigator === 'undefined' ? 2 : Math.max(1, (navigator.hardwareConcurrency || 2) - 1);
        const session = new RemoteRuntimeSession(
            this.workerFactory,
            options.id ?? `session-${++this.nextSession}`,
            options.parfor,
            this.options.host,
            this.options.maxWorkers ?? suggested,
            (disposed) => this.sessions.delete(disposed),
        );
        this.sessions.add(session);
        try {
            await session.initialize();
            return session;
        } catch (error) {
            this.sessions.delete(session);
            await session.interrupt(error);
            throw error;
        }
    }

    public async dispose(): Promise<void> {
        if (this.disposed) return;
        this.disposed = true;
        await Promise.all(Array.from(this.sessions, (session) => session.dispose()));
        this.sessions.clear();
    }
}
