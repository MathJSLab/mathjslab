import { Complex } from './Complex';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
import { PolynomialFunctions } from './PolynomialFunctions';
import { SampledIntegration } from './SampledIntegration';
import { MultiArray } from './MultiArray';
import { readFileSync } from 'node:fs';

const cases = [
    'isequal(polyval([2,-3,0,5],[0,1,2]),[5,4,9])',
    'isequal(polyval([1;0;1],[0,1;2,3]),[1,2;5,10])',
    'isequal(size(polyval([1,2],reshape(1:8,[2,2,2]))),[2,2,2])',
    'polyval([1,i],i)==2*i && polyval([],3)==0 && polyval(7,NaN)==7',
    'isequal(size(polyval([1,2],zeros(0,3))),[0,3])',
    'isequal(polyder([3,0,-2,0,1,5]),[15,0,-6,0,1])',
    'isequal(polyder([0;2;3]),2) && polyder(7)==0 && polyder([])==0',
    'isequal(polyder([i,2,3]),[2*i,2])',
    'isequal(polyval([true,false],[0,1]),[0,1]) && trapz([true,true])==1',
    'isequal(conv([1,0,1],[2,7]),[2,7,2,7])',
    'isequal(conv([1;2],[3;4]),[3;10;8])',
    'isequal(conv([1,2],[3;4]),[3,10,8])',
    'isequal(conv([1,2,3],[1,1],"same"),[3,5,3])',
    'isequal(conv([1;2;3],[1,1],"valid"),[3;5])',
    'isequal(conv([1,2],[1,1,1,1],"same"),[3,3])',
    'isempty(conv([1,2],[1,1,1],"valid")) && isempty(conv([],[1,2]))',
    'isequal(conv([1,2],[],"valid"),[0,0]) && isequal(conv([1,2],[],"same"),[0,0])',
    'isequal(conv([1,i],[1,-i]),[1,0,1])',
    'x=[-1,0,1,2]; abs(polyval(conv([1,2],[1,-3]),2)-polyval([1,2],2)*polyval([1,-3],2))<1e-12',
    'trapz([1,2,3])==4 && trapz([1;2;3])==4',
    'isequal(trapz([1,2;3,4;5,6]),[6,8])',
    'isequal(trapz([1,2;3,4;5,6],2),[1.5;3.5;5.5])',
    'trapz([0,1,3],[0,2,6])==9 && trapz([3,1,0],[6,2,0])==-9',
    'trapz([0,0,1],[1,1,3])==2 && trapz(0.5,[1,2,3])==2',
    'trapz([1+i,3+i])==2+i && trapz([1,2],1)==0',
    'isequal(cumtrapz([1,2,3]),[0,1.5,4]) && isequal(cumtrapz([1;2;3]),[0;1.5;4])',
    'isequal(cumtrapz([0,1,3],[0,2,6]),[0,1,9])',
    'isequal(cumtrapz([1,2;3,4],2),[0,1.5;0,3.5])',
    'A=reshape(1:12,[2,3,2]); isequal(trapz(A,3),(A(:,:,1)+A(:,:,2))/2)',
    'A=reshape(1:12,[2,3,2]); C=cumtrapz(A,3); isequal(C(:,:,1),zeros(2,3)) && isequal(C(:,:,2),trapz(A,3))',
    'isequal(size(trapz(zeros(0,3))),[1,3]) && isequal(trapz(zeros(0,3)),[0,0,0])',
    'isequal(size(cumtrapz(zeros(0,3))),[0,3]) && isequal(size(trapz([])),[1,0])',
    'C=cumtrapz([NaN,1]); trapz(7)==0 && cumtrapz(7)==0 && C(1)==0 && isnan(C(2))',
    'isnan(trapz([1,NaN,3])) && isinf(trapz([1,Inf]))',
    'A=[1,2,3]; B=A; trapz(A); cumtrapz(A); polyval(A,A); polyder(A); conv(A,A); isequal(A,B)',
];

