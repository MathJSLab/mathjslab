import { AST, type NodeInput } from './AST';
import { Interpreter } from './Interpreter';
import { ExecutionCancellation, type ExecutionMachineStep } from './ExecutionMachine';
import { RuntimeValueCodec } from './RuntimeValueCodec';
import { RuntimeEnvironment } from './RuntimeEnvironment';
import type {
    ExecutionOptions,
    ExecutionResult,
    MathJSLabRuntime,
    ParseResult,
    RuntimeDiagnostic,
    RuntimeHost,
    RuntimeOptions,
    RuntimeOutput,
    RuntimeSession,
    SessionOptions,
} from './runtime-contracts';

const diagnostic = (error: unknown): RuntimeDiagnostic => ({
    code: typeof error === 'object' && error !== null && typeof Reflect.get(error, 'code') === 'string' ? String(Reflect.get(error, 'code')) : 'MATHJSLAB_EXECUTION_ERROR',
    severity: 'error',
    message: error instanceof Error ? error.message : String(error),
    cause: error,
});

const abortResult = (timeout: boolean, reason: unknown): ExecutionResult => ({
    status: timeout ? 'timeout' : 'cancelled',
    outputs: [],
    diagnostics: [
        {
            code: timeout
                ? 'MATHJSLAB_TIMEOUT'
                : typeof reason === 'object' && reason !== null && typeof Reflect.get(reason, 'code') === 'string'
                  ? String(Reflect.get(reason, 'code'))
                  : 'MATHJSLAB_ABORTED',
            severity: 'error',
            message: reason instanceof Error ? reason.message : String(reason ?? 'Execution cancelled'),
        },
    ],
});

const containsParfor = (node: unknown): boolean => {
    if (!AST.isNodeBase(node)) return false;
    if (node.type === 'FOR' && Reflect.get(node, 'parallel') === true) return true;
    for (const value of Object.values(node)) {
        if (Array.isArray(value) && value.some((entry) => containsParfor(entry))) return true;
        if (value && typeof value === 'object' && value !== node.parent && AST.isNodeBase(value) && containsParfor(value)) return true;
    }
    return false;
};

class InProcessSession implements RuntimeSession {
    private interpreter: Interpreter;
    private environment = new RuntimeEnvironment();
    private readonly activeExecutions = new Set<AbortController>();
    private disposed = false;
    private interrupted: unknown;

    public constructor(
        private readonly options: SessionOptions,
        private readonly host?: RuntimeHost,
        private readonly evaluateHook?: RuntimeOptions['evaluate'],
        private readonly onDispose?: (session: InProcessSession) => void,
    ) {
        this.interpreter = Interpreter.Create(options.interpreter);
    }

    public async parse(source: string): Promise<ParseResult> {
        this.assertActive();
        try {
            return this.environment.run(() => {
                const tree = this.interpreter.Parse(source);
                return { source, normalized: this.interpreter.Unparse(tree), diagnostics: [] };
            });
        } catch (error) {
            return { source, normalized: '', diagnostics: [diagnostic(error)] };
        }
    }

