import { performance } from 'node:perf_hooks';
import { prepareWorkload } from './workloads.mjs';
import { summarize } from './statistics.mjs';

const options = JSON.parse(process.argv[2]);
const workload = await prepareWorkload(options);
try {
    for (let i = 0; i < options.warmups; i++) workload.verify(await workload.run());
    const samplesMs = [];
    const memory = [];
    for (let i = 0; i < options.samples; i++) {
        if (options.gc) globalThis.gc();
        const before = process.memoryUsage();
        const start = performance.now();
        const value = await workload.run();
        const elapsed = performance.now() - start;
        const after = process.memoryUsage();
        // Verification, memory snapshots and statistics stay outside the timer.
        workload.verify(value);
        samplesMs.push(elapsed);
        memory.push({ heapUsedDelta: after.heapUsed - before.heapUsed, rssDelta: after.rss - before.rss, arrayBuffersDelta: after.arrayBuffers - before.arrayBuffers });
    }
    process.stdout.write(
        JSON.stringify({
            status: 'passed',
            id: options.id,
            engine: options.engine,
            settings: workload.settings,
            metadata: workload.metadata,
            samplesMs,
            timingMs: summarize(samplesMs),
            memory,
        }),
    );
} finally {
    await workload.cleanup();
}
