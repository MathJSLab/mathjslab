import type { ExecutionResult, HostEffect, HostEffectContext, HostEffectResult, ParforPolicy, ParseResult } from './runtime-contracts';

export const runtimeProtocolVersion = 2 as const;
export type RuntimeCommand =
    | { readonly type: 'create'; readonly sessionId: string; readonly parfor?: ParforPolicy }
    | { readonly type: 'parse'; readonly sessionId: string; readonly source: string }
    | { readonly type: 'execute'; readonly sessionId: string; readonly source: string }
    | { readonly type: 'reset'; readonly sessionId: string }
    | { readonly type: 'dispose'; readonly sessionId: string };
export type RuntimeRequest = { readonly protocol: typeof runtimeProtocolVersion; readonly requestId: string; readonly command: RuntimeCommand };
export type RuntimeEffectResult =
    | {
          readonly protocol: typeof runtimeProtocolVersion;
          readonly type: 'effect-result';
          readonly effectId: string;
          readonly ok: true;
          readonly result: HostEffectResult;
      }
    | {
          readonly protocol: typeof runtimeProtocolVersion;
          readonly type: 'effect-result';
          readonly effectId: string;
          readonly ok: false;
          readonly error: RuntimeSerializedError;
      };
export type RuntimeInboundMessage = RuntimeRequest | RuntimeEffectResult;
export type RuntimeResponseValue =
    { readonly type: 'created' | 'reset' | 'disposed' } | { readonly type: 'parsed'; readonly result: ParseResult } | { readonly type: 'executed'; readonly result: ExecutionResult };
export type RuntimeSerializedError = { readonly name: string; readonly message: string; readonly stack?: string; readonly code?: string };
export type RuntimeResponse =
    | { readonly protocol: typeof runtimeProtocolVersion; readonly requestId: string; readonly ok: true; readonly result: RuntimeResponseValue }
    | { readonly protocol: typeof runtimeProtocolVersion; readonly requestId: string; readonly ok: false; readonly error: RuntimeSerializedError };
export type RuntimeEffectRequest = {
    readonly protocol: typeof runtimeProtocolVersion;
    readonly type: 'effect-request';
    readonly effectId: string;
    readonly effect: HostEffect;
    readonly context: HostEffectContext;
};
export type RuntimeOutboundMessage = RuntimeResponse | RuntimeEffectRequest;

export const serializeRuntimeError = (reason: unknown): RuntimeSerializedError => {
    if (!(reason instanceof Error)) return { name: 'Error', message: String(reason) };
    const code = Reflect.get(reason, 'code');
    return { name: reason.name, message: reason.message, ...(reason.stack ? { stack: reason.stack } : {}), ...(typeof code === 'string' ? { code } : {}) };
};
