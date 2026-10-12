/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from '../../src/Interpreter';
import { Complex } from '../../src/Complex';
import { createInProcessMathJSLabRuntime } from '../../src/InProcessRuntime';

describe('Paired dispersion and mean', () => {
    test('restores a session after resumed argument failure and cancellation', async () => {
        const controller = new AbortController();
        let cancel = false;
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async () => {
                    if (cancel) controller.abort('stop paired output');
                    return {};
                },
            },
        });
        try {
            const session = await runtime.createSession();
            await session.execute('function y=badpair(), pause(0); error("paired failure"); y=0; end; function y=waitpair(), pause(0); y=0; end; v=99; m=88;');
            expect((await session.execute('[v,m]=var([1,3],badpair());')).status).toBe('error');
            expect((await session.execute('[v,m]')).outputs[0]).toEqual({ type: 'text', text: '[99,88]\n' });
            cancel = true;
            expect((await session.execute('[v,m]=std([1,3],waitpair());', { signal: controller.signal })).status).toBe('cancelled');
            cancel = false;
            expect((await session.execute('[v,m]=std([1,3],1); [v,m]')).outputs[0]).toEqual({ type: 'text', text: '[1,2]\n' });
        } finally {
            await runtime.dispose();
        }
    }, 20000);
    for (const name of ['var', 'std']) {
        test.each([
            ['[1,NaN,3]', '0', 'NaN', 'NaN'],
            ['[1,NaN,3]', '0,"omitnan"', '2', '2'],
            ['[1,NaN,3]', '1,"omitmissing"', '1', '2'],
            ['[NaN,NaN]', '0,"omitnan"', 'NaN', 'NaN'],
            ['[NaN,5]', '0,"omitnan"', '0', '5'],
            ['[]', '0', 'NaN', 'NaN'],
            ['zeros(0,3)', '0,1', 'NaN*ones(1,3)', 'NaN*ones(1,3)'],
            ['zeros(2,0,3)', '0,[1,3]', 'zeros(1,0)', 'zeros(1,0)'],
            ['zeros(2,0,3)', '0,"all"', 'NaN', 'NaN'],
            ['7', '0,5', '0', '7'],
            ['[1,3]', '0,5', '[0,0]', '[1,3]'],
            ['[true,false]', '0', '0.5', '0.5'],
            ['[1+i,3+3i]', '0', '4', '2+2i'],
            ['[1+i,complex(NaN,2),3+3i]', '0,"omitmissing"', '4', '2+2i'],
            ['[Inf,2]', '0', 'NaN', 'Inf'],
            ['[-Inf,Inf]', '0', 'NaN', 'NaN'],
            ['reshape(1:8,[2,2,2])', '0,[1,3]', '[17/3,17/3]', '[3.5,5.5]'],
            ['reshape(1:8,[2,2,2])', '1,[1,2]', '1.25*ones(1,1,2)', 'reshape([2.5,6.5],[1,1,2])'],
            ['[1e16,1e16+2]', '0,"all"', '2', '1e16+1'],
        ])(`${name} returns both outputs for %s with %s`, (input, controls, variance, mean) => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(`A=${input}; before=A; [v,m]=${name}(A,${controls});`);
            const expected = name === 'std' ? `real(sqrt(${variance}))` : variance;
            expect(interpreter.Unparse(interpreter.Execute('v'))).toBe(interpreter.Unparse(interpreter.Execute(expected)));
            expect(interpreter.Unparse(interpreter.Execute('m'))).toBe(interpreter.Unparse(interpreter.Execute(mean)));
            expect(interpreter.Unparse(interpreter.Execute('A'))).toBe(interpreter.Unparse(interpreter.Execute('before')));
            interpreter.Execute(`single=${name}(A,${controls}); [~,onlyMean]=${name}(A,${controls}); [onlyValue,~]=${name}(A,${controls});`);
            expect(interpreter.Unparse(interpreter.Execute('single'))).toBe(interpreter.Unparse(interpreter.Execute('v')));
            expect(interpreter.Unparse(interpreter.Execute('onlyMean'))).toBe(interpreter.Unparse(interpreter.Execute('m')));
            expect(interpreter.Unparse(interpreter.Execute('onlyValue'))).toBe(interpreter.Unparse(interpreter.Execute('v')));
        });
        test(`${name} bounds outputs and supports forwarding`, () => {
            const interpreter = Interpreter.Create();
            expect(interpreter.Unparse(interpreter.Execute(`nargout("${name}")`))).toBe('-2\n');
            interpreter.Execute(`[a,b]=feval("${name}",[1,3],1); [c,d]=builtin("${name}",[1,3],1);`);
            expect(interpreter.Unparse(interpreter.Execute('[a,b,c,d]'))).toBe('[1,2,1,2]\n');
            expect(() => interpreter.Execute(`[a,b,c]=${name}([1,3]);`)).toThrow();
        });
    }
    test('fixture on both backends and public runtime, suspended controls and recovery', async () => {
        const source = readFileSync(join(__dirname, 'fixtures', 'dispersion-paired-outputs.m'), 'utf8');
        const previous = Complex.engine;
        try {
            for (const engine of ['number', 'decimal'] as const) {
                Complex.engine = engine;
                const interpreter = Interpreter.Create();
                interpreter.Execute(source);
                expect(interpreter.Unparse(interpreter.Execute('compatible'))).toBe('true\n');
            }
        } finally {
            Complex.engine = previous;
        }
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
                'function y=pairedarg(x), pause(0.001); y=x; end; count=0; [v,m]=var(pairedarg([1,3]+ ++count),pairedarg(0),pairedarg("all"),pairedarg("omitmissing")); [v,m,count]',
            );
            expect(result.status).toBe('success');
            expect(result.outputs[0]).toEqual({ type: 'text', text: '[2,3,1]\n' });
            expect(delays).toEqual([1, 1, 1, 1]);
            expect((await session.execute('[v,m,extra]=std([1,3]);')).status).toBe('error');
            expect((await session.execute('[v,m]')).outputs[0]).toEqual({ type: 'text', text: '[2,3]\n' });
            const isolated = await runtime.createSession();
            expect((await isolated.execute('exist("m","var")')).outputs[0]).toEqual({ type: 'text', text: '0\n' });
        } finally {
            await runtime.dispose();
        }
    }, 30000);
});
