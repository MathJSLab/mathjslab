import { Interpreter } from './Interpreter';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
import { Decimal } from 'decimal.js';
import type { PlotOutputRequest } from './PlotFunctions';

const execute = (interpreter: Interpreter, source: string): PlotOutputRequest[] => {
    const plots: PlotOutputRequest[] = [];
    interpreter.withPlotOutput(
        (request) => plots.push(request),
        () => interpreter.Evaluate(interpreter.Parse(source)),
    );
    return plots;
};

describe('Session-owned plotting builtins', () => {
    test.each([
        ['plot([1,2],[3,4])', 'plot', 'scatter'],
        ['plot3([1,2],[3,4],[5,6])', 'plot3', 'scatter3d'],
        ['surf([1,2;3,4])', 'surf', 'surface'],
        ['histogram([3,4])', 'histogram', 'bar'],
    ])('prepares %s without a DOM or renderer', (source, type, trace) => {
        const plots = execute(Interpreter.Create(), source);
        expect(plots).toHaveLength(1);
        expect(plots[0]).toMatchObject({ type, data: [{ type: trace }] });
        expect(() => JSON.stringify(plots)).not.toThrow();
    });

    test('samples the owning workspace and restores scope and numeric precision after failure', () => {
        const first = Interpreter.Create();
        const second = Interpreter.Create();
        const precision = Decimal.precision;
        const stack = first.context.callStack.length;
        expect(execute(first, 'a=2; plot2d(a*x,x,0,1)')[0]!.data[0]!.y).toEqual(expect.arrayContaining([0, 0.02]));
        expect(execute(second, 'a=3; plot2d(a*x,x,0,1)')[0]!.data[0]!.y).toEqual(expect.arrayContaining([0, 0.03]));
        expect(() => execute(first, 'plot2d(missing,x,0,1)')).toThrow();
        expect(first.context.callStack).toHaveLength(stack);
        expect(Decimal.precision).toBe(precision);
        expect(execute(first, 'plot2d(a*x,x,0,1)')[0]!.data[0]!.y).toEqual(expect.arrayContaining([0, 0.02]));
    });

    test('nested sinks restore after exceptions and never leak to later operations', () => {
        const interpreter = Interpreter.Create();
        const outer: PlotOutputRequest[] = [];
        interpreter.withPlotOutput(
            (p) => outer.push(p),
            () => {
                expect(() =>
                    interpreter.withPlotOutput(
                        () => {
                            throw new Error('host failed');
                        },
                        () => interpreter.Evaluate(interpreter.Parse('plot([1,2])')),
                    ),
                ).toThrow('host failed');
                interpreter.Evaluate(interpreter.Parse('plot([3,4])'));
            },
        );
        interpreter.Evaluate(interpreter.Parse('plot([5,6])'));
        expect(outer).toHaveLength(1);
        expect(outer[0]!.data[0]!.y).toEqual([3, 4]);
    });

    test('captures plots in the standard runtime before and after host waits without replay', async () => {
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
            const result = await session.execute('a=2; plot([a,a+1]); pause(0.001); plot2d(a*x,x,0,1)');
            expect(result.status).toBe('success');
            expect(result.outputs.filter((p) => p.type === 'visualization').map((p) => p.request)).toMatchObject([{ type: 'plot' }, { type: 'plot2d' }]);
            expect(delays).toEqual([1]);
        } finally {
            await runtime.dispose();
        }
    });
});
