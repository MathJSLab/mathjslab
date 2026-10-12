/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CoreFunctions } from '../../src/CoreFunctions';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Vector weighted var/std along one dimension', () => {
    for (const name of ['var', 'std']) {
        test.each([
            ['[1,3]', '[1,3]', '', '0.75', '2.5'],
            ['[1,3]', '[1;3]', '', '0.75', '2.5'],
            ['[1,3]', '[0,1]', '', '0', '3'],
            ['[1,3]', '[0,0]', '', 'NaN', 'NaN'],
            ['[1,NaN]', '[1,0]', '', 'NaN', 'NaN'],
            ['[1,NaN]', '[1,0]', ',"omitnan"', '0', '1'],
            ['[1,3]', '[NaN,1]', ',"omitmissing"', '0', '3'],
            ['[1,3]', '[NaN,1]', '', 'NaN', 'NaN'],
            ['[NaN,NaN]', '[1,3]', ',"omitnan"', 'NaN', 'NaN'],
            ['[1,NaN]', '[0,1]', ',"omitnan"', 'NaN', 'NaN'],
            ['[1,3]', '[Inf,1]', '', 'NaN', 'NaN'],
            ['[NaN,3]', '[Inf,1]', ',"omitnan"', '0', '3'],
            ['[Inf,3]', '[0,1]', '', 'NaN', 'NaN'],
            ['[Inf,3]', '[1,1]', '', 'NaN', 'Inf'],
            ['[1+i,3+3i]', '[1,3]', '', '1.5', '2.5+2.5i'],
            ['[1+i,complex(NaN,2),3+3i]', '[1,4,3]', ',"omitnan"', '1.5', '2.5+2.5i'],
            ['[true,false]', '[1,3]', '', '0.1875', '0.25'],
            ['[1,3;2,4]', '[1,3]', ',2', '[0.75;0.75]', '[2.5;3.5]'],
            ['[1,3;2,4]', '[1,3]', ',1', '[0.1875,0.1875]', '[1.75,3.75]'],
            ['zeros(2,0,3)', '[1,3]', ',1', 'zeros(1,0,3)', 'zeros(1,0,3)'],
            ['[1,3]', '[1e308,1e308]', '', '1', '2'],
            ['[1,3]', '[1e-300,3e-300]', '', '0.75', '2.5'],
            ['[1e16,1e16+2]', '[1,3]', '', '0.75', '1e16+1.5'],
        ])(`${name} pairs %s and %s with %s`, (input, weights, controls, variance, mean) => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(`A=${input}; W=${weights}; before=A; saved=W; [v,m]=${name}(A,W${controls});`);
            const expected = name === 'std' ? `sqrt(${variance})` : variance;
            interpreter.Execute(`expectedVariance=${expected};`);
            // NaNs, infinities and empty shapes compare without subtracting nonfinite values.
            const check = variance === 'NaN' || variance.startsWith('zeros') ? (variance === 'NaN' ? 'isnan(v)' : 'isequal(v,expectedVariance)') : 'max(abs(v(:)-expectedVariance(:)))<1e-12';
            expect(interpreter.Unparse(interpreter.Execute(check))).toBe('true\n');
            interpreter.Execute(`expectedMean=${mean};`);
            expect(
                interpreter.Unparse(
                    interpreter.Execute(
                        mean === 'NaN' || mean === 'Inf' || mean.startsWith('zeros') ? (mean === 'NaN' ? 'isnan(m)' : 'isequal(m,expectedMean)') : 'max(abs(m(:)-expectedMean(:)))<1e-12',
                    ),
                ),
            ).toBe('true\n');
            expect(interpreter.Unparse(interpreter.Execute('A'))).toBe(interpreter.Unparse(interpreter.Execute('before')));
            expect(interpreter.Unparse(interpreter.Execute('W'))).toBe(interpreter.Unparse(interpreter.Execute('saved')));
            expect(interpreter.Unparse(interpreter.Execute('isequal(size(v),size(m))'))).toBe('true\n');
            interpreter.Execute(`single=${name}(A,W${controls}); [~,onlyMean]=${name}(A,W${controls});`);
            expect(interpreter.Unparse(interpreter.Execute('single'))).toBe(interpreter.Unparse(interpreter.Execute('v')));
            expect(interpreter.Unparse(interpreter.Execute('onlyMean'))).toBe(interpreter.Unparse(interpreter.Execute('m')));
        });
        test.each([
            '[1,2],[-1,1]',
            '[1,2],[1,-1e-300]',
            '[1,2],[1,2,3]',
            '[1,2],[1,i]',
            '[1,2],[1,2;3,4]',
            '[1,2],[true,false]',
            '[1,2],[]',
            '[1,2],2',
            '[1,2],[1,2],"all"',
            '[1,2],[1,2],[1,2]',
            '[1,2],[1,2],5',
            '[],[1,2]',
            '[1,2],[1,2],"omitnan","omitmissing"',
        ])(`${name} rejects %s`, (args) => {
            expect(() => Interpreter.Create().Execute(`${name}(${args})`)).toThrow();
        });
    }
    test('decimal sign and maximum checks retain subnormal-to-number weights', () => {
        const previous = Complex.engine;
        try {
            Complex.engine = 'decimal';
            const input = MultiArray.toRowVector([Complex.one(), Complex.create(3)]);
            const negative = MultiArray.toRowVector([Complex.one(), Complex.create('-1e-999')]);
            expect(() => CoreFunctions.variance(input, negative)).toThrow('nonnegative');
            expect(() => CoreFunctions.std(input, negative)).toThrow('nonnegative');
            const tiny = MultiArray.toRowVector([Complex.zero(), Complex.create('1e-999')]);
            expect(Complex.realToNumber(CoreFunctions.variance(input, tiny) as ReturnType<typeof Complex.create>)).toBe(0);
            const balanced = MultiArray.toRowVector([Complex.create('1e-999'), Complex.create('3e-999')]);
            expect(Complex.realToNumber(CoreFunctions.variance(input, balanced) as ReturnType<typeof Complex.create>)).toBeCloseTo(0.75, 14);
        } finally {
            Complex.engine = previous;
        }
    });
    test('direct API and both backends retain stable finite weights', () => {
        const previous = Complex.engine;
        try {
            for (const engine of ['number', 'decimal'] as const) {
                Complex.engine = engine;
                const input = MultiArray.toRowVector([Complex.one(), Complex.create(3)]);
                const weights = MultiArray.toColumnVector([Complex.create(1e308), Complex.create(1e308)]);
                expect(Complex.realToNumber(CoreFunctions.variance(input, weights) as ReturnType<typeof Complex.create>)).toBe(1);
                expect(Complex.realToNumber(CoreFunctions.std(input, weights) as ReturnType<typeof Complex.create>)).toBe(1);
                const interpreter = Interpreter.Create();
                interpreter.Execute(readFileSync(join(__dirname, 'fixtures', 'weighted-dispersion.m'), 'utf8'));
                expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
            }
        } finally {
            Complex.engine = previous;
        }
    });
    test('public runtime preserves suspended arguments, effects and recovery', async () => {
        const delays: number[] = [];
        const controller = new AbortController();
        let cancel = false;
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') delays.push(effect.milliseconds);
                    if (cancel) controller.abort('stop weighted');
                    return {};
                },
            },
        });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(
                'function y=warg(x), pause(0.001); y=x; end; count=0; [v,m]=feval("var",warg([1,3]+ ++count),warg([1,3]+0* ++count),warg(2),warg("omitmissing")); [v,m,count]',
            );
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toEqual({ type: 'text', text: '[0.75,3.5,2]\n' });
            expect(delays).toEqual([1, 1, 1, 1]);
            expect((await session.execute('[v,m]=builtin("std",[1,3],warg([-1,1]));')).status).toBe('error');
            expect((await session.execute('[v,m]')).outputs[0]).toEqual({ type: 'text', text: '[0.75,3.5]\n' });
            cancel = true;
            expect((await session.execute('[v,m]=var([1,3],warg([1,3]));', { signal: controller.signal })).status).toBe('cancelled');
            cancel = false;
            expect((await session.execute('[v,m]=std([1,3],[1,1]); [v,m]')).outputs[0]).toEqual({ type: 'text', text: '[1,2]\n' });
            const isolated = await runtime.createSession();
            expect((await isolated.execute('exist("m","var")')).outputs[0]).toEqual({ type: 'text', text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    }, 30000);
});
