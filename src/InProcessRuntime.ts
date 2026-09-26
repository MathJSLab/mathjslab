import { AST, type NodeInput } from './AST';
import { CharString } from './CharString';
import { Interpreter } from './Interpreter';
import { RuntimeValueCodec } from './RuntimeValueCodec';
import { RuntimeEnvironment } from './RuntimeEnvironment';
import { ExecutionMachine } from './ExecutionMachine';
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
        { code: timeout ? 'MATHJSLAB_TIMEOUT' : 'MATHJSLAB_ABORTED', severity: 'error', message: reason instanceof Error ? reason.message : String(reason ?? 'Execution cancelled') },
    ],
});

const containsParfor = (node: NodeInput): boolean => {
    if (!AST.isNodeBase(node)) return false;
    if (node.type === 'FOR' && Reflect.get(node, 'parallel') === true) return true;
    for (const value of Object.values(node)) {
        if (Array.isArray(value) && value.some((entry) => entry && typeof entry === 'object' && containsParfor(entry as NodeInput))) return true;
        if (value && typeof value === 'object' && value !== node.parent && AST.isNodeBase(value) && containsParfor(value)) return true;
    }
    return false;
};

class InProcessSession implements RuntimeSession {
    private interpreter: Interpreter;
    private environment = new RuntimeEnvironment();
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
            if (options.timeoutMs !== undefined && Date.now() - started > options.timeoutMs) return abortResult(true, `Execution exceeded ${options.timeoutMs} ms`);
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
            return { status: 'error', outputs: [], diagnostics: [diagnostic(error)] };
        }
    }

    private async evaluateWithEffects(tree: NodeInput, options: ExecutionOptions, deadline: number | undefined, depth = 0, outputs: RuntimeOutput[] = []): Promise<NodeInput> {
        if (depth > 16) throw new Error('Runtime resource loading exceeded the maximum nesting depth (16).');
        const statements = tree.type === 'LIST' ? tree.list : [tree];
        let evaluated: NodeInput = AST.nodeVoid();
        for (const statement of statements) {
            if (options.signal?.aborted) throw options.signal.reason ?? new Error('Execution cancelled');
            if (deadline !== undefined && Date.now() > deadline) throw new Error(`Execution exceeded ${options.timeoutMs} ms`);
            const expression = statement.type === 'IDX' ? statement : statement.type === '=' && statement.right.type === 'IDX' ? statement.right : undefined;
            const functionName = expression?.expr.type === 'IDENT' ? expression.expr.id.toLowerCase() : undefined;
            const loadReference = functionName === 'load' && expression?.args.length === 1 && CharString.isInstanceOf(expression.args[0]) ? expression.args[0].str : undefined;
            if (loadReference !== undefined && this.host) {
                const machine = ExecutionMachine.effect({ type: 'read-text', reference: loadReference }, (result) => result);
                const step = machine.runUntilYield();
                if (step.state !== 'effect') throw new Error('Runtime effect machine did not yield.');
                const hostResult = await this.host.request(step.effect, {
                    sessionId: this.options.id ?? 'in-process',
                    ...(options.signal ? { signal: options.signal } : {}),
                    ...(deadline !== undefined ? { deadline } : {}),
                });
                const resumed = step.resume(hostResult);
                if (resumed.state !== 'completed') throw new Error(resumed.state === 'error' ? resumed.diagnostics[0]?.message : 'Runtime effect did not complete.');
                const result = resumed.value;
                if (typeof result.value !== 'string') throw new Error(`Host returned a non-text value for ${loadReference}.`);
                const loaded = this.environment.run(() => this.interpreter.Parse(result.value as string));
                await this.evaluateWithEffects(loaded, options, deadline, depth + 1, outputs);
                outputs.push({ type: 'text', text: `Loaded script from ${loadReference}` });
                evaluated = AST.nodeVoid();
                continue;
            }
            if (functionName === 'pause' && expression?.args.length === 1 && this.host) {
                const milliseconds = Number(this.environment.run(() => this.interpreter.Unparse(this.interpreter.Evaluator(expression.args[0])))) * 1000;
                if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new Error('pause duration must be a finite nonnegative scalar.');
                const machine = ExecutionMachine.effect({ type: 'delay', milliseconds }, () => undefined);
                const step = machine.runUntilYield();
                if (step.state !== 'effect') throw new Error('Runtime delay machine did not yield.');
                step.resume(
                    await this.host.request(step.effect, {
                        sessionId: this.options.id ?? 'in-process',
                        ...(options.signal ? { signal: options.signal } : {}),
                        ...(deadline !== undefined ? { deadline } : {}),
                    }),
                );
                continue;
            }
            const result = this.environment.run(() =>
                this.evaluateHook ? this.evaluateHook(this.interpreter, () => this.interpreter.Evaluator(statement)) : { value: this.interpreter.Evaluator(statement) },
            );
            evaluated = result.value;
            if (result.outputs) outputs.push(...result.outputs);
        }
        return evaluated;
    }

    public async interrupt(reason: unknown = 'Execution interrupted'): Promise<void> {
        this.interrupted = reason;
    }

    public async reset(): Promise<void> {
        this.assertActive();
        this.interpreter = Interpreter.Create(this.options.interpreter);
        this.environment = new RuntimeEnvironment();
        this.interrupted = undefined;
    }

    public async dispose(): Promise<void> {
        if (this.disposed) return;
        this.interpreter.Clear('all');
        this.disposed = true;
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
