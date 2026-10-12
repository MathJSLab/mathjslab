/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Scalar-axis variance and standard deviation NaN contracts', () => {
    const fixtures = ['nan-dispersion-measurements', 'nan-dispersion-pages', 'nan-dispersion-stability'];
    test.each(fixtures)('runs fixture %s synchronously', (name) => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(readFileSync(join(__dirname, 'fixtures', name + '.m'), 'utf8'));
        expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
    });
    test.each(fixtures)('runs fixture %s in the public runtime', async (name) => {
        const runtime = createInProcessMathJSLabRuntime();
        try {
            const session = await runtime.createSession();
            const result = await session.execute(readFileSync(join(__dirname, 'fixtures', name + '.m'), 'utf8'));
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
        } finally {
            await runtime.dispose();
        }
    });
    for (const name of ['var', 'std'] as const) {
        test.each([
            ['[1,3,5]', '4'],
            ['[1,3,5],0', '4'],
            ['[1,3,5],1', '8/3'],
            ['[1,NaN,5],"omitnan"', '8'],
            ['[1;NaN;5],1,"omitnan"', '4'],
            ['[1,NaN,5]', 'NaN'],
            ['[1,NaN,5],"includenan"', 'NaN'],
            ['[1,NaN,5],0,2,"omitnan"', '8'],
            ['[1,NaN,5],1,2,"omitnan"', '4'],
            ['[1,NaN,NaN;3,5,NaN;NaN,7,NaN],0,1,"omitnan"', '[2,2,NaN]'],
            ['[1,NaN,NaN;3,5,NaN;NaN,7,NaN],1,1,"omitnan"', '[1,1,NaN]'],
            ['[1,NaN,NaN;3,5,NaN;NaN,7,NaN],0,2,"omitnan"', '[0;2;0]'],
            ['[NaN,NaN],"omitnan"', 'NaN'],
            ['NaN,"omitnan"', 'NaN'],
            ['NaN', 'NaN'],
            ['[NaN,7,NaN],0,"omitnan"', '0'],
            ['[NaN,7,NaN],1,"omitnan"', '0'],
            ['[]', 'NaN'],
            ['[],"omitnan"', 'NaN'],
            ['[],0,1,"omitnan"', 'zeros(1,0)'],
            ['[],0,2', 'zeros(0,1)'],
            ['[],0,3', 'zeros(0,0)'],
            ['zeros(0,3)', '[NaN,NaN,NaN]'],
            ['zeros(2,0),0,2', '[NaN;NaN]'],
            ['zeros(0,3),0,2', 'zeros(0,1)'],
            ['zeros(2,0,3),0,1', 'zeros(1,0,3)'],
            ['zeros(2,0,3),0,2,"omitnan"', 'NaN*ones(2,1,3)'],
            ['zeros(1,0,3)', 'NaN*ones(1,1,3)'],
            ['[NaN,7],0,1,"omitnan"', '[NaN,0]'],
            ['[NaN,7],0,4', '[NaN,0]'],
            ['ones(2,3,4),1,5', 'zeros(2,3,4)'],
            ['7', '0'],
            ['true', '0'],
            ['[true,false,true,false],1', '0.25'],
            ['[true,false],0', '0.5'],
            ['[1+i,3+3i]', '4'],
            ['[1+i,complex(2,NaN),3+3i],0,"omitnan"', '4'],
            ['[1+i,complex(NaN,2),3+3i],1,"omitnan"', '2'],
            ['[complex(NaN,2),complex(2,NaN)],0,"omitnan"', 'NaN'],
            ['[2,Inf,NaN],0,"omitnan"', 'NaN'],
            ['[Inf,NaN],0,"omitnan"', 'NaN'],
            ['[Inf,NaN],0,2,"omitnan"', 'NaN'],
            ['[1e16,1e16+2]', '2'],
            ['Inf', 'NaN'],
            ['[Inf,-Inf]', 'NaN'],
            ['complex(2,Inf),0,3', 'NaN'],
            ['[1e16,1e16+2,1e16+4]', '4'],
            ['[1e16,NaN,1e16+2,1e16+4],1,"omitnan"', '8/3'],
            ['[1e308,1e308]', '0'],
            ['[complex(1e16,1e16),complex(1e16+2,1e16+2),complex(1e16+4,1e16+4)]', '8'],
        ])('%s(%s) has variance %s', (args, variance) => {
            const interpreter = Interpreter.Create();
            const expected = name === 'std' ? 'real(sqrt(' + variance + '))' : variance;
            expect(interpreter.Unparse(interpreter.Execute(name + '(' + args + ')'))).toBe(interpreter.Unparse(interpreter.Execute(expected)));
        });
        test.each([
            '',
            '[1,2],2',
            '[1,2],-1',
            '[1,2],0.5',
            '[1,2],Inf',
            '[1,2],NaN',
            '[1,2],i',
            '[1,2],[0,-1]',
            '[1,2],[]',
            '[1,2],0,0',
            '[1,2],0,-1',
            '[1,2],0,1.5',
            '[1,2],0,Inf',
            '[1,2],0,NaN',
            '[1,2],0,i',
            '[1,2],0,[1,1]',
            '[1,2],0,[]',
            '[1,2],"all"',
            '[1,2],0,"all","all"',
            '[1,2],"omitinvalid"',
            '[1,2],"OMITNAN"',
            '[1,2],"omitnan",0',
            '[1,2],0,"omitnan",2',
            '[1,2],0,"omitnan","omitnan"',
            '[],0,1,"unknown"',
            '[1,2],0,1,"omitnan",1',
            '{1,2}',
            '"abc"',
        ])('%s rejects %s', (args) => {
            expect(() => Interpreter.Create().Execute(name + '(' + args + ')')).toThrow();
        });
        test('reports bounded arity, promotes logical values and returns real complex dispersion: ' + name, () => {
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute('nargin("' + name + '"); nargout("' + name + '"); class(' + name + '(true)); isreal(' + name + '([i,3*i]))'))).toBe(
                '-4\n-2\ndouble\ntrue\n',
            );
        });
    }
    test.each(['number', 'decimal'] as const)('preserves stability and complex semantics on %s', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute('var([1e16,1e16+2,1e16+4]); std([1e16,1e16+2,1e16+4]); var([1+i,3+3i]); var([NaN,5],"omitnan")'))).toBe('4\n2\n4\n0\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test('keeps input storage immutable and creates independent results', () => {
        const first = Complex.create(1, 1);
        const missing = Complex.create(NaN, 2);
        const last = Complex.create(3, 3);
        const source = MultiArray.toRowVector([first, missing, last]);
        expect(Complex.realToNumber(CoreFunctions.variance(source, CharString.create('omitnan')) as typeof first)).toBe(4);
        for (const func of [CoreFunctions.variance, CoreFunctions.std]) {
            const result = func(source, Complex.zero(), Complex.create(4), CharString.create('omitnan'));
            if (!MultiArray.isInstanceOf(result)) throw new Error('expected row');
            expect(result.dimension).toEqual([1, 3]);
            expect(result).not.toBe(source);
            expect(result.array[0][0]).not.toBe(first);
            expect(result.array[0][0]).not.toBe(result.array[0][2]);
            const empty = func(new MultiArray([0, 2]));
            if (!MultiArray.isInstanceOf(empty)) throw new Error('expected row');
            expect(empty.array[0][0]).not.toBe(empty.array[0][1]);
            expect(() => func(source, Complex.two())).toThrow();
            expect(() => func(source, CharString.create('omitnan'), Complex.one())).toThrow();
        }
        expect(source.dimension).toEqual([1, 3]);
        expect(source.array[0]).toEqual([first, missing, last]);
        expect(Complex.imagToNumber(first)).toBe(1);
        expect(Complex.imagToNumber(missing)).toBe(2);
        expect(Complex.realIsNaN(missing)).toBe(true);
    });
    test('evaluates resumed arguments once in order and preserves suppression, recovery and session isolation', async () => {
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
                'function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; v=builtin("var",arg([1,NaN,5;2,4,NaN],1),arg(0,2),arg(2,3),arg("omitnan",4)); s=feval("std",[1,NaN,5;2,4,NaN],0,2,"omitnan"); compatible=isequal(v,[8;2]) && isequal(s,sqrt(v)) && isequal(calls,[1,2,3,4]); compatible',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(delays).toEqual([0, 0, 0, 0]);
            expect((await session.execute('var([],0,1,"unknown")')).status).toBe('error');
            expect((await session.execute('std([1,NaN,5],1,"omitnan")')).outputs[0]).toMatchObject({ text: '2\n' });
            expect((await isolated.execute('exist("v","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
