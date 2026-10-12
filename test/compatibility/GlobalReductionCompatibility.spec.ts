/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Global sum/prod compatibility contracts', () => {
    const fixtures = ['global-measurements', 'global-factors', 'global-identities'];
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
        ['sum([1,3;2,4],"all")', '10'],
        ['prod([1,3;2,4],"all")', '24'],
        ['sum(reshape(1:8,[2,2,2]),"all")', '36'],
        ['prod(reshape(1:8,[2,2,2]),"all")', '40320'],
        ['size(sum(ones(2,3,2),"all"))', '[1,1]'],
        ['size(prod(ones(2,3,2),"all"))', '[1,1]'],
        ['sum([1,NaN;2,3],"all","omitnan")', '6'],
        ['prod([1,NaN;2,3],"all","omitnan")', '6'],
        ['isnan(sum([1,NaN;2,3],"all"))', 'true'],
        ['isnan(prod([1,NaN;2,3],"all","includenan"))', 'true'],
        ['sum([NaN,NaN;NaN,NaN],"all","omitnan")', '0'],
        ['prod([NaN,NaN;NaN,NaN],"all","omitnan")', '1'],
        ['sum([],"all")', '0'],
        ['prod([],"all")', '1'],
        ['sum(zeros(2,0,3),"all","omitnan")', '0'],
        ['prod(zeros(0,2,3),"all","includenan")', '1'],
        ['sum(true,"all")', '1'],
        ['prod(false,"all")', '0'],
        ['class(sum([true,false;true,true],"all"))', 'double'],
        ['class(prod(true,"all"))', 'double'],
        ['sum([1+i,complex(2,NaN);2+i,complex(NaN,3)],"all","omitnan")', '3+2i'],
        ['prod([1+i,complex(2,NaN);2+i,complex(NaN,3)],"all","omitnan")', '1+3i'],
        ['imag(prod(complex(Inf,2),"all"))', '2'],
        ['real(prod(complex(2,Inf),"all","omitnan"))', '2'],
        ['isnan(sum([Inf,-Inf,NaN],"all","omitnan"))', 'true'],
        ['isnan(prod([0,Inf,NaN],"all","omitnan"))', 'true'],
        ['feval("sum",[1,NaN;2,3],"all","omitnan")', '6'],
        ['builtin("prod",[1,NaN;2,3],"all","omitnan")', '6'],
        ["sum([1,2;3,4],'all','omitnan')", '10'],
        ['nargin("sum");nargin("prod")', '-3\n-3'],
    ])('defines %s', (source, expected) => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(`${expected}\n`);
    });
    test.each([
        'sum([1,2],"ALL")',
        'prod([1,2],"all","all")',
        'sum([1,2],"omitnan","all")',
        'prod([1,2],1,"all")',
        'sum([1,2],"all",1)',
        'prod([1,2],"all","native")',
        'sum([1,2],"all","omitinvalid")',
        'prod([1,2],"all","reverse")',
        'sum([1,2],"all","omitnan","includenan")',
        'prod([], "all","unknown")',
        'sum({1,2},"all")',
        'prod("abc","all")',
    ])('rejects invalid/unsupported call %s', (source) => expect(() => Interpreter.Create().Execute(source)).toThrow());
    test.each(['number', 'decimal'] as const)('retains column-major traversal with the %s backend', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            interpreter.Execute('A=[1e16,-1e16;1,1]; P=reshape([1+i,2+i,NaN,2],[2,1,2]);');
            expect(interpreter.Unparse(interpreter.Execute('sum(A,"all")==sum(A(:)) && prod(P,"all","omitnan")==prod(P(:),"omitnan")'))).toBe('true\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test.each(['sum', 'prod'] as const)('preserves %s input storage and returns an independent scalar', (name) => {
        const original = Complex.create(2);
        const input = new MultiArray([1, 1, 2]);
        input.array[0][0] = original;
        input.array[1][0] = Complex.create(NaN);
        MultiArray.setType(input);
        const result = CoreFunctions[name](input, CharString.create('all'), CharString.create('omitnan'));
        expect(Complex.isInstanceOf(result)).toBe(true);
        expect(result).not.toBe(original);
        expect(input.dimension).toEqual([1, 1, 2]);
        expect(input.array[0][0]).toBe(original);
        expect(Complex.realToNumber(original)).toBe(2);
        expect(Complex.realIsNaN(input.array[1][0] as typeof original)).toBe(true);
        const singleton = CoreFunctions[name](original, CharString.create('all'));
        expect(singleton).not.toBe(original);
    });
    test('retains resumed argument order, suppressed output, recovery and session isolation', async () => {
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
                'function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; total=builtin("sum",arg([1,NaN;2,3],1),arg("all",2),arg("omitnan",3)); compatible=total==6 && isequal(calls,[1,2,3]); compatible',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(delays).toEqual([0, 0, 0]);
            expect((await session.execute('prod([],"all","unknown")')).status).toBe('error');
            expect((await session.execute('prod([1,2;3,4],"all")')).outputs[0]).toMatchObject({ text: '24\n' });
            expect((await isolated.execute('exist("total","var")')).outputs[0]).toMatchObject({ text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
