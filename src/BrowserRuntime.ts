import { RemoteMathJSLabRuntime, type RuntimeWorkerEndpoint, type RuntimeWorkerFactory } from './RemoteRuntime';
import type { MathJSLabRuntime, RuntimeOptions } from './runtime-contracts';

export type BrowserRuntimeOptions = RuntimeOptions & { readonly workerFactory?: RuntimeWorkerFactory };

export const createBrowserMathJSLabRuntime = (options: BrowserRuntimeOptions = {}): MathJSLabRuntime =>
    new RemoteMathJSLabRuntime(
        // `import.meta` is intentionally retained for Worker chunk discovery in
        // the ESM browser build; legacy UMD type-checking sees this source but
        // does not include it in that bundle.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore import.meta is emitted only by the ESM runtime entrypoint.
        options.workerFactory ?? (() => new Worker(new URL('./runtime-browser.worker.ts', import.meta.url), { type: 'module', name: 'mathjslab-runtime' }) as RuntimeWorkerEndpoint),
        options,
    );
