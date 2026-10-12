/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

const fixtures = ['nan-accumulation', 'nan-accumulation-axes', 'nan-accumulation-identities'];
describe('Explicit cumulative NaN compatibility contracts', () => {
    test.each(fixtures)('runs fixture %s synchronously', (name) => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(readFileSync(join(__dirname, 'fixtures', `${name}.m`), 'utf8'));
        expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
    });
    test.each(fixtures)('runs fixture %s through the public runtime', async (name) => {
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
        ['cumsum([2,NaN,3],"includenan")', '[2,NaN,NaN]'],
        ['cumprod([2,NaN,3],"includenan")', '[2,NaN,NaN]'],
        ['cumsum([2,NaN,3],"reverse","includenan")', '[NaN,NaN,3]'],
        ['cumprod([2,NaN,3],"reverse","includenan")', '[NaN,NaN,3]'],
        ['cumsum([2,NaN,3])', '[2,NaN,NaN]'],
        ['cumprod([2,NaN,3])', '[2,NaN,NaN]'],
        ['cumsum([NaN;2;NaN;3],"omitnan")', '[0;\n2;\n2;\n5]'],
        ['cumprod([NaN;2;NaN;3],"omitnan")', '[1;\n2;\n2;\n6]'],
        ['cumsum([NaN,NaN],"reverse","omitnan")', '[0,0]'],
        ['cumprod([NaN,NaN],"omitnan")', '[1,1]'],
        ['cumsum([NaN,2],2,"forward","omitnan")', '[0,2]'],
        ['cumprod([NaN,2],2,"forward","omitnan")', '[1,2]'],
        ['cumsum([NaN,2],2,"omitnan")', '[0,2]'],
        ['cumprod([NaN,2],2,"omitnan")', '[1,2]'],
        ['cumsum([NaN,2],3,"reverse","omitnan")', '[0,2]'],
        ['cumprod([NaN,2],3,"reverse","omitnan")', '[1,2]'],
        ['cumsum(NaN,"omitnan")', '[0]'],
        ['cumprod(NaN,"omitnan")', '[1]'],
        ['size(cumsum([],"omitnan"))', '[0,0]'],
        ['size(cumprod(zeros(0,3),2,"reverse","omitnan"))', '[0,3]'],
        ['size(cumsum(zeros(2,0,3),3,"reverse","includenan"))', '[2,0,3]'],
        ['class(cumsum(true,"omitnan"))', 'double'],
        ['class(cumprod(true,3,"reverse","includenan"))', 'double'],
        ['cumsum([true,false,true],"reverse","omitnan")', '[2,1,1]'],
        ['cumprod([true,false,true],"reverse","omitnan")', '[0,0,1]'],
        ['cumsum([1+i,complex(2,NaN),2+i],"omitnan")', '[1+i,1+i,3+2i]'],
        ['cumprod([1+i,complex(NaN,2),2+i],"reverse","omitnan")', '[1+3i,2+i,2+i]'],
        ['isequal(isnan(cumsum([Inf,-Inf,NaN,2],"omitnan")),[false,true,true,true])', 'true'],
        ['feval("cumsum",[NaN,2],"omitnan")', '[0,2]'],
        ['builtin("cumprod",[2,NaN,3],2,"reverse","omitnan")', '[6,3,3]'],
        ['nargin("cumsum")', '-4'],
        ['nargin("cumprod")', '-4'],
    ])('defines %s', (source, expected) => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(`${expected}\n`);
    });
    test.each([
        'cumsum([1,2],"omitnan","reverse")',
        'cumprod([1,2],"omitnan",2)',
        'cumsum([1,2],"omitnan","includenan")',
        'cumprod([1,2],"reverse","forward")',
        'cumsum([1,2],2,"omitnan","omitnan")',
        'cumprod([1,2],2,"reverse","includenan","omitnan")',
        'cumsum([1,2],"OMITNAN")',
        'cumsum([],"omitnan","reverse")',
        'cumprod([],2,"reverse","unknown")',
        'cumprod([1,2],"omitinvalid")',
        'cumsum([1,2],"includeinvalid")',
        'cumprod([1,2],[] ,"omitnan")',
        'cumsum([1,2],0,"omitnan")',
        'cumsum([1,2],[1,2],"omitnan")',
        'cumprod([1,2],2,"reverse",true)',
    ])('rejects invalid or unsupported call %s', (source) => {
        expect(() => Interpreter.Create().Execute(source)).toThrow();
    });
    test.each(['number', 'decimal'] as const)('omits both complex NaN components using %s', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute('cumsum([complex(NaN,2),1+i,complex(2,NaN)],"omitnan")'))).toBe('[0,1+i,1+i]\n');
            expect(interpreter.Unparse(interpreter.Execute('cumprod([complex(NaN,2),1+i,complex(2,NaN)],"omitnan")'))).toBe('[1,1+i,1+i]\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test('retains suspended argument order through the public runtime', async () => {
        const effects: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') effects.push(effect.milliseconds);
                    return {};
                },
            },
        });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(
                'function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; r=builtin("cumsum",arg([NaN,2,NaN],1),arg(2,2),arg("reverse",3),arg("omitnan",4)); isequal(r,[2,2,0]) && isequal(calls,[1,2,3,4])',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(effects).toEqual([0, 0, 0, 0]);
            const failure = await session.execute('cumsum([NaN,2],"omitnan","reverse")');
            expect(failure.status).toBe('error');
            const recovery = await session.execute('cumsum([NaN,2],"omitnan")');
            expect(recovery.status).toBe('success');
            expect(recovery.outputs[0]).toMatchObject({ text: '[0,2]\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test.each(['cumsum', 'cumprod'] as const)('keeps %s input storage immutable and omitted output slots independent', (name) => {
        const first = Complex.create(2),
            missing = Complex.create(NaN);
        const input = MultiArray.toRowVector([first, missing]);
        const result = CoreFunctions[name](input, CharString.create('omitnan'));
        expect(MultiArray.isInstanceOf(result)).toBe(true);
        if (!MultiArray.isInstanceOf(result)) throw new Error('expected array');
        expect(result.array[0][0]).not.toBe(first);
        expect(result.array[0][1]).not.toBe(result.array[0][0]);
        expect(input.array[0][0]).toBe(first);
        expect(input.array[0][1]).toBe(missing);
        expect(Complex.realToNumber(first)).toBe(2);
        expect(Complex.realIsNaN(missing)).toBe(true);
        expect(() => CoreFunctions.cumprod(input, CharString.create('omitnan'), CharString.create('reverse'))).toThrow('expected DIM');
    });
});
