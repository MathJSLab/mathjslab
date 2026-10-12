import type { Interpreter, InterpreterConfig } from './Interpreter';
import type { NodeInput } from './AST';
import type { RuntimeDiagnostic, RuntimeOutput, RuntimeHost } from './execution-contracts';

export * from './execution-contracts';

export type RuntimeStatus = 'success' | 'error' | 'cancelled' | 'timeout';
export type ParseResult = { readonly source: string; readonly normalized: string; readonly diagnostics: readonly RuntimeDiagnostic[] };
export type ExecutionOptions = { readonly signal?: AbortSignal; readonly timeoutMs?: number };
export type ExecutionResult = { readonly status: RuntimeStatus; readonly outputs: readonly RuntimeOutput[]; readonly diagnostics: readonly RuntimeDiagnostic[] };
export type ParforPolicy = 'strict' | 'fallback' | 'off';
export type SessionOptions = { readonly interpreter?: InterpreterConfig; readonly id?: string; readonly parfor?: ParforPolicy };
export type RuntimeEvaluation = { readonly value: NodeInput; readonly outputs?: readonly RuntimeOutput[] };
/** Host integration options; local evaluator hooks cannot cross a Worker boundary. */
export type RuntimeOptions = {
    readonly host?: RuntimeHost;
    /** Remote factories support parfor defaults; interpreter defaults are local-only. */
    readonly sessionDefaults?: Omit<SessionOptions, 'id'>;
    /** Synchronous in-process hook. Remote factories reject this option. */
    readonly evaluate?: (interpreter: Interpreter, operation: () => NodeInput) => RuntimeEvaluation;
    readonly maxWorkers?: number;
};

/** One active execution owns the session workspace, including remote parfor coordination. */
export interface RuntimeSession {
    /** Rejects while executing/resetting or after disposal. */
    parse(source: string): Promise<ParseResult>;
    /** Concurrent calls return MATHJSLAB_SESSION_BUSY; disposed sessions reject. */
    execute(source: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    /** Cancels active execution and remote children; completed effects are not rolled back. */
    interrupt(reason?: unknown): Promise<void>;
    /** Cancels active work before clearing state; remote runtimes recreate their Worker. */
    reset(): Promise<void>;
    /** Idempotent; releases owned execution resources and rejects later operations. */
    dispose(): Promise<void>;
}
export interface MathJSLabRuntime {
    createSession(options?: SessionOptions): Promise<RuntimeSession>;
    dispose(): Promise<void>;
}
