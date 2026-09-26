import type { Interpreter, InterpreterConfig } from './Interpreter';
import type { NodeInput } from './AST';
import type { EncodedRuntimeValue } from './RuntimeValueCodec';

export type RuntimeStatus = 'success' | 'error' | 'cancelled' | 'timeout';
export type RuntimeDiagnostic = { readonly code: string; readonly severity: 'info' | 'warning' | 'error'; readonly message: string; readonly cause?: unknown };
export type RuntimeOutput =
    | { readonly type: 'text'; readonly text: string }
    | { readonly type: 'mathml'; readonly markup: string }
    | { readonly type: 'data'; readonly value: EncodedRuntimeValue }
    | { readonly type: 'visualization'; readonly renderer: string; readonly request: unknown };
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

export type HostEffect =
    | { readonly type: 'read-text'; readonly reference: string }
    | { readonly type: 'read-binary'; readonly reference: string }
    | { readonly type: 'storage-get'; readonly key: string }
    | { readonly type: 'storage-set'; readonly key: string; readonly value: EncodedRuntimeValue }
    | { readonly type: 'clock-now' }
    | { readonly type: 'delay'; readonly milliseconds: number }
    | { readonly type: 'publish-output'; readonly output: RuntimeOutput };
export type HostEffectResult = { readonly value?: unknown };
export type HostEffectContext = { readonly sessionId: string; readonly signal?: AbortSignal; readonly deadline?: number };
export interface RuntimeHost {
    request(effect: HostEffect, context: HostEffectContext): Promise<HostEffectResult>;
}
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
