import { RuntimeWorkerServer } from './RuntimeWorkerServer';

new RuntimeWorkerServer(globalThis as unknown as ConstructorParameters<typeof RuntimeWorkerServer>[0]);
