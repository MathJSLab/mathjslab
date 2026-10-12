import { parentPort } from 'node:worker_threads';
import { RuntimeWorkerServer, createInProcessMathJSLabRuntime } from 'mathjslab/runtime';

const listeners = new Map();
new RuntimeWorkerServer(
    {
        postMessage: (message, transfer = []) => parentPort.postMessage(message, transfer),
        addEventListener: (_type, listener) => {
            const wrapped = (message) => listener({ data: message });
            listeners.set(listener, wrapped);
            parentPort.on('message', wrapped);
        },
        removeEventListener: (_type, listener) => {
            parentPort.off('message', listeners.get(listener));
            listeners.delete(listener);
        },
    },
    (host) =>
        createInProcessMathJSLabRuntime({
            host,
            sessionDefaults: {
                interpreter: {
                    scriptSourceTable: {
                        outer: 'count+=1; source("inner"); count+=10; answer=helper(); function y=helper(), y=42; end',
                        inner: 'count+=100; pause(0.001); count+=1000;',
                    },
                },
            },
        }),
);
