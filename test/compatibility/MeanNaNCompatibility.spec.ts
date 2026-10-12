/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Scalar-axis mean NaN compatibility contracts', () => {
    const fixtures = ['nan-mean-measurements', 'nan-mean-pages', 'nan-mean-empty-complex'];
    test.each(fixtures)('executes fixture %s synchronously', (name) => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(readFileSync(join(__dirname, 'fixtures', `${name}.m`), 'utf8'));
        expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
    });
    test.each(fixtures)('executes fixture %s in the public runtime', async (name) => {
        const runtime = createInProcessMathJSLabRuntime();
        try {
            const session = await runtime.createSession();
            const result = await session.execute(readFileSync(join(__dirname, 'fixtures', `${name}.m`), 'utf8'));
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
        } finally {
            await runtime.dispose();
        }
    });
    test.each([
        ['mean([2,NaN,4],"omitnan")', '3'],
        ['mean([2;NaN;4],"omitnan")', '3'],
        ['mean([2,NaN,4])', 'NaN'],
        ['mean([2,NaN,4],"includenan")', 'NaN'],
        ['mean([1,NaN,7;3,5,NaN],"omitnan")', '[2,5,7]'],
        ['mean([1,NaN,7;3,5,NaN],2,"omitnan")', '[4;4]'],
        ['mean([NaN,2,NaN;NaN,4,6],1,"omitnan")', '[NaN,3,6]'],
        ['mean([NaN,2,NaN;NaN,4,6],2,"omitnan")', '[2;5]'],
        ['mean([NaN,NaN],"omitnan")', 'NaN'],
        ['mean(NaN,"omitnan")', 'NaN'],
        ['mean(NaN,"includenan")', 'NaN'],
        ['mean([], "omitnan")', 'NaN'],
        ['mean([], "includenan")', 'NaN'],
        ['size(mean([],1,"omitnan"))', '[1,0]'],
        ['size(mean([],2,"includenan"))', '[0,1]'],
        ['size(mean([],3,"omitnan"))', '[0,0]'],
        ['mean(zeros(0,3),"omitnan")', '[NaN,NaN,NaN]'],
        ['mean(zeros(2,0),2)', '[NaN;NaN]'],
        ['size(mean(zeros(0,3),2,"omitnan"))', '[0,1]'],
        ['size(mean(zeros(2,0,3),1,"omitnan"))', '[1,0,3]'],
        ['reshape(mean(zeros(2,0,3),2,"omitnan"),1,6)', '[NaN,NaN,NaN,NaN,NaN,NaN]'],
        ['size(mean(zeros(1,0,3),"omitnan"))', '[1,1,3]'],
        ['reshape(mean(zeros(1,0,3),"omitnan"),1,3)', '[NaN,NaN,NaN]'],
        ['mean([NaN,2],3,"omitnan")', '[NaN,2]'],
        ['mean([NaN,2],1,"omitnan")', '[NaN,2]'],
        ['mean([1,2;3,4],4)', '[1,2;3,4]'],
        ['size(mean(ones(2,3,4),4,"omitnan"))', '[2,3,4]'],
        ['mean(true,"omitnan")', '1'],
        ['mean(false,3)', '0'],
        ['class(mean(true,3,"omitnan"))', 'double'],
        ['mean([true,false,true,false],"omitnan")', '0.5'],
        ['mean([1+i,complex(2,NaN),3+3i],"omitnan")', '2+2i'],
        ['mean([1+i,complex(NaN,2),3+3i],"omitnan")', '2+2i'],
        ['mean([complex(NaN,2),complex(2,NaN)],"omitnan")', 'NaN'],
        ['isnan(mean(complex(2,NaN),3,"omitnan"))', 'true'],
        ['imag(mean(complex(Inf,2),3,"includenan"))', '2'],
        ['real(mean(complex(2,Inf),1,"omitnan"))', '2'],
        ['isnan(mean([Inf,-Inf,NaN],"omitnan"))', 'true'],
        ['isinf(mean([2,Inf,NaN],"omitnan"))', 'true'],
        ['reshape(mean(reshape([NaN,2,3,NaN,5,NaN,7,8],[2,2,2]),3,"omitnan"),1,4)', '[5,2,5,8]'],
        ['feval("mean",[2,NaN,4],"omitnan")', '3'],
        ['builtin("mean",[2,NaN,4],2,"omitnan")', '3'],
        ['nargin("mean");nargout("mean")', '-3\n1'],
    ])('defines %s', (source, expected) => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute(source)).replace(/;\n/g, ';')).toBe(`${expected}\n`);
    });
    test.each([
        'mean()',
        'mean([1,2],1,"omitnan",1)',
        'mean({1,2})',
        'mean("abc")',
        'mean([1,2],0)',
        'mean([1,2],-1)',
        'mean([1,2],0.5)',
        'mean([1,2],Inf)',
        'mean([1,2],NaN)',
        'mean([1,2],1+i)',
        'mean([1,2],[])',
        'mean([1,2],[1,1],"omitnan")',
        'mean([1,2],"all","all")',
        'mean([1,2],"omitnan",2)',
        'mean([1,2],"omitnan","includenan")',
        'mean([1,2],"native")',
        'mean([1,2],"omitinvalid")',
        'mean([1,2],"OMITNAN")',
        'mean([],1,"unknown")',
        'mean([],"omitnan",1)',
        'mean([1,2],"Weights",[1,1])',
    ])('rejects invalid/unsupported call %s', (source) => expect(() => Interpreter.Create().Execute(source)).toThrow());
    test.each(['number', 'decimal'] as const)('counts valid complex values with %s arithmetic', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute('mean([1+i,complex(2,NaN),3+3i],"omitnan")'))).toBe('2+2i\n');
            expect(interpreter.Unparse(interpreter.Execute('mean([NaN,NaN],"omitnan")'))).toBe('NaN\n');
            expect(interpreter.Unparse(interpreter.Execute('isnan(mean([Inf,-Inf,NaN],"omitnan"))'))).toBe('true\n');
            expect(interpreter.Unparse(interpreter.Execute('mean([1,NaN,7;3,5,NaN],"omitnan")'))).toBe('[2,5,7]\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test('does not mutate or alias inputs, singleton results or empty-line NaNs', () => {
        const original = Complex.create(2);
        const missing = Complex.create(NaN);
        const input = MultiArray.toRowVector([original, missing]);
        const result = CoreFunctions.mean(input, Complex.create(3), CharString.create('omitnan'));
        if (!MultiArray.isInstanceOf(result)) throw new Error('expected row');
        expect(result).not.toBe(input);
        expect(result.array[0][0]).not.toBe(original);
        expect(input.dimension).toEqual([1, 2]);
        expect(input.array[0][0]).toBe(original);
        expect(input.array[0][1]).toBe(missing);
        expect(Complex.realToNumber(original)).toBe(2);
        expect(Complex.realIsNaN(missing)).toBe(true);
        const empty = CoreFunctions.mean(new MultiArray([0, 2]));
        if (!MultiArray.isInstanceOf(empty)) throw new Error('expected NaN row');
        expect(empty.array[0][0]).not.toBe(empty.array[0][1]);
        expect(Complex.realIsNaN(empty.array[0][0] as typeof original)).toBe(true);
        expect(() => CoreFunctions.mean(input, CharString.create('omitnan'), Complex.one())).toThrow('expected DIM');
        expect(() => CoreFunctions.mean(input, MultiArray.toRowVector([Complex.one(), Complex.one()]))).toThrow('repeated dimensions');
    });
    test('preserves singleton infinities on both backends', () => {
        const previous = Complex.engine;
        try {
            for (const engine of ['number', 'decimal'] as const) {
                Complex.engine = engine;
                const result = CoreFunctions.mean(Complex.create(Infinity, 2), Complex.create(3));
                if (!Complex.isInstanceOf(result)) throw new Error('expected scalar');
                expect(Complex.imagToNumber(result)).toBe(2);
                expect(Complex.realToNumber(result)).toBe(Infinity);
            }
        } finally {
            Complex.engine = previous;
        }
    });
    test('retains resumed arguments, output suppression, recovery and session isolation', async () => {
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
            const isolated = await runtime.createSession();
            const result = await session.execute(
                'function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; averages=builtin("mean",arg([1,NaN,4;2,3,NaN],1),arg(2,2),arg("omitnan",3)); compatible=isequal(averages,[2.5;2.5]) && isequal(calls,[1,2,3]); compatible',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(delays).toEqual([0, 0, 0]);
            expect((await session.execute('mean([],"omitnan",1)')).status).toBe('error');
            expect((await session.execute('mean([2,NaN,4],"omitnan")')).outputs[0]).toMatchObject({ text: '3\n' });
            expect((await isolated.execute('exist("averages","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
