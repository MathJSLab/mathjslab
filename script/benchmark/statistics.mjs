/** Deterministic descriptive statistics; nearest-rank quantiles, milliseconds. */
export function summarize(samples) {
    if (!samples.length || samples.some((value) => !Number.isFinite(value) || value <= 0)) throw Error('Expected positive finite timing samples.');
    const sorted = [...samples].sort((a, b) => a - b);
    const medianOf = (values) => (values.length % 2 ? values[(values.length - 1) / 2] : (values[values.length / 2 - 1] + values[values.length / 2]) / 2);
    const median = medianOf(sorted);
    const deviations = sorted.map((value) => Math.abs(value - median)).sort((a, b) => a - b);
    return { count: sorted.length, min: sorted[0], median, p95: sorted[Math.ceil(sorted.length * 0.95) - 1], max: sorted.at(-1), mad: medianOf(deviations) };
}

export function compareReports(baseline, candidate, threshold = 20) {
    if (!Number.isFinite(threshold) || threshold < 0) throw Error('Invalid regression threshold.');
    if (baseline.schemaVersion !== 1 || candidate.schemaVersion !== 1) throw Error('Unsupported benchmark report schema.');
    for (const report of [baseline, candidate]) {
        if (!report.environment || !report.configuration || !Array.isArray(report.results) || !report.results.length) throw Error('Incomplete benchmark report.');
        const configuration = report.configuration;
        if (
            !['standard', 'smoke'].includes(configuration.profile) ||
            !Number.isInteger(configuration.warmups) ||
            configuration.warmups < 0 ||
            !Number.isInteger(configuration.samples) ||
            configuration.samples < 1 ||
            typeof configuration.gc !== 'boolean' ||
            typeof configuration.suiteHash !== 'string' ||
            !configuration.suiteHash ||
            !Number.isInteger(configuration.timeoutMs) ||
            configuration.timeoutMs < 100
        )
            throw Error('Incomplete benchmark configuration.');
        for (const key of ['node', 'v8', 'platform', 'release', 'arch', 'cpuModel'])
            if (typeof report.environment[key] !== 'string' || !report.environment[key]) throw Error(`Missing environment.${key}.`);
        if (
            !Array.isArray(report.environment.execArgv) ||
            report.environment.execArgv.some((value) => typeof value !== 'string') ||
            !Number.isInteger(report.environment.cpuCount) ||
            report.environment.cpuCount < 1 ||
            !Number.isFinite(report.environment.totalMemory) ||
            report.environment.totalMemory <= 0
        )
            throw Error('Incomplete hardware/flag metadata.');
        const keys = new Set();
        for (const result of report.results) {
            const key = `${result.engine}/${result.id}`;
            if (!['number', 'decimal'].includes(result.engine) || typeof result.id !== 'string' || keys.has(key)) throw Error('Invalid or duplicate benchmark result.');
            keys.add(key);
            if (result.status === 'passed') {
                if (!result.settings || result.settings.engine !== result.engine || result.samplesMs?.length !== report.configuration.samples)
                    throw Error('Incomplete case settings or samples.');
                summarize(result.samplesMs);
            } else if (result.status !== 'failed') throw Error('Invalid benchmark result status.');
        }
    }
    const mismatches = [];
    for (const key of ['node', 'v8', 'platform', 'release', 'arch', 'cpuModel', 'cpuCount', 'totalMemory', 'execArgv']) {
        if (JSON.stringify(baseline.environment[key]) !== JSON.stringify(candidate.environment[key])) mismatches.push(`environment.${key}`);
    }
    for (const key of ['profile', 'warmups', 'samples', 'suiteHash', 'gc', 'timeoutMs']) {
        if (JSON.stringify(baseline.configuration[key]) !== JSON.stringify(candidate.configuration[key])) mismatches.push(`configuration.${key}`);
    }
    const keyOf = (result) => `${result.engine}/${result.id}`;
    const old = new Map(baseline.results.map((result) => [keyOf(result), result]));
    if (JSON.stringify([...old.keys()].sort()) !== JSON.stringify(candidate.results.map(keyOf).sort())) mismatches.push('case selection');
    const rows = candidate.results.map((result) => {
        const previous = old.get(keyOf(result));
        if (!previous || previous.status !== 'passed' || result.status !== 'passed') return { key: keyOf(result), status: 'failed-or-missing' };
        if (JSON.stringify(previous.settings) !== JSON.stringify(result.settings)) mismatches.push(`${keyOf(result)}.settings`);
        const before = summarize(previous.samplesMs);
        const after = summarize(result.samplesMs);
        const changePercent = (after.median / before.median - 1) * 100;
        const noisy = before.mad / before.median > 0.1 || after.mad / after.median > 0.1;
        const enough = before.count >= 5 && after.count >= 5;
        return {
            key: keyOf(result),
            baselineMedianMs: before.median,
            candidateMedianMs: after.median,
            changePercent,
            status: !enough
                ? 'insufficient-samples'
                : candidate.configuration.profile !== 'standard'
                  ? 'smoke-profile'
                  : noisy
                    ? 'noisy'
                    : changePercent > threshold
                      ? 'regression'
                      : 'within-threshold',
        };
    });
    const comparable = mismatches.length === 0;
    return { comparable, mismatches, thresholdPercent: threshold, rows, regressions: comparable ? rows.filter((row) => row.status === 'regression').length : 0 };
}
