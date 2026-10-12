import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, mkdtemp } from 'node:fs/promises';
import path from 'node:path';

await mkdir('test-results', { recursive: true });
const directory = await mkdtemp(path.resolve('test-results/release-'));
const consumer = path.join(directory, 'consumer');
const cache = path.resolve(process.env.MATHJSLAB_RELEASE_NPM_CACHE ?? path.join(directory, 'npm-cache'));
await mkdir(consumer);
await writeFile(path.join(consumer, 'package.json'), JSON.stringify({ name: 'release-consumer', private: true, type: 'module' }));
// Invoke npm's JavaScript entry point to avoid shell quoting and Windows .cmd handling.
const npm = process.env.npm_execpath;
if (!npm) throw Error('Run through npm run test:release');
const output = execFileSync(process.execPath, [npm, 'pack', '--ignore-scripts', '--json', '--pack-destination', directory, '--cache', cache], { encoding: 'utf8' });
const packed = JSON.parse(output);
const artifact = Array.isArray(packed) ? packed[0] : Object.values(packed)[0];
if (!artifact.files.some((file) => file.path === 'LICENSE')) throw Error('Package license missing');
if (artifact.files.some((file) => /^(src|test|node_modules)\//.test(file.path))) throw Error('Development files leaked into package');
execFileSync(
    process.execPath,
    [
        npm,
        'install',
        path.join(directory, artifact.filename),
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        '--cache',
        cache,
        ...(process.env.MATHJSLAB_RELEASE_OFFLINE === '1' ? ['--offline'] : []),
    ],
    {
        cwd: consumer,
        stdio: 'inherit',
    },
);
execFileSync(process.execPath, ['script/validate-installed-package.mjs', consumer], { stdio: 'inherit' });
console.log(`Release validation artifacts: ${directory}`);
