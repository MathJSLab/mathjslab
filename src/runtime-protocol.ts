import type { ExecutionResult, HostEffect, HostEffectContext, HostEffectResult, ParforPolicy, ParseResult } from './runtime-contracts';
import type { NumericEnvironmentOptions } from './RuntimeEnvironment';

/** Version checked by both ends before processing Worker messages. */
export const runtimeProtocolVersion = 2 as const;
/** Session lifecycle and evaluation commands; create carries serializable numeric preferences. */
export type RuntimeCommand =
    | { readonly type: 'create'; readonly sessionId: string; readonly parfor?: ParforPolicy; readonly numeric?: NumericEnvironmentOptions }
    | { readonly type: 'parse'; readonly sessionId: string; readonly source: string }
    | { readonly type: 'execute'; readonly sessionId: string; readonly source: string }
    | { readonly type: 'reset'; readonly sessionId: string }
    | { readonly type: 'dispose'; readonly sessionId: string };
/** Correlates one versioned command with its eventual response. */
export type RuntimeRequest = { readonly protocol: typeof runtimeProtocolVersion; readonly requestId: string; readonly command: RuntimeCommand };
/** Settles a Worker host-effect request with either its result or serialized failure. */
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
/** Messages accepted by the Worker: runtime commands and host effect replies. */
export type RuntimeInboundMessage = RuntimeRequest | RuntimeEffectResult;
/** Successful command payload; numericConfigured acknowledges explicit numeric creation options. */
export type RuntimeResponseValue =
    | { readonly type: 'created' | 'reset' | 'disposed'; readonly numericConfigured?: true }
    | { readonly type: 'parsed'; readonly result: ParseResult }
    | { readonly type: 'executed'; readonly result: ExecutionResult };
/** Transport-safe error identity, message, optional stack and stable diagnostic code. */
export type RuntimeSerializedError = { readonly name: string; readonly message: string; readonly stack?: string; readonly code?: string };
/** Versioned command reply paired with its request identifier. */
export type RuntimeResponse =
    | { readonly protocol: typeof runtimeProtocolVersion; readonly requestId: string; readonly ok: true; readonly result: RuntimeResponseValue }
    | { readonly protocol: typeof runtimeProtocolVersion; readonly requestId: string; readonly ok: false; readonly error: RuntimeSerializedError };
/** Worker request for a host capability with owning session and deadline context. */
export type RuntimeEffectRequest = {
    readonly protocol: typeof runtimeProtocolVersion;
    readonly type: 'effect-request';
    readonly effectId: string;
    readonly effect: HostEffect;
    readonly context: HostEffectContext;
};
/** Messages emitted by the Worker: command replies and host capability requests. */
export type RuntimeOutboundMessage = RuntimeResponse | RuntimeEffectRequest;

/** Copies supported error fields without attempting to transport arbitrary exception objects. */
export const serializeRuntimeError = (reason: unknown): RuntimeSerializedError => {
    if (!(reason instanceof Error)) return { name: 'Error', message: String(reason) };
    const code = Reflect.get(reason, 'code');
    return { name: reason.name, message: reason.message, ...(reason.stack ? { stack: reason.stack } : {}), ...(typeof code === 'string' ? { code } : {}) };
};
