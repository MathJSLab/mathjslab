import { Worker } from 'node:worker_threads';

/** Native Worker bridge for the public workerFactory option. */
export function benchmarkWorker(packageRoot, engine) {
    const worker = new Worker(new URL('./worker-bootstrap.mjs', import.meta.url), { workerData: { packageRoot, engine }, execArgv: [], name: `mathjslab-benchmark-${engine}` });
    const subscriptions = new Map();
    let termination;
    return {
        postMessage: (message, transfer = []) => worker.postMessage(message, transfer),
        addEventListener(type, listener) {
            const wrapped = type === 'message' ? (data) => listener({ data }) : (error) => listener({ type, error, message: error.message });
            if (!subscriptions.has(type)) subscriptions.set(type, new Map());
            subscriptions.get(type).set(listener, wrapped);
            worker.on(type, wrapped);
        },
        removeEventListener(type, listener) {
            const wrapped = subscriptions.get(type)?.get(listener);
            if (wrapped) worker.off(type, wrapped);
            subscriptions.get(type)?.delete(listener);
        },
        terminate: () => (termination ??= worker.terminate()),
    };
}
