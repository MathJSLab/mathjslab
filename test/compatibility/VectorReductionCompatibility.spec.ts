/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Vector-dimension sum/prod compatibility contracts', () => {
    const fixtures = ['vector-page-totals', 'vector-cross-pages', 'vector-empty-missing'];
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
        ['reshape(sum(reshape(1:8,[2,2,2]),[1,2]),1,2)', '[10,26]'],
        ['reshape(prod(reshape(1:8,[2,2,2]),[1,2]),1,2)', '[24,1680]'],
        ['sum(reshape(1:8,[2,2,2]),[1,3])', '[14,22]'],
        ['prod(reshape(1:8,[2,2,2]),[1,3])', '[60,672]'],
        ['sum(reshape(1:8,[2,2,2]),[2,3])', '[16;20]'],
        ['prod(reshape(1:8,[2,2,2]),[2,3])', '[105;384]'],
        ['sum(reshape(1:8,[2,2,2]),[3;1])', '[14,22]'],
        ['prod(reshape(1:8,[2,2,2]),[3,2])', '[105;384]'],
        ['size(sum(ones(2,3,4),[1,2]))', '[1,1,4]'],
        ['size(prod(ones(2,3,4),[1,3]))', '[1,3]'],
        ['size(sum(ones(2,3,4),[2,3]))', '[2,1]'],
        ['sum(reshape(1:8,[2,2,2]),[3,1,2])', '36'],
        ['prod(reshape(1:8,[2,2,2]),[3,1,2])', '40320'],
        ['sum([1,2;3,4],[2,1,9])', '10'],
        ['prod([1,2;3,4],[9,1])', '[3,8]'],
        ['sum([1,2;3,4],[4,5])', '[1,2;3,4]'],
        ['sum([1,2;3,4],[1])', '[4,6]'],
        ['sum([NaN,2],[4,5],"omitnan")', '[0,2]'],
        ['prod([NaN,2],[4,5],"omitnan")', '[1,2]'],
        ['reshape(sum(reshape(1:16,[2,2,2,2]),[1,3]),1,4)', '[14,22,46,54]'],
        ['reshape(prod(reshape(1:16,[2,2,2,2]),[1,3]),1,4)', '[60,672,16380,31680]'],
        ['size(sum(ones(2,2,2,2),[1,3]))', '[1,2,1,2]'],
        ['sum([],[1,2])', '0'],
        ['prod([],[1,2])', '1'],
        ['size(sum([],[1,3]))', '[1,0]'],
        ['size(prod([],[3,4]))', '[0,0]'],
        ['sum(zeros(0,3,2),[1,3])', '[0,0,0]'],
        ['prod(zeros(0,3,2),[1,3])', '[1,1,1]'],
        ['sum(zeros(2,0,3),[2,3])', '[0;0]'],
        ['prod(zeros(2,0,3),[2,3])', '[1;1]'],
        ['size(sum(zeros(2,0,3),[1,3]))', '[1,0]'],
        ['sum([NaN,NaN;NaN,NaN],[1,2],"omitnan")', '0'],
        ['prod([NaN,NaN;NaN,NaN],[1,2],"omitnan")', '1'],
        ['sum([1,NaN;2,3],[1,2],"omitnan")', '6'],
        ['prod([1,NaN;2,3],[1,2],"omitnan")', '6'],
        ['isnan(sum([1,NaN;2,3],[1,2]))', 'true'],
        ['isnan(prod([1,NaN;2,3],[1,2],"includenan"))', 'true'],
        ['sum([1+i,complex(2,NaN);2+i,complex(NaN,3)],[2,1],"omitnan")', '3+2i'],
        ['prod([1+i,complex(2,NaN);2+i,complex(NaN,3)],[2,1],"omitnan")', '1+3i'],
        ['imag(prod(complex(Inf,2),[1,2]))', '2'],
        ['real(prod(complex(2,Inf),[2,1],"omitnan"))', '2'],
        ['isnan(sum([Inf,1;-Inf,2],[1,2],"omitnan"))', 'true'],
        ['isnan(prod([0,2;Inf,3],[1,2],"omitnan"))', 'true'],
        ['sum([true,false;true,true],[1,2])', '3'],
        ['class(prod(true,[4,5]))', 'double'],
        ['feval("sum",[1,NaN;2,3],[2,1],"omitnan")', '6'],
        ['builtin("prod",[1,NaN;2,3],[2,1],"omitnan")', '6'],
    ])('defines %s', (source, expected) => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute(source)).replace(/;\n/g, ';')).toBe(`${expected}\n`);
    });
    test.each([
        'sum([1,2],[])',
        'prod([1,2],[1,1])',
        'sum([1,2],[5,5])',
        'prod([1,2],[1,0])',
        'sum([1,2],[1,-2])',
        'prod([1,2],[1,0.5])',
        'sum([1,2],[1,Inf])',
        'prod([1,2],[1,NaN])',
        'sum([1,2],[1,2+i])',
        'prod([1,2],[1,2;3,4])',
        'sum([1,2],reshape(1:4,[1,2,2]))',
        'prod([1,2],{1,2})',
        'sum([1,2],[1,2],"all")',
        'prod([1,2],"omitnan",[1,2])',
        'sum([1,2],[1,2],"native")',
        'prod([],[1,1],"omitnan")',
        'sum([],[1,2],"unknown")',
        'prod([1,2],[1,2],"omitnan",3)',
    ])('rejects invalid/unsupported call %s', (source) => expect(() => Interpreter.Create().Execute(source)).toThrow());
    test('permutes implicit trailing singleton axes without invalid indices', () => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute('isequal(permute(reshape(1:4,[1,2,2]),[2,3,1]),[1,3;2,4])'))).toBe('true\n');
        expect(interpreter.Unparse(interpreter.Execute('isequal(reshape(ipermute(reshape(1:4,[1,2,2]),[2,3,1]),2,2),[1,2;3,4])'))).toBe('true\n');
    });
    test('reshapes page storage when rows change and columns stay the same', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute('P=reshape(1:8,[2,2,2]); Q=permute(P,[1,3,2]);');
        expect(interpreter.Unparse(interpreter.Execute('isequal(reshape(Q,4,2),[1,3;2,4;5,7;6,8])'))).toBe('true\n');
    });
    test.each(['number', 'decimal'] as const)('uses one column-major fold with %s arithmetic', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            interpreter.Execute('A=[1e16,-1e16;1,1];');
            const expected = engine === 'number' ? '1\n' : '2\n';
            expect(interpreter.Unparse(interpreter.Execute('sum(A,[1,2])'))).toBe(expected);
            expect(interpreter.Unparse(interpreter.Execute('sum(A,[2;1])'))).toBe(expected);
            expect(interpreter.Unparse(interpreter.Execute('sum(A,[1,2])==sum(A,"all")'))).toBe('true\n');
            expect(interpreter.Unparse(interpreter.Execute('isnan(sum([Inf,1;-Inf,2],[2,1],"omitnan")) && isnan(prod([0,2;Inf,3],[1,2],"omitnan"))'))).toBe('true\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test.each(['sum', 'prod'] as const)('does not mutate or alias %s inputs, dimensions, or empty identities', (name) => {
        const input = new MultiArray([2, 2, 2], () => Complex.create(2));
        const dimensions = MultiArray.toColumnVector([Complex.create(3), Complex.one()]);
        const original = input.array.map((row) => row.slice());
        const result = CoreFunctions[name](input, dimensions, CharString.create('omitnan'));
        if (!MultiArray.isInstanceOf(result)) throw new Error('expected row result');
        expect(input.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(dimensions).map((value) => Complex.realToNumber(value as ReturnType<typeof Complex.one>))).toEqual([3, 1]);
        input.array.forEach((row, i) => row.forEach((value, j) => expect(value).toBe(original[i][j])));
        expect(MultiArray.linearize(result).every((value) => !original.flat().includes(value))).toBe(true);
        const empty = CoreFunctions[name](new MultiArray([0, 2, 2]), MultiArray.toRowVector([Complex.one(), Complex.create(3)]));
        if (!MultiArray.isInstanceOf(empty)) throw new Error('expected identities');
        expect(empty.array[0][0]).not.toBe(empty.array[0][1]);
    });
    test('retains suspended arguments, output suppression, recovery and session isolation', async () => {
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
                'function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; total=feval("sum",arg(reshape([1,NaN,2,3,4,5,6,7],[2,2,2]),1),arg([3,1],2),arg("omitnan",3)); compatible=isequal(total,[10,18]) && isequal(calls,[1,2,3]); compatible',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(delays).toEqual([0, 0, 0]);
            expect((await session.execute('sum([],[1,1],"omitnan")')).status).toBe('error');
            expect((await session.execute('prod([1,2;3,4],[1,2])')).outputs[0]).toMatchObject({ text: '24\n' });
            expect((await isolated.execute('exist("total","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
