/**
 * Builds every configured bundle in an isolated Node.js process.
 *
 * Webpack's multi-compiler keeps all compilations alive concurrently. That is
 * unnecessarily memory-intensive for a production matrix, particularly on
 * constrained CI executors. Running one named configuration at a time also
 * releases loader and minifier state before the next bundle starts.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type BuildMode = 'production' | 'development';
type BuildConfiguration = Record<BuildMode, { bundle: string[] }>;

const helperDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(helperDirectory, '..', '..');
const tsxCli = path.join(projectDirectory, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const webpackCli = path.join(projectDirectory, 'node_modules', 'webpack', 'bin', 'webpack.js');
const mode = process.argv[2] ?? 'production';

if (mode !== 'production' && mode !== 'development') {
    throw new Error(`Invalid build mode: '${mode}'.`);
}

const buildConfig = JSON.parse(fs.readFileSync(path.join(projectDirectory, 'build.config.json'), 'utf8')) as BuildConfiguration;
const bundles = buildConfig[mode].bundle;
console.log(`Building ${bundles.length} ${mode} bundles sequentially in isolated processes.`);

for (const [index, bundle] of bundles.entries()) {
    console.log(`\n[${index + 1}/${bundles.length}] Building ${bundle} ...`);
    const result = spawnSync(process.execPath, [tsxCli, '--require', 'tsconfig-paths/register', webpackCli, '--mode', mode, '--env', `MATHJSLAB_BUNDLE=${bundle}`], {
        cwd: projectDirectory,
        env: process.env,
        stdio: 'inherit',
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`Webpack failed for '${bundle}'${result.signal ? ` with signal ${result.signal}` : ` with exit code ${result.status}`}.`);
    }
}

console.log(`Built all ${mode} bundles successfully.`);
