/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('mathjslab/runtime/node published bundle', () => {
    test('executes in worker_threads and recreates a clean worker after interruption', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const runtime = createNodeMathJSLabRuntime();
                const session = await runtime.createSession();
                let result = await session.execute('x=21; x*2');
                if (result.status !== 'success' || result.outputs[0]?.type !== 'text' || result.outputs[0].text !== '42\n') {
                    throw new Error('Unexpected Node runtime result');
                }
                await session.interrupt('test reset');
                result = await session.execute('exist("x","var")');
                if (result.status !== 'success' || result.outputs[0]?.type !== 'text' || result.outputs[0].text !== '0\n') {
                    throw new Error('Worker recovery did not reset the workspace');
                }
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });
});