describe('Educational polynomials and sampled integration', () => {
    test.each(['number', 'decimal'] as const)('checks mathematical results and shapes with %s', async (engine) => {
        const previous = Complex.engine;
        Complex.engine = engine;
        const runtime = createInProcessMathJSLabRuntime();
        try {
            const session = await runtime.createSession();
            for (const source of cases) {
                const result = await session.execute(source);
                expect({ source, diagnostics: result.diagnostics, output: result.outputs[0] }).toMatchObject({ source, diagnostics: [], output: { text: 'true\n' } });
            }
        } finally {
            await runtime.dispose();
            Complex.engine = previous;
        }
    });

    test.each([
        'polyval([1,2;3,4],1)',
        'polyval({1,2},1)',
        'polyval([1,2],"text")',
        'polyval([1,2],1,[])',
        '[a,b]=polyval([1,2],1)',
        'polyder([1,2;3,4])',
        'polyder([1,2],[2,3])',
        'conv(ones(2),[1,2])',
        'conv([1,2],[3,4],"circular")',
        'trapz()',
        'trapz([1,2],0)',
        'trapz([1,2],1.5)',
        'trapz([1,2],3)',
        'trapz([0,1],[1,2,3])',
        'trapz([0,i],[1,2])',
        'trapz([0,Inf],[1,2])',
        'trapz({1,2})',
        'cumtrapz([0,1],[1,2,3])',
    ])('rejects outside the supported domain: %s', async (source) => {
        const runtime = createInProcessMathJSLabRuntime();
        try {
            const session = await runtime.createSession();
            expect((await session.execute(source)).status).toBe('error');
        } finally {
            await runtime.dispose();
        }
    });

    test('uses decimal arithmetic rather than converting observations to number', async () => {
        const previous = Complex.engine;
        Complex.engine = 'decimal';
        const runtime = createInProcessMathJSLabRuntime();
        try {
            const session = await runtime.createSession();
            const result = await session.execute(
                'configure("precision",50); a=polyval([1,-1],1+1e-30); b=trapz([1,1+2e-30])-1; c=conv([1e-30,2e-30],[1,1]); abs(a/1e-30-1)<1e-12 && abs(b/1e-30-1)<1e-12 && abs(c(2)/1e-30-3)<1e-12',
            );
            expect(result.diagnostics).toEqual([]);
            expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
        } finally {
            await runtime.dispose();
            Complex.engine = previous;
        }
    });

    test('native module calls preserve scalar and array contracts', () => {
        const points = new MultiArray([2, 1]);
        points.array = [[Complex.zero()], [Complex.one()]];
        const coefficients = MultiArray.toRowVector([Complex.one(), Complex.one()]);
        const output = PolynomialFunctions.polyval(coefficients, points) as MultiArray;
        expect(output.dimension).toEqual([2, 1]);
        expect(Complex.realToNumber(SampledIntegration.trapz(points) as import('./Complex').ComplexType)).toBe(0.5);
    });

    test('avoids overflowing the endpoint sum on the number backend', () => {
        const previous = Complex.engine;
        try {
            Complex.engine = 'number';
            const samples = MultiArray.toRowVector([Complex.create(1e308), Complex.create(1e308)]);
            expect(Complex.realToNumber(SampledIntegration.trapz(samples) as import('./Complex').ComplexType)).toBe(1e308);
        } finally {
            Complex.engine = previous;
        }
    });

    test('runs the educational consumer fixture against source', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: { request: async () => ({}) } });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(readFileSync('test/compatibility/fixtures/educational-math-cycle.m', 'utf8'));
            expect(result.diagnostics).toEqual([]);
            expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
        } finally {
            await runtime.dispose();
        }
    });

    test('retains computed arguments once', async () => {
        let waits = 0;
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async () => {
                    waits++;
                    return {};
                },
            },
        });
        try {
            const session = await runtime.createSession();
            const result = await session.execute(
                'function x=sampleArg(x), global argCalls; argCalls+=1; pause(0.001); end; global argCalls; argCalls=0; a=polyval(sampleArg([1,2]),sampleArg([0,1])); b=trapz(sampleArg([0,1,3]),sampleArg([0,2,6])); c=conv(sampleArg([1,2]),sampleArg([1,1]),sampleArg("same")); isequal(a,[2,3]) && b==9 && isequal(c,[3,2]) && argCalls==7',
            );
            expect(result.diagnostics).toEqual([]);
            expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
            expect(waits).toBe(7);
        } finally {
            await runtime.dispose();
        }
    });

    test.each(['polyval(pendingArg(),[1,2])', 'polyder(pendingArg())', 'conv(pendingArg(),[1,2])', 'trapz(pendingArg())', 'cumtrapz(pendingArg())'])(
        'cancels pending argument before writing %s',
        async (expression) => {
            let entered!: () => void;
            const waiting = new Promise<void>((resolve) => {
                entered = resolve;
            });
            const runtime = createInProcessMathJSLabRuntime({
                host: {
                    request: async () => {
                        entered();
                        return await new Promise(() => {});
                    },
                },
            });
            try {
                const session = await runtime.createSession();
                await session.execute('global argCalls; argCalls=0; destination=99; completed=7; function x=pendingArg(), global argCalls; argCalls+=1; pause(999); x=[1,2,3]; end;');
                const controller = new AbortController();
                const pending = session.execute(`destination=${expression};`, { signal: controller.signal });
                await waiting;
                controller.abort();
                expect((await pending).status).toBe('cancelled');
                expect((await session.execute('[destination,completed,argCalls]')).outputs[0]).toMatchObject({ text: '[99,7,1]\n' });
            } finally {
                await runtime.dispose();
            }
        },
    );
});
