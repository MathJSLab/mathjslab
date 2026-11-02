import { workerData } from 'node:worker_threads';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Configure the unique distributed core before the server creates any sessions.
const { Complex } = await import(pathToFileURL(path.join(workerData.packageRoot, 'lib/mathjslab.node.esm2022.js')).href);
Complex.engine = workerData.engine;
if (workerData.engine === 'decimal') Complex.set({ precision: 40, precisionCompare: 7 });
await import(pathToFileURL(path.join(workerData.packageRoot, 'lib/mathjslab.runtime-node-worker.esm2022.js')).href);
