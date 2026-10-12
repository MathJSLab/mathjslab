/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Grouped mean/var/std compatibility', () => {
    const fixtures = ['statistics-pages', 'statistics-cross-pages', 'statistics-global-missing'];
    test.each(fixtures)('runs %s synchronously', (name) => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(readFileSync(join(__dirname, 'fixtures', name + '.m'), 'utf8'));
        expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
    });
    test.each(fixtures)('runs %s in the public runtime', async (name) => {
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
    for (const name of ['mean', 'var', 'std'] as const) {
        const call = (input: string, dimensions: string, flag = '"omitnan"', population = false): string =>
            name + '(' + input + ',' + (name === 'mean' ? '' : population ? '1,' : '0,') + dimensions + ',' + flag + ')';
        test.each([
            ['reshape(1:8,[2,2,2])', '[1,2]', 'reshape([2.5,6.5],[1,1,2])', '(5/3)*ones(1,1,2)'],
            ['reshape(1:8,[2,2,2])', '[1,3]', '[3.5,5.5]', '[17/3,17/3]'],
            ['reshape(1:8,[2,2,2])', '[3;1]', '[3.5,5.5]', '[17/3,17/3]'],
            ['reshape(1:8,[2,2,2])', '[2,3]', '[4;5]', '[20/3;20/3]'],
            ['reshape(1:8,[2,2,2])', '[3,1,2]', '4.5', '6'],
            ['reshape(1:8,[2,2,2])', '"all"', '4.5', '6'],
            ['reshape(1:8,[2,2,2])', '[9,3,1,2]', '4.5', '6'],
            ['[1,2;3,4]', '[9,1]', '[2,3]', '[2,2]'],
            ['[1,2;3,4]', '[4,5]', '[1,2;3,4]', 'zeros(2,2)'],
            ['reshape(1:16,[2,2,2,2])', '[1,3]', 'reshape([3.5,5.5,11.5,13.5],[1,2,1,2])', '(17/3)*ones(1,2,1,2)'],
            ['reshape([1,NaN,NaN,NaN,3,5,7,9],[2,2,2])', '[1,2]', 'reshape([1,6],[1,1,2])', 'reshape([0,20/3],[1,1,2])'],
            ['reshape([1,NaN,NaN,NaN,3,5,7,9],[2,2,2])', '[1,3]', '[3,8]', '[4,2]'],
            ['reshape([1,NaN,NaN,NaN,3,5,7,9],[2,2,2])', '"all"', '5', '10'],
            ['[NaN,NaN;NaN,NaN]', '[1,2]', 'NaN', 'NaN'],
            ['[NaN,NaN;NaN,NaN]', '"all"', 'NaN', 'NaN'],
            ['[NaN,5;NaN,NaN]', '"all"', '5', '0'],
            ['[]', '"all"', 'NaN', 'NaN'],
            ['[]', '[1,2]', 'NaN', 'NaN'],
            ['[]', '[1,3]', 'zeros(1,0)', 'zeros(1,0)'],
            ['[]', '[3,4]', 'zeros(0,0)', 'zeros(0,0)'],
            ['zeros(0,3,2)', '[1,3]', 'NaN*ones(1,3)', 'NaN*ones(1,3)'],
            ['zeros(2,0,3)', '[2,3]', 'NaN*ones(2,1)', 'NaN*ones(2,1)'],
            ['zeros(2,0,3)', '[1,3]', 'zeros(1,0)', 'zeros(1,0)'],
            ['zeros(2,0,3)', '"all"', 'NaN', 'NaN'],
            ['zeros(1,0,3)', '[2,3]', 'NaN', 'NaN'],
            ['7', '[2,3]', '7', '0'],
            ['NaN', '[2,3]', 'NaN', 'NaN'],
            ['[NaN,5]', '[4,5]', '[NaN,5]', '[NaN,0]'],
            ['reshape([true,false,true,false],[2,1,2])', '[1,3]', '0.5', '1/3'],
            ['reshape([1+i,complex(NaN,2),3+3i,complex(2,NaN)],[2,2])', '[1,2]', '2+2i', '4'],
            ['[1e16,1e16+2]', '"all"', '(1e16+(1e16+2))/2', '2'],
            ['[Inf,NaN;2,4]', '[1,2]', 'Inf', 'NaN'],
        ])(name + ' groups %s across %s', (input, dimensions, mean, variance) => {
            const interpreter = Interpreter.Create();
            const expected = name === 'mean' ? mean : name === 'var' ? variance : 'real(sqrt(' + variance + '))';
            expect(interpreter.Unparse(interpreter.Execute(call(input, dimensions)))).toBe(interpreter.Unparse(interpreter.Execute(expected)));
        });
        test.each(['[1,1]', '[3,3]', '[0,2]', '[-1,2]', '[1,1.5]', '[1,Inf]', '[1,NaN]', '[1,i]', '[1,2;3,4]', '[]', '{1,2}', '"ALL"', '"native"', '"omitinvalid"'])(
            name + ' rejects selection %s',
            (selection) => {
                expect(() => Interpreter.Create().Execute(call('[1,2;3,4]', selection))).toThrow();
            },
        );
        test(name + ' preserves inclusion and rejects repeated/reversed options', () => {
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute('isnan(' + call('[1,NaN;2,3]', '[1,2]', '"includenan"') + ')'))).toBe('true\n');
            for (const selection of ['[1,2],"omitnan"', '"omitnan",[1,2]', '"all",[1,2]']) expect(() => interpreter.Execute(call('[1,2]', selection))).toThrow();
            expect(interpreter.Unparse(interpreter.Execute('nargin("' + name + '"); nargout("' + name + '"); class(' + call('true', '"all"') + ')'))).toBe(
                (name === 'mean' ? '-3\n1' : '-4\n-2') + '\ndouble\n',
            );
        });
        test(name + ' agrees between all and complete vecdim under population normalization', () => {
            const interpreter = Interpreter.Create();
            const expected = name === 'mean' ? '4.5' : name === 'var' ? '5.25' : 'sqrt(5.25)';
            for (const dimensions of ['"all"', '[1,2,3]', '[3;2;1]'])
                expect(interpreter.Unparse(interpreter.Execute(call('reshape(1:8,[2,2,2])', dimensions, '"omitnan"', true)))).toBe(interpreter.Unparse(interpreter.Execute(expected)));
        });
    }
    test.each(['number', 'decimal'] as const)('retains grouped stability, order and complex semantics on %s', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            expect(
                interpreter.Unparse(
                    interpreter.Execute('var(reshape([1e16,1e16+2],[1,1,2]),0,[1,3]); std([1e16,1e16+2],0,"all"); var([1+i,3+3i],1,[1,2]); mean(reshape([1e16,1,-1e16,2],[2,1,2]),[3,1])'),
                ),
            ).toBe('2\n' + interpreter.Unparse(interpreter.Execute('sqrt(2)')) + '2\n' + (engine === 'number' ? '0.5' : '0.75') + '\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test('never omits generated NaNs or averages partial groups', () => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute('isnan(mean([Inf,-Inf;1,NaN],[1,2],"omitnan")); mean([1,NaN;3,5],"all","omitnan"); var([1,NaN;3,5],0,"all","omitnan")'))).toBe(
            'true\n3\n4\n',
        );
    });
    test('keeps grouped input storage and independent above-rank results', () => {
        const source = MultiArray.toRowVector([Complex.create(1, 1), Complex.create(NaN, 2), Complex.create(3, 3)]);
        const originals = source.array[0].slice();
        const dimensions = MultiArray.toRowVector([Complex.two(), Complex.one()]);
        expect(Complex.realToNumber(CoreFunctions.variance(source, Complex.zero(), dimensions, CharString.create('omitnan')) as ReturnType<typeof Complex.create>)).toBe(4);
        expect(source.array[0]).toEqual(originals);
        expect(source.dimension).toEqual([1, 3]);
        expect(dimensions.array[0].map((v) => Complex.realToNumber(v as ReturnType<typeof Complex.create>))).toEqual([2, 1]);
        const high = MultiArray.toRowVector([Complex.create(4), Complex.create(5)]);
        for (const name of ['mean', 'var', 'std'] as const) {
            const result =
                name === 'mean'
                    ? CoreFunctions.mean(source, high, CharString.create('omitnan'))
                    : CoreFunctions[name === 'var' ? 'variance' : 'std'](source, Complex.zero(), high, CharString.create('omitnan'));
            if (!MultiArray.isInstanceOf(result)) throw new Error('expected row');
            expect(result).not.toBe(source);
            expect(result.array[0][0]).not.toBe(originals[0]);
            expect(result.array[0][0]).not.toBe(result.array[0][2]);
        }
    });
    test('evaluates suspended grouped controls once, suppresses output and recovers isolated sessions', async () => {
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
                'function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; A=reshape([1,NaN,NaN,NaN,3,5,7,9],[2,2,2]); m=builtin("mean",arg(A,1),arg([3,1],2),arg("omitnan",3)); v=feval("var",arg(A,4),arg(0,5),arg([1,3],6),arg("omitnan",7)); s=std(arg(A,8),arg(1,9),arg("all",10),arg("omitnan",11)); compatible=isequal(m,[3,8]) && isequal(v,[4,2]) && isequal(s,sqrt(8)) && isequal(calls,1:11); compatible',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(delays).toEqual(Array(11).fill(0));
            expect((await session.execute('mean([], [1,1],"omitnan")')).status).toBe('error');
            expect((await session.execute('std([1,3],1,"all")')).outputs[0]).toMatchObject({ text: '1\n' });
            expect((await isolated.execute('exist("m","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
