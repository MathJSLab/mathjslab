/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Numeric sum/prod NaN compatibility contracts', () => {
    const fixtures = ['nan-reduction', 'nan-reduction-empty', 'nan-reduction-axes'];
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
        ['sum([2,NaN,3],"omitnan")', '5'],
        ['prod([2,NaN,3],"omitnan")', '6'],
        ['sum([2;NaN;3],"omitnan")', '5'],
        ['prod([2;NaN;3],"omitnan")', '6'],
        ['sum([2,NaN,3],"includenan")', 'NaN'],
        ['prod([2,NaN,3],"includenan")', 'NaN'],
        ['sum([2,NaN,3])', 'NaN'],
        ['prod([2,NaN,3])', 'NaN'],
        ['sum(NaN,"omitnan")', '0'],
        ['prod(NaN,"omitnan")', '1'],
        ['sum([NaN,NaN],2,"omitnan")', '0'],
        ['prod([NaN,NaN],2,"omitnan")', '1'],
        ['sum([],"omitnan")', '0'],
        ['prod([],"includenan")', '1'],
        ['size(sum([],1,"omitnan"))', '[1,0]'],
        ['size(prod([],2,"omitnan"))', '[0,1]'],
        ['size(sum([],3,"omitnan"))', '[0,0]'],
        ['size(prod(zeros(2,0,3),1,"omitnan"))', '[1,0,3]'],
        ['size(sum(zeros(0,3,2),2,"includenan"))', '[0,1,2]'],
        ['reshape(sum(zeros(2,0,3),2,"omitnan"),1,6)', '[0,0,0,0,0,0]'],
        ['reshape(prod(zeros(0,3,2),1,"omitnan"),1,6)', '[1,1,1,1,1,1]'],
        ['size(sum(zeros(1,0,3),"omitnan"))', '[1,1,3]'],
        ['reshape(prod(zeros(1,0,3),"omitnan"),1,3)', '[1,1,1]'],
        ['sum([NaN,2],3,"omitnan")', '[0,2]'],
        ['prod([NaN,2],3,"omitnan")', '[1,2]'],
        ['sum([NaN,2],1,"omitnan")', '[0,2]'],
        ['prod([NaN,2],1,"omitnan")', '[1,2]'],
        ['class(sum(true,3,"omitnan"))', 'double'],
        ['class(prod(true,3,"omitnan"))', 'double'],
        ['sum([true,false,true],"omitnan")', '2'],
        ['prod([true,false,true],"omitnan")', '0'],
        ['sum([1+i,complex(2,NaN),2+i],"omitnan")', '3+2i'],
        ['prod([1+i,complex(NaN,2),2+i],"omitnan")', '1+3i'],
        ['isnan(sum([complex(2,NaN),1],"includenan"))', 'true'],
        ['isnan(prod([complex(NaN,2),1],"includenan"))', 'true'],
        ['isnan(sum([Inf,-Inf,NaN],"omitnan"))', 'true'],
        ['isnan(prod([0,Inf,NaN],"omitnan"))', 'true'],
        ['feval("sum",[2,NaN,3],"omitnan")', '5'],
        ['builtin("prod",[2,NaN,3],2,"omitnan")', '6'],
        ['imag(prod(complex(Inf,2),3,"omitnan"))', '2'],
        ['real(prod(complex(2,Inf),1,"omitnan"))', '2'],
        ['imag(sum(complex(Inf,2),3,"includenan"))', '2'],
        ['nargin("sum")', '-3'],
        ['nargin("prod")', '-3'],
    ])('defines %s', (source, expected) => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(`${expected}\n`);
    });
    test.each([
        'sum()',
        'prod([1,2],1,"omitnan",1)',
        'sum({1,2})',
        'prod("abc")',
        'sum([1,2],0,"omitnan")',
        'prod([1,2],-1,"omitnan")',
        'sum([1,2],0.5,"omitnan")',
        'prod([1,2],Inf,"omitnan")',
        'sum([1,2],NaN,"omitnan")',
        'sum([1,2],"omitnan",2)',
        'prod([1,2],"omitnan","includenan")',
        'sum([1,2],"reverse")',
        'prod([1,2],"native")',
        'prod([1,2],"omitinvalid")',
        'sum([1,2],"OMITNAN")',
        'prod([],1,"unknown")',
        'sum([],"omitnan",1)',
    ])('rejects invalid/unsupported call %s', (source) => expect(() => Interpreter.Create().Execute(source)).toThrow());
    test.each(['number', 'decimal'] as const)('uses %s arithmetic for complex omissions and identities', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute('sum([complex(NaN,2),1+i,complex(2,NaN)],"omitnan")'))).toBe('1+i\n');
            expect(interpreter.Unparse(interpreter.Execute('prod([complex(NaN,2),1+i,complex(2,NaN)],"omitnan")'))).toBe('1+i\n');
            expect(interpreter.Unparse(interpreter.Execute('sum([]);prod([])'))).toBe('0\n1\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test.each(['sum', 'prod'] as const)('does not alias %s input or independent empty-line identities', (name) => {
        const original = Complex.create(2),
            missing = Complex.create(NaN);
        const input = MultiArray.toRowVector([original, missing]);
        const result = CoreFunctions[name](input, Complex.create(3), CharString.create('omitnan'));
        if (!MultiArray.isInstanceOf(result)) throw new Error('expected array');
        expect(result).not.toBe(input);
        expect(result.array[0][0]).not.toBe(original);
        expect(input.array[0][0]).toBe(original);
        expect(input.array[0][1]).toBe(missing);
        expect(Complex.realToNumber(original)).toBe(2);
        expect(Complex.realIsNaN(missing)).toBe(true);
        const empty = CoreFunctions[name](new MultiArray([0, 2]));
        if (!MultiArray.isInstanceOf(empty)) throw new Error('expected identities');
        expect(empty.array[0][0]).not.toBe(empty.array[0][1]);
        expect(() => CoreFunctions[name](input, CharString.create('omitnan'), Complex.one())).toThrow('expected DIM/VECDIM');
    });
    test('retains suspended argument order and recovers after invalid options', async () => {
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
            const result = await session.execute(
                'function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; r=builtin("prod",arg([2,NaN,3],1),arg(2,2),arg("omitnan",3)); r==6 && isequal(calls,[1,2,3])',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(delays).toEqual([0, 0, 0]);
            expect((await session.execute('sum([],"omitnan",1)')).status).toBe('error');
            const recovery = await session.execute('sum([2,NaN,3],"omitnan")');
            expect(recovery.status).toBe('success');
            expect(recovery.outputs[0]).toMatchObject({ text: '5\n' });
        } finally {
            await runtime.dispose();
        }
    });
});
