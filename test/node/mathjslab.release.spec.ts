/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('release distribution contracts', () => {
    test('loads public ESM entries and preserves dynamic execution across core bundles', () => {
        const script = String.raw`
            import assert from 'node:assert/strict';
            const nativeCrypto = globalThis.crypto;
            for (const entry of ['mathjslab', 'mathjslab/core', 'mathjslab/runtime', 'mathjslab/runtime/browser', 'mathjslab/runtime/node']) {
                assert.ok(Object.keys(await import(entry)).length > 0, entry);
            }
            assert.equal(globalThis.crypto, nativeCrypto, 'preserve the host crypto implementation');
            for (const entry of ['mathjslab', 'mathjslab/node-esm', 'mathjslab/web-esm']) {
                const { Interpreter } = await import(entry);
                const interpreter = Interpreter.Create({scriptSourceTable: {releaseScript: 'x=1; y=2;'}});
                for (const source of [
                    "feval('eval', 'x=1; y=2;')",
                    "feval(@evalin, 'base', 'x=1; y=2;')",
                    "builtin('run', 'releaseScript')",
                    "feval('source', 'releaseScript')",
                ]) {
                    interpreter.Execute('clear x y');
                    interpreter.Execute(source);
                    assert.equal(interpreter.Unparse(interpreter.Execute('x+y')), '3\n', entry + ': ' + source);
                }
            }
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test.each(['native', 'missing'])('loads public CommonJS entries with %s global crypto', (cryptoMode) => {
        const script = String.raw`
            const assert = require('node:assert/strict');
            if (process.argv[1] === 'missing') delete globalThis.crypto;
            const originalCrypto = globalThis.crypto;
            for (const entry of ['mathjslab', 'mathjslab/node-cjs', 'mathjslab/node-cjs-es2015']) {
                const exports = require(entry);
                const { Interpreter } = exports;
                assert.equal(typeof Interpreter, 'function', entry);
                assert.equal(exports.mathjslab.Interpreter, Interpreter, 'legacy CommonJS namespace');
                const interpreter = Interpreter.Create();
                interpreter.Execute("feval('eval', 'x=1; y=2;')");
                assert.equal(interpreter.Unparse(interpreter.Execute('x+y')), '3\n', entry);
            }
            if (originalCrypto) assert.equal(globalThis.crypto, originalCrypto);
            else assert.equal(typeof globalThis.crypto.randomBytes, 'function');
        `;
        expect(() => execFileSync(process.execPath, ['-e', script, cryptoMode], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });
});
