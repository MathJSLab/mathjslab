import { Complex } from './Complex';
import { createInProcessMathJSLabRuntime } from './InProcessRuntime';

describe('Effective numerical precision and scale', () => {
    test.each(['number', 'decimal'] as const)('protects scaled eigenpairs, rank and complex condition estimates with %s', async (engine) => {
        const previous = Complex.engine;
        Complex.engine = engine;
        const runtime = createInProcessMathJSLabRuntime();
        try {
            const session = await runtime.createSession();
            for (const scale of ['1e-150', '1', '1e150']) {
                for (const source of [
                    `A=${scale}*[2,1;1,2]; [V,D,T]=eig(A); norm((A/${scale})*V-V*(D/${scale}),'fro')<1e-11 && norm(V'*V-eye(2),'fro')<1e-11 && norm(T/${scale}-[2,1;1,2],'fro')<1e-11`,
                    `A=${scale}*[1,i;-i,2]; abs(cond(A)-(7+3*sqrt(5))/2)<1e-10 && rank(A)==2`,
                    `A=${scale}*[1,2;2,4]; rank(A)==1 && isinf(cond(A))`,
                    `A=${scale}*[2,1;1,2]; rank(A)==2 && abs(cond(A)-3)<1e-11 && rank(A,${scale}*4)==0`,
                ]) {
                    const result = await session.execute(source);
                    expect(result.diagnostics).toEqual([]);
                    expect(result.outputs[0]).toMatchObject({ text: 'true\n' });
                }
            }
            expect((await session.execute('eig([0,-1e-150;1e-150,0])')).status).toBe('error');
        } finally {
            await runtime.dispose();
            Complex.engine = previous;
        }
    });
});
