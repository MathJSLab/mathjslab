import { Worker as NodeWorker } from 'node:worker_threads';

import { RemoteMathJSLabRuntime, type RuntimeWorkerEndpoint, type RuntimeWorkerFactory } from './RemoteRuntime';
import type { RuntimeInboundMessage, RuntimeOutboundMessage } from './runtime-protocol';
import type { MathJSLabRuntime, RuntimeOptions } from './runtime-contracts';

class NodeWorkerEndpoint implements RuntimeWorkerEndpoint {
    private readonly messageListeners = new Map<(event: MessageEvent<RuntimeOutboundMessage>) => void, (message: RuntimeOutboundMessage) => void>();
    private readonly errorListeners = new Map<(event: Event) => void, (error: Error) => void>();

    public constructor(private readonly worker: NodeWorker) {}
    public postMessage(message: RuntimeInboundMessage, transfer: ArrayBuffer[] = []): void {
        this.worker.postMessage(message, transfer);
    }
    public addEventListener(type: 'message' | 'error' | 'messageerror', listener: ((event: MessageEvent<RuntimeOutboundMessage>) => void) | ((event: Event) => void)): void {
        if (type === 'message') {
            const wrapped = (message: RuntimeOutboundMessage): void =>
                (listener as (event: MessageEvent<RuntimeOutboundMessage>) => void)({ data: message } as MessageEvent<RuntimeOutboundMessage>);
            this.messageListeners.set(listener as (event: MessageEvent<RuntimeOutboundMessage>) => void, wrapped);
            this.worker.on('message', wrapped);
        } else {
            const wrapped = (error: Error): void => (listener as (event: Event) => void)({ type, error, message: error.message } as unknown as ErrorEvent);
            this.errorListeners.set(listener as (event: Event) => void, wrapped);
            this.worker.on(type, wrapped);
        }
    }
    public removeEventListener(type: 'message' | 'error' | 'messageerror', listener: ((event: MessageEvent<RuntimeOutboundMessage>) => void) | ((event: Event) => void)): void {
        if (type === 'message') {
            const wrapped = this.messageListeners.get(listener as (event: MessageEvent<RuntimeOutboundMessage>) => void);
            if (wrapped) this.worker.off('message', wrapped);
            this.messageListeners.delete(listener as (event: MessageEvent<RuntimeOutboundMessage>) => void);
        } else {
            const wrapped = this.errorListeners.get(listener as (event: Event) => void);
            if (wrapped) this.worker.off(type, wrapped);
            this.errorListeners.delete(listener as (event: Event) => void);
        }
    }
    public terminate(): Promise<number> {
        return this.worker.terminate();
    }
}

export type NodeRuntimeOptions = RuntimeOptions & { readonly workerFactory?: RuntimeWorkerFactory };
const createDefaultNodeWorker = (url: URL): RuntimeWorkerEndpoint =>
    new NodeWorkerEndpoint(new NodeWorker(url, { name: 'mathjslab-runtime', execArgv: process.execArgv.filter((argument) => !argument.startsWith('--input-type')) }));
const nodeWorkerBundle = 'mathjslab.runtime-node-worker.esm2022.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore import.meta is emitted only by the ESM Node runtime entrypoint.
const resolveNodeWorkerUrl = (): URL => Reflect.construct(URL, [nodeWorkerBundle, import.meta.url]) as URL;
export const createNodeMathJSLabRuntime = (options: NodeRuntimeOptions = {}): MathJSLabRuntime =>
    new RemoteMathJSLabRuntime(options.workerFactory ?? (() => createDefaultNodeWorker(resolveNodeWorkerUrl())), options);
