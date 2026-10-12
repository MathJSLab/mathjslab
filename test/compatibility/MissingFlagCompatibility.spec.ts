/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CoreFunctions } from '../../src/CoreFunctions';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

const names = ['sum', 'prod', 'mean', 'var', 'std', 'cumsum', 'cumprod'] as const;
describe('Numeric missing flag aliases', () => {
    test('fixture preserves both numeric backends', () => {
        const previous = Complex.engine;
        try {
            for (const engine of ['number', 'decimal'] as const) {
                Complex.engine = engine;
                const interpreter = Interpreter.Create();
                interpreter.Execute(readFileSync(join(__dirname, 'fixtures', 'numeric-missing-aliases.m'), 'utf8'));
                expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
            }
        } finally {
            Complex.engine = previous;
        }
    });
    for (const name of names) {
        const selections =
            name === 'cumsum' || name === 'cumprod'
                ? ['', ',2', ',2,"reverse"']
                : name === 'var' || name === 'std'
                  ? ['', ',0', ',1,2', ',0,[1,2]', ',1,"all"']
                  : ['', ',2', ',[1,2]', ',"all"'];
        test.each(selections)(`${name} aliases with selection %s`, (selection) => {
            const interpreter = Interpreter.Create();
            for (const input of ['[1,NaN,3;NaN,5,7]', '[NaN,NaN]', '[]', '[true,false]', '[1+i,complex(NaN,2),3-i]']) {
                for (const [alias, original] of [
                    ['omitmissing', 'omitnan'],
                    ['includemissing', 'includenan'],
                ]) {
                    const source = `${name}(${input}${selection},"${alias}")`;
                    expect(interpreter.Unparse(interpreter.Execute(source))).toBe(interpreter.Unparse(interpreter.Execute(source.replace(alias, original))));
                }
            }
        });
        test(`${name} direct API and input immutability`, () => {
            const interpreter = Interpreter.Create();
            const input = MultiArray.toRowVector([Complex.one(), Complex.NaN_0(), Complex.create(3)]);
            const before = interpreter.Unparse(input);
            const alias = CoreFunctions[name === 'var' ? 'variance' : name](input as Parameters<typeof CoreFunctions.mean>[0], new CharString('omitmissing'));
            const original = CoreFunctions[name === 'var' ? 'variance' : name](input as Parameters<typeof CoreFunctions.mean>[0], new CharString('omitnan'));
            expect(interpreter.Unparse(alias)).toBe(interpreter.Unparse(original));
            expect(interpreter.Unparse(input)).toBe(before);
        });
        test.each(['"omitmissing","omitnan"', '"includenan","includemissing"', '"OMITMISSING"', '"omitnat"'])(`${name} rejects invalid flags %s`, (options) => {
            expect(() => Interpreter.Create().Execute(`${name}([1,NaN],${options})`)).toThrow();
        });
    }
    test('fixture through synchronous and public resumable runtime', async () => {
        const source = readFileSync(join(__dirname, 'fixtures', 'numeric-missing-aliases.m'), 'utf8');
        const interpreter = Interpreter.Create();
        interpreter.Execute(source);
        expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
        const delays: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') delays.push(effect.milliseconds);
                    return {};
                },
            },
        });
        try {
            const session = await runtime.createSession();
            expect((await session.execute(source)).status).toBe('success');
            const result = await session.execute(
                'function y=missingarg(x), pause(0.001); y=x; end; effects=0; answer=mean([1,NaN,3],missingarg("all"),missingarg("omitmissing")); effects++; [answer,effects]',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([{ type: 'text', text: '[2,1]\n' }]);
            expect(delays).toEqual([1, 1]);
            expect((await session.execute('mean([1,2],"omitmissing","omitnan");')).status).toBe('error');
            expect((await session.execute('answer')).outputs[0]).toEqual({ type: 'text', text: '2\n' });
            const isolated = await runtime.createSession();
            expect((await isolated.execute('exist("answer","var")')).outputs[0]).toEqual({ type: 'text', text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
