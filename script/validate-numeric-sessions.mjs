import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const installed = path.resolve(process.argv[2] ?? '.');
const { createInProcessMathJSLabRuntime } = await import(pathToFileURL(path.join(installed, 'lib/mathjslab.node.esm2022.js')).href);
const { createNodeMathJSLabRuntime } = await import(pathToFileURL(path.join(installed, 'lib/mathjslab.runtime-node.esm2022.js')).href);
for (const [driver, factory] of [
    ['local', createInProcessMathJSLabRuntime],
    ['node-worker', createNodeMathJSLabRuntime],
]) {
    let entered;
    const waiting = new Promise((resolve) => {
        entered = resolve;
    });
    const runtime = factory({
        host: {
            request: async (effect) => {
                if (effect.type === 'delay' && effect.milliseconds === 999000) {
                    entered();
                    return new Promise(() => {});
                }
                return {};
            },
        },
    });
    try {
        const decimal = await runtime.createSession({ numeric: { engine: 'decimal', complex: { precision: 40 } } });
        const native = await runtime.createSession({ numeric: { engine: 'number' } });
        const check = async (session, source, expected) => {
            const result = await session.execute(source);
            assert.equal(result.status, 'success', `${driver}: ${JSON.stringify(result.diagnostics)}`);
            assert.equal(result.outputs[0]?.text, expected);
        };
        await check(decimal, 'a=1e-30; f=@(x)x+a; abs(f(1e-30)/1e-30-2)<1e-12', 'true\n');
        await check(native, 'i*i==-1 && sin(pi/2)>0.99 && sum(1:10)==55', 'true\n');
        await check(decimal, 'getconfig("precision")', '{precision,40}\n');
        for (const [session, engine, precision] of [
            [decimal, 'decimal', 40],
            [native, 'number', 15],
        ]) {
            const attempted = await session.execute(`configure({'precision',12;'real','${engine === 'number' ? 'decimal' : 'number'}'})`);
            assert.equal(attempted.status, 'success', JSON.stringify(attempted.diagnostics));
            await check(session, 'getconfig("real")', `{real,${engine === 'number' ? 'decimal' : 'number'}}\n`);
            await check(session, '1+1', '2\n');
            await session.reset();
            await check(session, 'getconfig("real")', `{real,${engine}}\n`);
            await check(session, 'getconfig("precision")', `{precision,${precision}}\n`);
        }
        const controller = new AbortController();
        const active = native.execute('pause(999); pending=7;', { signal: controller.signal });
        await waiting;
        controller.abort('numeric session cancellation');
        assert.equal((await active).status, 'cancelled');
        await check(native, '1+1', '2\n');
        await check(native, 'exist("pending","var")', '0\n');
        await check(native, 'getconfig("real")', '{real,number}\n');
        await native.dispose();
        await native.dispose();
        await check(decimal, '1+1', '2\n');
    } finally {
        await runtime.dispose();
    }
}
console.log('Numeric session creation, isolation, backend switching, reset, cancellation and disposal passed against installed distributions.');
