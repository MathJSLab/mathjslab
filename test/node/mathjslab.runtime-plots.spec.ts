/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('Distributed session-owned plots', () => {
    test.each(['in-process', 'node-worker'])('prepares plots through %s without application adapters', (driver) => {
        const script = String.raw`
            import assert from 'node:assert/strict';
            import { InProcessMathJSLabRuntime } from 'mathjslab/runtime';
            import { createNodeMathJSLabRuntime } from 'mathjslab/runtime/node';
            const host = { request: async () => ({}) };
            const runtime = process.argv[1] === 'node-worker' ? createNodeMathJSLabRuntime({host}) : new InProcessMathJSLabRuntime({host});
            try {
                const first = await runtime.createSession();
                const second = await runtime.createSession();
                const result = await first.execute('a=2; plot([a,a+1]); pause(0); plot2d(a*x,x,0,1); histogram([3,4])');
                assert.equal(result.status,'success',JSON.stringify(result.diagnostics));
                const plots = result.outputs.filter(output => output.type === 'visualization');
                assert.deepEqual(plots.map(plot => plot.request.type),['plot','plot2d','histogram']);
                assert.deepEqual(plots[0].request.data[0].y,[2,3]);
                assert.equal(plots[1].request.data[0].y[1],0.02);
                const other = await second.execute('a=3; plot2d(a*x,x,0,1)');
                assert.equal(other.outputs.find(output => output.type === 'visualization').request.data[0].y[1],0.03);
                assert.equal((await first.execute('a')).outputs[0].text,'2\n');
            } finally { await runtime.dispose(); }
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script, driver], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });
});