    public async execute(source: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
        this.assertActive();
        if (options.signal?.aborted) return abortResult(false, options.signal.reason);
        if (this.interrupted !== undefined) {
            const reason = this.interrupted;
            this.interrupted = undefined;
            return abortResult(false, reason);
        }
        const externalSignal = options.signal;
        const controller = new AbortController();
        let timedOut = false;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const abort = (): void => controller.abort(externalSignal?.reason ?? 'Execution cancelled');
        externalSignal?.addEventListener('abort', abort, { once: true });
        if (options.timeoutMs !== undefined) {
            timeout = setTimeout(() => {
                timedOut = true;
                controller.abort(new Error(`Execution exceeded ${options.timeoutMs} ms`));
            }, options.timeoutMs);
        }
        options = { ...options, signal: controller.signal };
        this.activeExecutions.add(controller);
        const started = Date.now();
        try {
            const parsed = this.environment.run(() => this.interpreter.Parse(source));
            const parallel = containsParfor(parsed);
            if (parallel && this.options.parfor === 'strict') {
                return {
                    status: 'error',
                    outputs: [],
                    diagnostics: [{ code: 'MATHJSLAB_PARFOR_NOT_ELIGIBLE', severity: 'error', message: 'This runtime does not have an eligible parallel scheduler for the parfor block.' }],
                };
            }
            const deadline = options.timeoutMs === undefined ? undefined : started + options.timeoutMs;
            const extraOutputs: RuntimeOutput[] = [];
            const evaluated = await this.evaluateWithEffects(parsed, options, deadline, 0, extraOutputs);
            if (controller.signal.aborted) return abortResult(timedOut, controller.signal.reason);
            const rendered = this.environment.run(() => {
                return {
                    text: `${this.interpreter.Unparse(evaluated)}\n`,
                    mathml: this.interpreter.UnparseMathML(evaluated),
                    data: (() => {
                        try {
                            return RuntimeValueCodec.encode(evaluated);
                        } catch {
                            return undefined;
                        }
                    })(),
                };
            });
            if (timedOut || (options.timeoutMs !== undefined && Date.now() - started > options.timeoutMs)) return abortResult(true, `Execution exceeded ${options.timeoutMs} ms`);
            const standardOutputs: RuntimeOutput[] =
                evaluated.type === 'VOID' && extraOutputs.length > 0
                    ? []
                    : [{ type: 'text', text: rendered.text }, { type: 'mathml', markup: rendered.mathml }, ...(rendered.data ? [{ type: 'data' as const, value: rendered.data }] : [])];
            return {
                status: 'success',
                outputs: [...standardOutputs, ...extraOutputs],
                diagnostics:
                    parallel && this.options.parfor !== 'off'
                        ? [
                              {
                                  code: 'MATHJSLAB_PARFOR_SEQUENTIAL_FALLBACK',
                                  severity: 'warning',
                                  message: 'parfor executed sequentially because no eligible parallel scheduler was available.',
                              },
                          ]
                        : [],
            };
        } catch (error) {
            if (error instanceof ExecutionCancellation) return abortResult(timedOut || (options.timeoutMs !== undefined && Date.now() - started >= options.timeoutMs), error.reason);
            if (controller.signal.aborted) return abortResult(timedOut, controller.signal.reason ?? error);
            return { status: 'error', outputs: [], diagnostics: [diagnostic(error)] };
        } finally {
            if (timeout !== undefined) clearTimeout(timeout);
            externalSignal?.removeEventListener('abort', abort);
            this.activeExecutions.delete(controller);
        }
    }

