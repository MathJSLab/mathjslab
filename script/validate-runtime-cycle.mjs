import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The target is an installed package root (or the local distribution for bundle tests).
const installed = path.resolve(process.argv[2] ?? '.');
const { createNodeMathJSLabRuntime } = await import(pathToFileURL(path.join(installed, 'lib/mathjslab.runtime-node.esm2022.js')).href);
const fixtures = path.resolve('test/compatibility/fixtures');
const effects = [];
let entered;
let waiting = new Promise((resolve) => {
    entered = resolve;
});
const runtime = createNodeMathJSLabRuntime({
    host: {
        request: async (effect) => {
            effects.push(effect.type);
            if (effect.type === 'read-text') {
                assert.ok(['cycle-outer.m', 'cycle-inner.m'].includes(effect.reference));
                return { value: await readFile(path.join(fixtures, effect.reference), 'utf8') };
            }
            if (effect.type === 'delay' && effect.milliseconds === 999000) {
                entered();
                return new Promise(() => {});
            }
            return {};
        },
    },
});
try {
    const session = await runtime.createSession();
    const isolated = await runtime.createSession();
    const result = await session.execute(await readFile(path.join(fixtures, 'core-cycle.m'), 'utf8'));
    assert.equal(result.status, 'success', JSON.stringify(result.diagnostics));
    assert.equal(result.outputs[0]?.text, 'true\n');
    assert.equal(effects.filter((type) => type === 'read-text').length, 2);
    assert.equal(effects.filter((type) => type === 'delay').length, 5);
    assert.equal((await isolated.execute('exist("dest","var")')).outputs[0]?.text, '0\n');
    const validationSource = (await readFile('test/node/fixtures/resumable-validation.m', 'utf8')) + (await readFile(path.join(fixtures, 'validation-cycle.m'), 'utf8'));
    const validated = await session.execute(validationSource);
    assert.equal(validated.status, 'success', JSON.stringify(validated.diagnostics));
    assert.equal(validated.outputs[0]?.text, 'true\n');
    const dynamicSource = (await readFile('test/node/fixtures/resumable-dynamic.m', 'utf8')) + (await readFile(path.join(fixtures, 'dynamic-cycle.m'), 'utf8'));
    const dynamicResult = await session.execute(dynamicSource);
    assert.equal(dynamicResult.status, 'success', JSON.stringify(dynamicResult.diagnostics));
    assert.equal(dynamicResult.outputs[0]?.text, 'true\n');
    const classesSource = (await readFile('test/node/fixtures/resumable-classes.m', 'utf8')) + (await readFile(path.join(fixtures, 'classes-cycle.m'), 'utf8'));
    const classesResult = await session.execute(classesSource);
    assert.equal(classesResult.status, 'success', JSON.stringify(classesResult.diagnostics));
    assert.equal(classesResult.outputs[0]?.text, 'true\n');
    const protocolsSource = (await readFile('test/node/fixtures/resumable-protocols.m', 'utf8')) + (await readFile(path.join(fixtures, 'protocols-cycle.m'), 'utf8'));
    const protocolsResult = await session.execute(protocolsSource);
    assert.equal(protocolsResult.status, 'success', JSON.stringify(protocolsResult.diagnostics));
    assert.equal(protocolsResult.outputs[0]?.text, 'true\n');
    const randomResult = await session.execute(await readFile(path.join(fixtures, 'random-cycle.m'), 'utf8'));
    assert.equal(randomResult.status, 'success', JSON.stringify(randomResult.diagnostics));
    assert.equal(randomResult.outputs[0]?.text, 'true\n');
    await isolated.execute('rng(42);');
    await session.execute('rng(42); rand(2);');
    const independent = await isolated.execute('rand(2)');
    await session.execute('rng(42);');
    assert.equal((await session.execute('rand(2)')).outputs[0]?.text, independent.outputs[0]?.text);
    const educationalResult = await session.execute(await readFile(path.join(fixtures, 'educational-math-cycle.m'), 'utf8'));
    assert.equal(educationalResult.status, 'success', JSON.stringify(educationalResult.diagnostics));
    assert.equal(educationalResult.outputs[0]?.text, 'true\n');
    const rejectedValidation = await session.execute('value=validated(-1);');
    assert.equal(rejectedValidation.status, 'error');
    assert.match(rejectedValidation.diagnostics[0]?.message ?? '', /validation rejected value/);
    assert.equal((await session.execute('eig([0,-1;1,0])')).status, 'error');
    const plots = await session.execute('plot([1,2]); histogram([3,4]);');
    assert.deepEqual(
        plots.outputs.filter((output) => output.type === 'visualization').map((output) => output.request.type),
        ['plot', 'histogram'],
    );
    const controller = new AbortController();
    const active = session.execute('function y=blocked_index(), pause(999); y=2; end; [dest(1),dest(blocked_index())]=size([1,2]);', { signal: controller.signal });
    await waiting;
    controller.abort('cycle cancellation');
    assert.equal((await active).status, 'cancelled');
    assert.equal((await session.execute('exist("dest","var")')).outputs[0]?.text, '0\n');
    waiting = new Promise((resolve) => {
        entered = resolve;
    });
    const validationAbort = new AbortController();
    const pendingValidation = session.execute('function checkpending(x), pause(999); end; function y=pending(x), arguments, x double {checkpending}; end; y=x; end; target=pending(3);', {
        signal: validationAbort.signal,
    });
    await waiting;
    validationAbort.abort('cancel validator');
    assert.equal((await pendingValidation).status, 'cancelled');
    assert.equal((await session.execute('exist("target","var")')).outputs[0]?.text, '0\n');
    waiting = new Promise((resolve) => {
        entered = resolve;
    });
    const dynamicAbort = new AbortController();
    const pendingDynamic = session.execute('eval("pause(999); pendingDynamicValue=3;","pendingDynamicCaught=1;");', { signal: dynamicAbort.signal });
    await waiting;
    dynamicAbort.abort('cancel dynamic evaluation');
    assert.equal((await pendingDynamic).status, 'cancelled');
    assert.equal((await session.execute('exist("pendingDynamicValue","var")+exist("pendingDynamicCaught","var")')).outputs[0]?.text, '0\n');
    waiting = new Promise((resolve) => {
        entered = resolve;
    });
    const classAbort = new AbortController();
    const pendingClass = session.execute(
        'classdef WaitingEvent < handle; events; Changed; end; end; function waitEvent(source,data), pause(999); end; object=WaitingEvent(); listener=addlistener(object,"Changed",@waitEvent); notify(object,"Changed"); pendingClassValue=1;',
        { signal: classAbort.signal },
    );
    await waiting;
    classAbort.abort('cancel class event');
    assert.equal((await pendingClass).status, 'cancelled');
    assert.equal((await session.execute('exist("pendingClassValue","var")')).outputs[0]?.text, '0\n');
    waiting = new Promise((resolve) => {
        entered = resolve;
    });
    const protocolAbort = new AbortController();
    const pendingProtocol = session.execute(
        'classdef WaitingProtocol; methods; function value=double(obj), pause(999); value=1; end; end; end; obj=WaitingProtocol(); protocolDestination=double(obj);',
        { signal: protocolAbort.signal },
    );
    await waiting;
    protocolAbort.abort('cancel builtin coercion');
    assert.equal((await pendingProtocol).status, 'cancelled');
    assert.equal((await session.execute('exist("protocolDestination","var")')).outputs[0]?.text, '0\n');
    await session.dispose();
    await session.dispose();
    assert.equal((await isolated.execute('2+2')).outputs[0]?.text, '4\n');
    console.log('Runtime cycle passed against package distribution:', installed);
} finally {
    await runtime.dispose();
}
