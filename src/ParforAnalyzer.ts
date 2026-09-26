export type ParforVariableKind = 'loop' | 'broadcast' | 'sliced' | 'reduction' | 'temporary' | 'unsupported';

export type ParforPlan = {
    readonly source: string;
    readonly loopVariable: string;
    readonly values: readonly number[];
    readonly expression: string;
    readonly broadcasts: readonly string[];
    readonly classifications: Readonly<Record<string, ParforVariableKind>>;
    readonly output: { readonly kind: 'sliced'; readonly name: string } | { readonly kind: 'reduction'; readonly name: string; readonly operator: '+=' | '*=' };
};

export type ParforAnalysis = { readonly eligible: true; readonly plan: ParforPlan } | { readonly eligible: false; readonly reason: string };

const pureFunctions = new Set(['abs', 'acos', 'asin', 'atan', 'ceil', 'cos', 'exp', 'fix', 'floor', 'log', 'max', 'min', 'mod', 'power', 'round', 'sign', 'sin', 'sqrt', 'tan']);
const forbiddenEffects = /\b(?:load|pause|plot|plot3|surf|eval|evalin|assignin|global|persistent|clear|spmd|parfor)\b/i;

const identifiers = (expression: string): string[] => {
    const result = new Set<string>();
    const matcher = /\b([A-Za-z]\w*)\b/g;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(expression))) {
        const name = match[1]!;
        const tail = expression.slice(matcher.lastIndex);
        if (/^\s*\(/.test(tail) && pureFunctions.has(name.toLowerCase())) continue;
        if (!['true', 'false', 'inf', 'nan', 'i', 'j'].includes(name.toLowerCase())) result.add(name);
    }
    return [...result];
};

/** Conservative analyzer for the first deterministic parallel subset. */
export class ParforAnalyzer {
    public static analyze(source: string): ParforAnalysis {
        if (forbiddenEffects.test(source.replace(/^\s*parfor/i, ''))) return { eligible: false, reason: 'parfor contains an external effect or nested parallel construct.' };
        const header = /^\s*parfor\s+([A-Za-z]\w*)\s*=\s*(-?\d+)\s*:\s*(-?\d+)\s*[,;\n]\s*([\s\S]*?)\s*(?:end|endparfor)\s*;?\s*(?:([A-Za-z]\w*))?\s*$/i.exec(source);
        if (!header) return { eligible: false, reason: 'parfor header is outside the consecutive-integer subset.' };
        const loopVariable = header[1]!;
        const start = Number(header[2]);
        const stop = Number(header[3]);
        const body = header[4]!.trim().replace(/;$/, '').trim();
        if (/[;\n\r]/.test(body)) return { eligible: false, reason: 'parfor body must contain exactly one supported assignment.' };
        const sliced = new RegExp(`^([A-Za-z]\\w*)\\s*\\(\\s*${loopVariable}\\s*\\)\\s*=\\s*([\\s\\S]+)$`, 'i').exec(body);
        const reduction = /^([A-Za-z]\w*)\s*(\+=|\*=)\s*([\s\S]+)$/i.exec(body);
        if (!sliced && !reduction) return { eligible: false, reason: 'parfor body must be one sliced assignment or one supported associative reduction.' };
        const output = sliced ? ({ kind: 'sliced', name: sliced[1]! } as const) : ({ kind: 'reduction', name: reduction![1]!, operator: reduction![2]! as '+=' | '*=' } as const);
        const expression = (sliced?.[2] ?? reduction?.[3])!.trim();
        const references = identifiers(expression);
        if (references.includes(output.name)) return { eligible: false, reason: `parfor output '${output.name}' is read by an iteration.` };
        const broadcasts = references.filter((name) => name !== loopVariable);
        const classifications: Record<string, ParforVariableKind> = { [loopVariable]: 'loop', [output.name]: output.kind };
        broadcasts.forEach((name) => (classifications[name] = 'broadcast'));
        const step = start <= stop ? 1 : -1;
        const values = Array.from({ length: Math.abs(stop - start) + 1 }, (_, index) => start + index * step);
        return { eligible: true, plan: { source, loopVariable, values, expression, broadcasts, classifications, output } };
    }
}