    private async evaluateWithEffects(tree: NodeInput, options: ExecutionOptions, deadline: number | undefined, depth = 0, outputs: RuntimeOutput[] = []): Promise<NodeInput> {
        if (depth > 16) throw new Error('Runtime resource loading exceeded the maximum nesting depth (16).');
        let cancelling = false;
        const cancel = (continuation: { cancel(reason?: unknown): ExecutionMachineStep<NodeInput> }): ExecutionMachineStep<NodeInput> => {
            cancelling = true;
            return continuation.cancel(options.signal?.reason);
        };
        const machine = this.environment.run(() =>
            this.interpreter.CreateExecutionMachine(
                tree,
                (operation) => {
                    if (!cancelling && (options.signal?.aborted || (deadline !== undefined && Date.now() > deadline))) {
                        cancelling = true;
                        throw new ExecutionCancellation(options.signal?.reason ?? new Error(`Execution exceeded ${options.timeoutMs} ms`));
                    }
                    const result = this.interpreter.withPlotOutput(
                        (request) => outputs.push({ type: 'visualization', renderer: 'plotly', request }),
                        () => (this.evaluateHook ? this.evaluateHook(this.interpreter, operation) : { value: operation() }),
                    );
                    if (result.outputs) outputs.push(...result.outputs);
                    return result.value;
                },
                false,
            ),
        );
        let step = this.environment.run(() => machine.runUntilYield());
        while (step.state === 'effect' || step.state === 'progress') {
            if (step.state === 'progress') {
                const checkpoint = step;
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                step = this.environment.run(() => (options.signal?.aborted ? cancel(checkpoint) : checkpoint.continue()));
                continue;
            }
            const suspended = step;
            try {
                if (!this.host) throw Object.assign(new Error('Host effect requires an asynchronous host adapter.'), { code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' });
                const signal = options.signal;
                const result = await new Promise<import('./runtime-contracts').HostEffectResult>((resolve, reject) => {
                    const abort = (): void => reject(signal?.reason ?? new Error('Execution cancelled'));
                    if (signal?.aborted) {
                        abort();
                        return;
                    }
                    signal?.addEventListener('abort', abort, { once: true });
                    this.host!.request(suspended.effect, {
                        sessionId: this.options.id ?? 'in-process',
                        ...(signal ? { signal } : {}),
                        ...(deadline !== undefined ? { deadline } : {}),
                    })
                        .then(resolve, reject)
                        .finally(() => signal?.removeEventListener('abort', abort));
                });
                if (signal?.aborted) throw signal.reason;
                if (suspended.effect.type === 'read-text') {
                    if (typeof result.value !== 'string') throw new Error(`Host returned a non-text value for ${suspended.effect.reference}.`);
                    const loaded = this.environment.run(() => this.interpreter.Parse(result.value as string));
                    await this.evaluateWithEffects(loaded, options, deadline, depth + 1, outputs);
                    outputs.push({ type: 'text', text: `Loaded script from ${suspended.effect.reference}` });
                }
                step = this.environment.run(() => suspended.resume(result));
            } catch (error) {
                step = this.environment.run(() => (options.signal?.aborted ? cancel(suspended) : suspended.fail(error)));
            }
        }
        if (step.state === 'completed') return step.value;
        if (step.state === 'error') throw step.diagnostics[0]?.cause ?? new Error(step.diagnostics[0]?.message);
        if (step.state === 'control') throw new Error(`${step.transfer.kind} escaped its valid execution context.`);
        if (step.state === 'cancelled') throw new ExecutionCancellation(step.reason);
        throw new Error('Unsupported execution state.');
    }

    public async interrupt(reason: unknown = 'Execution interrupted'): Promise<void> {
        if (this.activeExecutions.size === 0) this.interrupted = reason;
        for (const controller of this.activeExecutions) controller.abort(reason);
    }

    public async reset(): Promise<void> {
        this.assertActive();
        this.interpreter = Interpreter.Create(this.options.interpreter);
        this.environment = new RuntimeEnvironment();
        this.interrupted = undefined;
    }

    public async dispose(): Promise<void> {
        if (this.disposed) return;
        this.disposed = true;
        const reason = Object.assign(new Error('MathJSLab runtime session is disposed.'), { code: 'MATHJSLAB_DISPOSED' });
        for (const controller of this.activeExecutions) controller.abort(reason);
        this.interpreter.Clear('all');
        this.onDispose?.(this);
    }

    private assertActive(): void {
        if (this.disposed) throw new Error('MathJSLab runtime session is disposed.');
    }
}

export class InProcessMathJSLabRuntime implements MathJSLabRuntime {
    private readonly sessions = new Set<InProcessSession>();
    private disposed = false;

    public constructor(private readonly options: RuntimeOptions = {}) {}

    public async createSession(options: SessionOptions = {}): Promise<RuntimeSession> {
        if (this.disposed) throw new Error('MathJSLab runtime is disposed.');
        const merged = { ...this.options.sessionDefaults, ...options, interpreter: options.interpreter ?? this.options.sessionDefaults?.interpreter };
        const session = new InProcessSession(merged, this.options.host, this.options.evaluate, (disposed) => this.sessions.delete(disposed));
        this.sessions.add(session);
        return session;
    }

    public async dispose(): Promise<void> {
        if (this.disposed) return;
        this.disposed = true;
        await Promise.all(Array.from(this.sessions, (session) => session.dispose()));
        this.sessions.clear();
    }
}

export const createInProcessMathJSLabRuntime = (options: RuntimeOptions = {}): MathJSLabRuntime => new InProcessMathJSLabRuntime(options);
