import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, mkdtempSync, openSync, writeFileSync, fsyncSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.env.npm_execpath;
if (!npm) throw Error('Run through npm run test:candidate.');
if (process.argv.length > 2) throw Error('test:candidate runs the complete local gate without skip flags.');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sources = () =>
    Object.fromEntries(
        execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' })
            .split('\0')
            .filter(Boolean)
            .sort()
            .map((filename) => [filename, hash(readFileSync(path.join(root, filename)))]),
    );
const before = sources();
mkdirSync(path.join(root, 'test-results'), { recursive: true });
const directory = mkdtempSync(path.join(root, 'test-results/candidate-'));
const report = { startedAt: new Date().toISOString(), status: 'running', node: process.version, sourceFingerprint: hash(JSON.stringify(before)), steps: [] };
let checkpoint = 0;
const save = (filename) => {
    const descriptor = openSync(path.join(directory, filename), 'wx');
    try {
        writeFileSync(descriptor, JSON.stringify(report, null, 2) + '\n');
        fsyncSync(descriptor);
    } finally {
        closeSync(descriptor);
    }
};
const steps = [
    ['types', ['run', 'check:types']],
    ['types-es2015', ['exec', '--offline', '--', 'tsc', '--project', 'tsconfig.esm.es2015.json', '--noEmit']],
    ['api-reference', ['run', 'docs:check']],
    ['cycles', ['run', 'test:circ']],
    ['unit', ['run', 'test:unit']],
    ['integration', ['run', 'test:integration']],
    ['declarations', ['run', 'build:types']],
    ['bundles', ['run', 'build:prod']],
    ['bundle-tests', ['run', 'test:bundle']],
    ['benchmark-harness', ['run', 'test:bench']],
    ['benchmark-smoke', ['run', 'bench:smoke']],
    ['installed-consumers', ['run', 'test:consumers']],
];
console.log(`Candidate verification logs: ${directory}`);
try {
    for (const [name, args] of steps) {
        const step = { name, status: 'running', startedAt: new Date().toISOString(), log: `${name}.log` };
        report.steps.push(step);
        save(`progress-${String(++checkpoint).padStart(2, '0')}.json`);
        console.log(`Checking ${name}...`);
        const descriptor = openSync(path.join(directory, step.log), 'wx');
        let result;
        try {
            result = spawnSync(process.execPath, [npm, ...args], { cwd: root, stdio: ['ignore', descriptor, descriptor], env: process.env, windowsHide: true });
            fsyncSync(descriptor);
        } finally {
            closeSync(descriptor);
        }
        step.finishedAt = new Date().toISOString();
        step.exitCode = result.status;
        step.status = result.status === 0 && !result.error ? 'passed' : 'failed';
        save(`progress-${String(++checkpoint).padStart(2, '0')}.json`);
        if (step.status !== 'passed') throw Error(`${name} failed; inspect ${path.join(directory, step.log)}`);
        console.log(`${name}: passed`);
    }
    report.status = 'passed';
} catch (error) {
    report.status = 'failed';
    report.error = error.message;
    process.exitCode = 1;
} finally {
    const after = sources();
    report.sourceChanges = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((filename) => before[filename] !== after[filename]);
    if (report.sourceChanges.length) {
        report.status = 'failed';
        report.error = 'Validation modified source/document/configuration files.';
        process.exitCode = 1;
    }
    report.finishedAt = new Date().toISOString();
    save('report.json');
    console.log(`Candidate ${report.status}: ${path.join(directory, 'report.json')}`);
    if (report.error) console.error(report.error);
}
