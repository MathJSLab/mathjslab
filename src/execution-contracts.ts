import type { EncodedRuntimeValue } from './RuntimeValueCodec';

/** Stable diagnostic code, severity and message, with an optional local cause. */
export type RuntimeDiagnostic = { readonly code: string; readonly severity: 'info' | 'warning' | 'error'; readonly message: string; readonly cause?: unknown };
/** Host-renderable output; numeric data uses the lossless runtime value codec. */
export type RuntimeOutput =
    | { readonly type: 'text'; readonly text: string }
    | { readonly type: 'mathml'; readonly markup: string }
    | { readonly type: 'data'; readonly value: EncodedRuntimeValue }
    | { readonly type: 'visualization'; readonly renderer: string; readonly request: unknown };
/** Explicit host capability requested by retained execution; the host owns I/O and rendering. */
export type HostEffect =
    | { readonly type: 'read-text'; readonly reference: string }
    | { readonly type: 'read-binary'; readonly reference: string }
    | { readonly type: 'storage-get'; readonly key: string }
    | { readonly type: 'storage-set'; readonly key: string; readonly value: EncodedRuntimeValue }
    | { readonly type: 'clock-now' }
    | { readonly type: 'delay'; readonly milliseconds: number }
    | { readonly type: 'publish-output'; readonly output: RuntimeOutput };
/** Host response consumed once when the suspended operation resumes. */
export type HostEffectResult = { readonly value?: unknown };
/** Owning session and cancellation/deadline controls for a host request. */
export type HostEffectContext = { readonly sessionId: string; readonly signal?: AbortSignal; readonly deadline?: number };
/** Host capability adapter shared by local and remote runtime drivers. */
export interface RuntimeHost {
    /** Performs one requested effect and settles on completion, failure or cancellation. */
    request(effect: HostEffect, context: HostEffectContext): Promise<HostEffectResult>;
}
