import { readFile } from 'node:fs/promises';
import { compareReports } from './statistics.mjs';

const args = process.argv.slice(2);
const gate = args.includes('--gate');
const thresholdIndex = args.indexOf('--threshold');
const threshold = thresholdIndex >= 0 ? Number(args[thresholdIndex + 1]) : 20;
const paths = args.filter((argument, index) => argument !== '--gate' && (thresholdIndex < 0 || (index !== thresholdIndex && index !== thresholdIndex + 1)));
try {
    if (paths.length !== 2 || paths.some((value) => value.startsWith('--'))) throw Error('Usage: npm run bench:compare -- BASELINE.json CANDIDATE.json [--threshold PERCENT] [--gate]');
    const [baseline, candidate] = await Promise.all(paths.map(async (filename) => JSON.parse(await readFile(filename, 'utf8'))));
    const result = compareReports(baseline, candidate, threshold);
    console.log(JSON.stringify(result, null, 2));
    if (!result.comparable || result.rows.some((row) => row.status === 'failed-or-missing')) process.exitCode = 2;
    else if (gate && result.rows.some((row) => ['noisy', 'insufficient-samples', 'smoke-profile'].includes(row.status))) process.exitCode = 2;
    else if (gate && result.regressions) process.exitCode = 1;
} catch (error) {
    console.error(error.message);
    process.exitCode = 2;
}
