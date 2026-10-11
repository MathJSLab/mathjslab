import type { EncodedRuntimeValue } from './RuntimeValueCodec';

export type RuntimeDiagnostic = { readonly code: string; readonly severity: 'info' | 'warning' | 'error'; readonly message: string; readonly cause?: unknown };
export type RuntimeOutput =
    | { readonly type: 'text'; readonly text: string }
    | { readonly type: 'mathml'; readonly markup: string }
    | { readonly type: 'data'; readonly value: EncodedRuntimeValue }
    | { readonly type: 'visualization'; readonly renderer: string; readonly request: unknown };
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
