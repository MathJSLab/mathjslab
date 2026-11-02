import { Complex, type ComplexType } from './Complex';
import { Interpreter } from './Interpreter';
import { LAPACK } from './LAPACK';
import { LinearAlgebra } from './LinearAlgebra';
import { MathOperation } from './MathOperation';
import { MultiArray } from './MultiArray';

const frobenius = (matrix: MultiArray): number => Math.hypot(...MultiArray.linearize(matrix).map((value) => Complex.realToNumber(Complex.abs(value as ComplexType))));

describe('Hermitian eigenvalue contract', () => {
    test.each(['number', 'decimal'] as const)('protects eigenpair residuals and reduction for the %s backend', (engine) => {
        const previous = Complex.engine;
        try {
            Complex.engine = engine;
            const interpreter = Interpreter.Create();
            for (const source of ['[2,1;1,2]', '[1,i;-i,2]', '[4,1+i,2,0;1-i,3,i,1;2,-i,5,2+i;0,1,2-i,6]', '[2,0,0;0,2,0;0,0,2]', '[7]']) {
                const A = interpreter.Execute(source).list[0] as MultiArray;
                const original = MultiArray.unparse(A, interpreter);
                const { values: D, vectors: V, T } = LinearAlgebra.eigDecomposition(A, 3);
                const residual = MathOperation.minus(MathOperation.mtimes(A, V!), MathOperation.mtimes(V!, D)) as MultiArray;
                const identity = LinearAlgebra.eye(Complex.create(A.dimension[0]));
                const orthogonality = MathOperation.minus(MathOperation.mtimes(MathOperation.ctranspose(V!), V!), identity) as MultiArray;
                expect(frobenius(residual) / Math.max(1, frobenius(A))).toBeLessThan(1e-11);
                expect(frobenius(orthogonality)).toBeLessThan(1e-11);
                const reduced = MultiArray.copy(A);
                const { taus } = LAPACK.hetrd(reduced);
                const Q = LAPACK.ungtr(reduced, taus);
                const reconstructed = MathOperation.mtimes(MathOperation.mtimes(Q, T!), MathOperation.ctranspose(Q));
                expect(frobenius(MathOperation.minus(A, reconstructed) as MultiArray) / Math.max(1, frobenius(A))).toBeLessThan(1e-11);
                expect(MultiArray.unparse(A, interpreter)).toBe(original);
                const ascending = LinearAlgebra.eigDecomposition(A, 1).values;
                const descending = LinearAlgebra.eigDecomposition(A, 1, 'desc').values;
                expect(MultiArray.linearize(descending).map((value) => Complex.realToNumber(value as ComplexType))).toEqual(
                    MultiArray.linearize(ascending)
                        .map((value) => Complex.realToNumber(value as ComplexType))
                        .reverse(),
                );
            }
        } finally {
            Complex.engine = previous;
        }
    });

    test('exposes three outputs, empty shapes and a bounded supported domain', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('[V,D,T]=eig([2,1;1,2]);')).not.toThrow();
        expect(interpreter.Unparse(interpreter.Execute('T'))).toBe('[2,1;\n1,2]\n');
        interpreter.Execute('[V,D,T]=eig(7);');
        expect(interpreter.Unparse(interpreter.Execute('[V,D,T]'))).toBe('[1,7,7]\n');
        expect((interpreter.Execute('eig([])').list[0] as MultiArray).dimension).toEqual([0, 1]);
        interpreter.Execute('[V,D,T]=eig([]);');
        for (const name of ['V', 'D', 'T']) expect((interpreter.Execute(name).list[0] as MultiArray).dimension).toEqual([0, 0]);
        for (const source of ['[0,-1;1,0]', '[1,i;i,2]', '[1,0;0,2+i]', '[1,1e-30;0,2]']) {
            expect(() => interpreter.Execute(`eig(${source})`)).toThrow('only symmetric or Hermitian');
        }
        for (const source of ['[Inf,0;0,1]', '[NaN,0;0,1]']) expect(() => interpreter.Execute(`eig(${source})`)).toThrow('finite');
        expect(() => interpreter.Execute('[a,b,c,d]=eig(1)')).toThrow();
    });
});
