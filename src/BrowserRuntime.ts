import { RemoteMathJSLabRuntime, type RuntimeWorkerEndpoint, type RuntimeWorkerFactory } from './RemoteRuntime';
import type { MathJSLabRuntime, RuntimeOptions } from './runtime-contracts';

/** Browser runtime configuration with an optional host-owned Module Worker factory. */
export type BrowserRuntimeOptions = RuntimeOptions & { readonly workerFactory?: RuntimeWorkerFactory };

const browserWorkerBundle = 'mathjslab.runtime-worker.esm2022.js';
// Preserve the public Worker artifact URL without emitting an extra Worker copy.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore import.meta is emitted only by the ESM browser runtime entrypoint.
const resolveBrowserWorkerUrl = (): URL => Reflect.construct(URL, [browserWorkerBundle, import.meta.url]) as URL;
/** Creates a browser runtime whose default Worker resolves beside the distributed runtime bundle. */
export const createBrowserMathJSLabRuntime = (options: BrowserRuntimeOptions = {}): MathJSLabRuntime =>
    new RemoteMathJSLabRuntime(options.workerFactory ?? (() => new Worker(resolveBrowserWorkerUrl(), { type: 'module', name: 'mathjslab-runtime' }) as RuntimeWorkerEndpoint), options);
