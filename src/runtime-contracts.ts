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
export type RuntimeOptions = {
    readonly host?: RuntimeHost;
    readonly sessionDefaults?: Omit<SessionOptions, 'id'>;
    readonly evaluate?: (interpreter: Interpreter, operation: () => NodeInput) => RuntimeEvaluation;
    readonly maxWorkers?: number;
};

export interface RuntimeSession {
    parse(source: string): Promise<ParseResult>;
    execute(source: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    interrupt(reason?: unknown): Promise<void>;
    reset(): Promise<void>;
    dispose(): Promise<void>;
}
export interface MathJSLabRuntime {
    createSession(options?: SessionOptions): Promise<RuntimeSession>;
    dispose(): Promise<void>;
}
