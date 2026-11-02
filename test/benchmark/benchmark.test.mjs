import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { summarize, compareReports } from '../../script/benchmark/statistics.mjs';

const execute = promisify(execFile);
await mkdir(path.resolve('test-results'), { recursive: true });
const environment = { node: 'v26', v8: '14', platform: 'win32', release: '10', arch: 'x64', cpuModel: 'test CPU', cpuCount: 4, totalMemory: 1000000, execArgv: [] };
const report = (samplesMs = [10, 10, 10, 10, 10]) => ({
    schemaVersion: 1,
    environment: { ...environment },
    configuration: { profile: 'standard', warmups: 3, samples: samplesMs.length, suiteHash: 'fixed', gc: false, timeoutMs: 120000 },
    results: [{ id: 'parse.program', engine: 'number', status: 'passed', settings: { engine: 'number', complex: { precision: 15 } }, samplesMs }],
});

test('summaries retain outliers and use a defined even median and nearest-rank p95', () => {
    assert.deepEqual(summarize([4, 1, 100, 2]), { count: 4, min: 1, median: 3, p95: 100, max: 100, mad: 1.5 });
    assert.throws(() => summarize([]));
    assert.throws(() => summarize([NaN]));
    assert.throws(() => summarize([0]));
});

test('comparison recomputes raw timings and distinguishes stable regressions from noise', () => {
    const candidate = report([13, 13, 13, 13, 13]);
    candidate.results[0].timingMs = { median: 1 }; // Stored summaries must not hide a regression.
    const compared = compareReports(report(), candidate);
    assert.equal(compared.comparable, true);
    assert.equal(compared.regressions, 1);
    assert.ok(Math.abs(compared.rows[0].changePercent - 30) < 1e-9);
    assert.equal(compareReports(report(), report([5, 10, 13, 20, 30])).rows[0].status, 'noisy');
    const short = report([13, 13]);
    assert.equal(compareReports(report([10, 10]), short).rows[0].status, 'insufficient-samples');
});

test('failed or timed-out cases preserve failure evidence without accepted timing samples', { timeout: 30000 }, async () => {
    const directory = await mkdtemp(path.resolve('test-results/benchmark-failure-'));
    await mkdir(path.join(directory, 'lib'));
    await writeFile(path.join(directory, 'package.json'), JSON.stringify({ name: 'mathjslab', version: 'test', type: 'module' }));
    const core = path.join(directory, 'lib/mathjslab.node.esm2022.js');
    for (const filename of ['mathjslab.node.esm2022.js', 'mathjslab.runtime-node.esm2022.js', 'mathjslab.runtime-node-worker.esm2022.js'])
        await writeFile(path.join(directory, 'lib', filename), 'throw Error("deliberate fixture failure");');
    const failed = path.join(directory, 'failed.json');
    await assert.rejects(
        execute(process.execPath, ['script/benchmark/run.mjs', '--profile', 'smoke', '--engines', 'number', '--case', 'parse.program', '--package', directory, '--out', failed]),
        (error) => error.code === 1,
    );
    const failure = JSON.parse(await readFile(failed, 'utf8'));
    assert.equal(failure.status, 'failed');
    assert.match(failure.results[0].error, /deliberate fixture failure/u);
    assert.equal(failure.results[0].samplesMs, undefined);
    await writeFile(core, 'setInterval(()=>{},1000); await new Promise(()=>{});');
    const timed = path.join(directory, 'timed.json');
    await assert.rejects(
        execute(process.execPath, [
            'script/benchmark/run.mjs',
            '--profile',
            'smoke',
            '--engines',
            'number',
            '--case',
            'parse.program',
            '--package',
            directory,
            '--timeout-ms',
            '100',
            '--out',
            timed,
        ]),
        (error) => error.code === 1,
    );
    assert.equal(JSON.parse(await readFile(timed, 'utf8')).results[0].killed, true);
});

test('incompatible settings, hardware, workload identities and case selections cannot gate', () => {
    for (const change of [
        (r) => {
            r.environment.cpuModel = 'another CPU';
        },
        (r) => {
            r.configuration.suiteHash = 'changed';
        },
        (r) => {
            r.configuration.gc = true;
        },
        (r) => {
            r.results[0].settings.complex.precision = 40;
        },
        (r) => {
            r.results[0].id = 'another.case';
        },
    ]) {
        const candidate = report([20, 20, 20, 20, 20]);
        change(candidate);
        const compared = compareReports(report(), candidate);
        assert.equal(compared.comparable, false);
        assert.equal(compared.regressions, 0);
        assert.ok(compared.mismatches.length);
    }
    const incomplete = report();
    delete incomplete.environment.cpuModel;
    assert.throws(() => compareReports(report(), incomplete));
    const duplicate = report();
    duplicate.results.push(duplicate.results[0]);
    assert.throws(() => compareReports(report(), duplicate));
});

test('CLI validates distributed workloads, preserves reports, and has opt-in timing gates', { timeout: 60000 }, async () => {
    const directory = await mkdtemp(path.resolve('test-results/benchmark-test-'));
    const output = path.join(directory, 'smoke.json');
    await execute(process.execPath, [
        'script/benchmark/run.mjs',
        '--profile',
        'smoke',
        '--engines',
        'number',
        '--case',
        'parse.program,matrix.multiply,matrix.multiply-blocked,codec.encode-packed,codec.decode-packed,codec.transfer-packed',
        '--out',
        output,
    ]);
    const actual = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(actual.status, 'passed');
    assert.equal(actual.results.length, 6);
    assert.ok(actual.results.every((result) => result.samplesMs.length === 2 && result.status === 'passed'));
    assert.equal(actual.distribution.name, 'mathjslab');
    const saved = await readFile(output, 'utf8');
    await execute(process.execPath, ['script/benchmark/compare.mjs', output, output]);
    await assert.rejects(execute(process.execPath, ['script/benchmark/compare.mjs', output, output, '--gate']), (error) => error.code === 2);
    await assert.rejects(execute(process.execPath, ['script/benchmark/run.mjs', '--out', output]));
    assert.equal(await readFile(output, 'utf8'), saved);
    await assert.rejects(execute(process.execPath, ['script/benchmark/run.mjs', '--samples', 'NaN']));
    const before = path.join(directory, 'before.json');
    const after = path.join(directory, 'after.json');
    await writeFile(before, JSON.stringify(report()));
    await writeFile(after, JSON.stringify(report([20, 20, 20, 20, 20])));
    await execute(process.execPath, ['script/benchmark/compare.mjs', before, after]);
    await assert.rejects(execute(process.execPath, ['script/benchmark/compare.mjs', before, after, '--gate']), (error) => error.code === 1);
    await execute(process.execPath, ['script/benchmark/compare.mjs', before, after, '--threshold', '150', '--gate']);
});
