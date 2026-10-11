/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('runtime and core distribution identity', () => {
    test.each(['mathjslab/runtime', 'mathjslab/runtime/browser', 'mathjslab/runtime/node'])('shares core values and numeric environment with %s', (entry) => {
        const script = String.raw`
            import assert from 'node:assert/strict';
            const core = await import('mathjslab');
            const runtimeEntry = await import(process.argv[1]);
            assert.equal(runtimeEntry.InProcessMathJSLabRuntime, core.InProcessMathJSLabRuntime);
            assert.equal(runtimeEntry.RuntimeEnvironment, core.RuntimeEnvironment);
            assert.equal(runtimeEntry.RuntimeValueCodec, core.RuntimeValueCodec);
            const runtime = new runtimeEntry.InProcessMathJSLabRuntime({
                host: { request: async () => ({}) },
                sessionDefaults: { interpreter: { externalFunctionTable: {
                    externalIdentity: { type: 'BUILTIN', id: 'externalIdentity', mapper: false, ev: [], func: () => core.ComplexDecimal.create(7) },
                } } },
                evaluate: (interpreter, operation) => {
                    assert.ok(interpreter instanceof core.Interpreter);
                    return { value: operation() };
                },
            });
            const session = await runtime.createSession();
            const result = await session.execute('function y=f(), pause(0); y=externalIdentity(); end; f()+1');
            assert.equal(result.status, 'success', JSON.stringify(result.diagnostics));
            assert.equal(result.outputs[0]?.text, '8\n');
            await runtime.dispose();
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script, entry], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });
});
