import type { HostEffect, HostEffectContext, HostEffectResult, RuntimeHost } from './execution-contracts';

/** Await a host once; cancellation does not depend on the host settling. */
export const requestHostEffect = async (host: RuntimeHost, effect: HostEffect, context: HostEffectContext): Promise<HostEffectResult> => {
    const signal = context.signal;
    let abort: (() => void) | undefined;
    try {
        return await new Promise<HostEffectResult>((resolve, reject) => {
            abort = () => reject(signal?.reason ?? new Error('Execution cancelled'));
            if (signal?.aborted) {
                abort();
                return;
            }
            signal?.addEventListener('abort', abort, { once: true });
            host.request(effect, context).then(resolve, reject);
        });
    } finally {
        if (abort) signal?.removeEventListener('abort', abort);
    }
};
