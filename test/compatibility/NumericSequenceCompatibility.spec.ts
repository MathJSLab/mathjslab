/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { CoreFunctions } from '../../src/CoreFunctions';
import { Complex } from '../../src/Complex';
import { MultiArray } from '../../src/MultiArray';
import { CharString } from '../../src/CharString';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Numeric MATLAB/Octave compatibility contracts', () => {
    const fixtures = ['discrete-differences', 'difference-axes', 'reverse-accumulation'];
    test.each(fixtures)('runs portable fixture %s through the synchronous API', (name) => {
        const interpreter = Interpreter.Create();
        const source = readFileSync(join(__dirname, 'fixtures', `${name}.m`), 'utf8');
        interpreter.Execute(source);
        expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
    });
    test.each(fixtures)('runs portable fixture %s through the public async runtime', async (name) => {
        const runtime = createInProcessMathJSLabRuntime();
        const session = await runtime.createSession();
        try {
            const result = await session.execute(readFileSync(join(__dirname, 'fixtures', `${name}.m`), 'utf8'));
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
        } finally {
            await runtime.dispose();
        }
    });
    test.each([
        ['diff([1;4;9])', '[3;\n5]'],
        ['diff([1+2i,4+6i])', '3+4i'],
        ['diff([true,false,true])', '[-1,1]'],
        ['size(diff(7))', '[0,1]'],
        ['size(diff([]))', '[0,0]'],
        ['size(diff(zeros(0,3)))', '[0,3]'],
        ['size(diff([1,2,4;3,5,8],2))', '[0,3]'],
        ['size(diff([1,2,4],9))', '[1,0]'],
        ['size(diff([1,2],1,3))', '[1,2,0]'],
        ['diff([1,4,9],[],2)', '[3,5]'],
        ['diff([1,4,9],0)', '[1,4,9]'],
        ['diff([1,NaN,4])', '[NaN,NaN]'],
        ['cumsum([1,2;3,4],2,"reverse")', '[3,2;\n7,4]'],
        ['cumprod([1,2;3,4],1,"reverse")', '[3,8;\n3,4]'],
        ['cumsum([1+2i,3+4i],"reverse")', '[4+6i,3+4i]'],
        ['cumsum([1,NaN,3],"reverse")', '[NaN,NaN,3]'],
        ['class(cumsum(true))', 'double'],
        ['class(cumprod(true,"reverse"))', 'double'],
        ['cumsum(7,4,"reverse")', '7'],
        ['size(cumprod(zeros(0,3),2,"reverse"))', '[0,3]'],
        ['feval("diff",[1,4,9])', '[3,5]'],
        ['builtin("cumsum",[1,2,3],"reverse")', '[6,5,3]'],
        ['reshape(cumsum(reshape(1:8,[2,2,2]),3,"reverse"),1,8)', '[6,8,10,12,5,6,7,8]'],
    ])('defines %s explicitly', (source, expected) => {
        const interpreter = Interpreter.Create();
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(`${expected}\n`);
    });
    test.each([
        'diff()',
        'diff([1,2],1,1,1)',
        'diff({1,2})',
        'diff("abc")',
        'diff([1,2],-1)',
        'diff([1,2],0.5)',
        'diff([1,2],[1,2])',
        'diff([1,2],Inf)',
        'diff([1,2],1+i)',
        'diff([1,2],1,0)',
        'diff([1,2],1,[1,2])',
        'diff([1,2],1,NaN)',
        'diff([1,2],1,Inf)',
        'diff([1,2],1,0.5)',
        'diff([1,2],struct())',
        'cumsum()',
        'cumprod({1,2})',
        'cumsum("abc")',
        'cumsum([1,2],"sideways")',
        'cumsum([1,2],0)',
        'cumsum([1,2],[1,2])',
        'cumprod([1,2],"reverse",2)',
        'cumprod([1,2],1,"reverse",1)',
    ])('rejects unsupported or invalid call %s', (source) => {
        expect(() => Interpreter.Create().Execute(source)).toThrow();
    });
    test.each(['number', 'decimal'] as const)('uses the %s numeric backend', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute('diff([1+2i,4+6i,9+12i],2)'))).toBe('2+2i\n');
            expect(interpreter.Unparse(interpreter.Execute('cumprod([2,3,4],"reverse")'))).toBe('[24,12,4]\n');
        } finally {
            Complex.engine = previous;
        }
    });
    test('evaluates a suspended numeric argument exactly once through the public runtime', async () => {
        const delays: number[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    if (effect.type === 'delay') delays.push(effect.milliseconds);
                    return {};
                },
            },
        });
        const session = await runtime.createSession();
        try {
            const result = await session.execute(
                'function y=samples(), global calls; calls+=1; pause(0); y=[1,4,9]; end; global calls; calls=0; y=feval("diff",samples()); z=builtin("cumsum",y,"reverse"); isequal(z,[8,5]) && calls==1',
            );
            expect(result.status).toBe('success');
            expect(result.outputs.filter((output) => output.type === 'text')).toEqual([expect.objectContaining({ text: 'true\n' })]);
            expect(delays).toEqual([0]);
        } finally {
            await runtime.dispose();
        }
    });
    test('direct core calls validate inputs and do not alias input storage', () => {
        const input = MultiArray.toRowVector([Complex.one(), Complex.create(4), Complex.create(9)]);
        const difference = CoreFunctions.diff(input, Complex.zero());
        const accumulated = CoreFunctions.cumsum(input, CharString.create('reverse'));
        expect(difference).not.toBe(input);
        expect(accumulated).not.toBe(input);
        expect(
            MultiArray.linearize(input).map((value) => {
                if (!Complex.isInstanceOf(value)) throw new Error('not numeric');
                return Complex.realToNumber(value);
            }),
        ).toEqual([1, 4, 9]);
        expect(() => CoreFunctions.diff(input, Complex.create(-1))).toThrow('nonnegative');
        expect(() => CoreFunctions.cumprod(input, Complex.create(0))).toThrow('positive');
    });
});
