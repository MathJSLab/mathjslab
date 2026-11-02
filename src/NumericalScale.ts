import { Complex, type ComplexType } from './Complex';
import { MultiArray } from './MultiArray';

/** Internal scaling before tolerance decisions and Gram products. */
export const normalizeNumericMatrix = (input: MultiArray): { matrix: MultiArray; scale: ComplexType } => {
    let scale = Complex.zero();
    for (const value of MultiArray.linearize(input)) {
        if (!Complex.isInstanceOf(value) || !Complex.realIsFinite(value) || !Complex.imagIsFinite(value)) {
            throw new EvalError('numeric decomposition: expected finite numeric matrix.');
        }
        for (const part of [Complex.real(value), Complex.imag(value)]) {
            const magnitude = Complex.realLessThan(part, 0) ? Complex.neg(part) : part;
            if (Complex.realGreaterThan(magnitude, scale.re)) scale = magnitude;
        }
    }
    if (Complex.realIsZero(scale)) scale = Complex.one();
    const matrix = new MultiArray(input.dimension);
    matrix.array = input.array.map((row) => row.map((value) => Complex.rdiv(value as ComplexType, scale)));
    MultiArray.setType(matrix);
    return { matrix, scale };
};
