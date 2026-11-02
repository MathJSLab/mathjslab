import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, open, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cases, profiles } from './workloads.mjs';

const execute = promisify(execFile);
const directory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(directory, '../..');
const hash = (value) => createHash('sha256').update(value).digest('hex');

function optionsOf(args) {
    const options = { profile: 'standard', engines: ['number', 'decimal'], warmups: 3, samples: 11, gc: false, packageRoot: repository, timeoutMs: 120000 };
    let explicitWarmups = false;
    let explicitSamples = false;
    for (let i = 0; i < args.length; i++) {
        const flag = args[i];
        if (flag === '--gc') {
            options.gc = true;
            continue;
        }
        if (flag === '--help') return { help: true };
        if (!['--profile', '--engines', '--warmups', '--samples', '--package', '--out', '--case', '--timeout-ms'].includes(flag)) throw Error(`Unknown option: ${flag}`);
        const value = args[++i];
        if (!value || value.startsWith('--')) throw Error(`Missing value for ${flag}`);
        switch (flag) {
            case '--profile':
                options.profile = value;
                break;
            case '--engines':
                options.engines = value.split(',');
                break;
            case '--warmups':
                options.warmups = Number(value);
                explicitWarmups = true;
                break;
            case '--samples':
                options.samples = Number(value);
                explicitSamples = true;
                break;
            case '--package':
                options.packageRoot = path.resolve(value);
                break;
            case '--out':
                options.out = path.resolve(value);
                break;
            case '--case':
                (options.selection ??= []).push(...value.split(','));
                break;
            case '--timeout-ms':
                options.timeoutMs = Number(value);
                break;
        }
    }
    if (!Object.hasOwn(profiles, options.profile)) throw Error('Profile must be smoke or standard.');
    if (options.profile === 'smoke') {
        if (!explicitWarmups) options.warmups = 1;
        if (!explicitSamples) options.samples = 2;
    }
    if (options.engines.length === 0 || new Set(options.engines).size !== options.engines.length || options.engines.some((engine) => !['number', 'decimal'].includes(engine)))
        throw Error('Engines must be unique number/decimal names.');
    for (const [key, min, max] of [
        ['warmups', 0, 100],
        ['samples', 1, 1000],
        ['timeoutMs', 100, 3600000],
    ]) {
        if (!Number.isSafeInteger(options[key]) || options[key] < min || options[key] > max) throw Error(`Invalid ${key}.`);
    }
    if (options.selection?.some((id) => !cases.some((item) => item.id === id))) throw Error('Unknown benchmark case. Use --help for the case list.');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    options.out ??= path.join(repository, 'test-results/benchmarks', `run-${timestamp}.json`);
    return options;
}

async function main() {
    if (Number(process.versions.node.split('.')[0]) < 20) throw Error('Benchmark development tools require Node.js 20 or newer.');
    const options = optionsOf(process.argv.slice(2));
    if (options.help) {
        console.log(
            'Benchmark distributed MathJSLab: --profile smoke|standard --engines number,decimal --warmups N --samples N --case ID[,ID] --package ROOT --out FILE --gc --timeout-ms N\nCases:\n' +
                cases.map((item) => `  ${item.id}${item.engines ? ` (${item.engines.join(',')})` : ''}`).join('\n'),
        );
        return;
    }
    try {
        await access(options.out);
        throw Error(`Refusing to overwrite report: ${options.out}`);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    const packageInfo = JSON.parse(await readFile(path.join(options.packageRoot, 'package.json'), 'utf8'));
    if (packageInfo.name !== 'mathjslab') throw Error('--package must identify a mathjslab package root.');
    const bundleFiles = ['lib/mathjslab.node.esm2022.js', 'lib/mathjslab.runtime-node.esm2022.js', 'lib/mathjslab.runtime-node-worker.esm2022.js'];
    const artifacts = {};
    for (const filename of bundleFiles) {
        let bytes;
        try {
            bytes = await readFile(path.join(options.packageRoot, filename));
        } catch {
            throw Error(`Missing distribution ${filename}; run npm run build:prod first.`);
        }
        artifacts[filename] = { sha256: hash(bytes), bytes: bytes.length };
    }
    const suiteFiles = ['run.mjs', 'workloads.mjs', 'case-runner.mjs', 'statistics.mjs', 'worker-bootstrap.mjs', 'worker-endpoint.mjs'];
    const suiteArtifacts = Object.fromEntries(await Promise.all(suiteFiles.map(async (filename) => [filename, hash(await readFile(path.join(directory, filename)))])));
    const suiteHash = hash(JSON.stringify(suiteArtifacts));
    const cpus = os.cpus();
    const report = {
        schemaVersion: 1,
        startedAt: new Date().toISOString(),
        environment: {
            node: process.version,
            v8: process.versions.v8,
            platform: process.platform,
            release: os.release(),
            arch: process.arch,
            cpuModel: cpus[0]?.model ?? 'unknown',
            cpuCount: cpus.length,
            totalMemory: os.totalmem(),
            execArgv: process.execArgv,
        },
        configuration: { profile: options.profile, warmups: options.warmups, samples: options.samples, gc: options.gc, suiteHash, timeoutMs: options.timeoutMs },
        distribution: { root: options.packageRoot, name: packageInfo.name, version: packageInfo.version, artifacts },
        suiteArtifacts,
        results: [],
    };
    console.log(`Benchmark ${options.profile}; ${options.engines.join(', ')}; ${options.samples} samples after ${options.warmups} warmups. No timing gates.`);
    for (const engine of options.engines) {
        for (const item of cases) {
            if (options.selection && !options.selection.includes(item.id)) continue;
            if (item.engines && !item.engines.includes(engine)) continue;
            const argumentsForCase = { id: item.id, engine, profile: options.profile, packageRoot: options.packageRoot, warmups: options.warmups, samples: options.samples, gc: options.gc };
            try {
                const { stdout } = await execute(process.execPath, [...(options.gc ? ['--expose-gc'] : []), path.join(directory, 'case-runner.mjs'), JSON.stringify(argumentsForCase)], {
                    timeout: options.timeoutMs,
                    maxBuffer: 8 * 1024 * 1024,
                    windowsHide: true,
                });
                const result = JSON.parse(stdout);
                report.results.push({ ...result, category: item.category });
                console.log(`${engine}/${item.id}: median ${result.timingMs.median.toFixed(3)} ms; MAD ${result.timingMs.mad.toFixed(3)} ms`);
            } catch (error) {
                const detail = String(error.stderr || error.message);
                report.results.push({
                    status: 'failed',
                    id: item.id,
                    engine,
                    category: item.category,
                    error: detail.slice(-16000),
                    errorTruncated: detail.length > 16000,
                    killed: Boolean(error.killed),
                });
                console.error(`${engine}/${item.id}: FAILED`);
            }
        }
    }
    if (!report.results.length) throw Error('Selection has no cases for the requested engines.');
    report.finishedAt = new Date().toISOString();
    report.status = report.results.every((result) => result.status === 'passed') ? 'passed' : 'failed';
    await mkdir(path.dirname(options.out), { recursive: true });
    const handle = await open(options.out, 'wx');
    try {
        await handle.writeFile(JSON.stringify(report, null, 2) + '\n');
        await handle.sync();
    } finally {
        await handle.close();
    }
    console.log(`Report: ${options.out}`);
    if (report.status !== 'passed') process.exitCode = 1;
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
