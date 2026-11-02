import type { HostEffectResult } from './execution-contracts';

/** Local driver callback; never included in Worker messages or public contracts. */
export const scriptLoadCompleted = Symbol('MathJSLab script load completed');
/** Local load response with an optional completion hook for retained script cleanup. */
export type ScriptLoadResult = HostEffectResult & { readonly [scriptLoadCompleted]?: () => void };
