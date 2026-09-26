import { parentPort } from 'node:worker_threads';

import { RuntimeWorkerServer, type RuntimeWorkerServerScope } from './RuntimeWorkerServer';
import type { RuntimeInboundMessage, RuntimeOutboundMessage } from './runtime-protocol';

if (!parentPort) throw new Error('MathJSLab Node runtime worker requires a parent port.');
const port = parentPort;
const listeners = new Map<(event: MessageEvent<RuntimeInboundMessage>) => void, (message: RuntimeInboundMessage) => void>();
const scope: RuntimeWorkerServerScope = {
    postMessage: (message: RuntimeOutboundMessage, transfer = []) => port.postMessage(message, transfer as ArrayBuffer[]),
    addEventListener: (_type, listener) => {
        const wrapped = (message: RuntimeInboundMessage): void => listener({ data: message } as MessageEvent<RuntimeInboundMessage>);
        listeners.set(listener, wrapped);
        port.on('message', wrapped);
    },
    removeEventListener: (_type, listener) => {
        const wrapped = listeners.get(listener);
        if (wrapped) port.off('message', wrapped);
        listeners.delete(listener);
    },
};
new RuntimeWorkerServer(scope);
