import { type BuiltInFunctionParameter, type BuiltInFunctionSignature, type FunctionSignatureEntry } from './AST';
import { Complex, type ComplexType } from './Complex';
import { CharString } from './CharString';
import { MultiArray, type ElementType } from './MultiArray';

/** Polynomial coefficient and discrete convolution operations, without numeric downcasts. */
export class PolynomialFunctions {
    /** Normalizes scalar/array inputs and rejects cells, nonnumeric elements and unsupported vector shapes. */
    private static numeric(value: ElementType, name: string, vector = false): MultiArray {
        if (!Complex.isInstanceOf(value) && !MultiArray.isInstanceOf(value)) throw new EvalError(`${name}: expected numeric input.`);
        const array = MultiArray.scalarToMultiArray(value);
        if (
            array.isCell ||
            (vector && MultiArray.linearLength(array) > 0 && (array.dimension.length !== 2 || !array.dimension.includes(1))) ||
            MultiArray.linearize(array).some((item) => !Complex.isInstanceOf(item))
        ) {
            throw new EvalError(`${name}: expected ${vector ? 'numeric vector' : 'numeric input'}.`);
        }
        return array;
    }

    /** Evaluates descending-power coefficients by Horner arithmetic while preserving the shape of the points. */
    public static polyval = (coefficients: ElementType, points: ElementType): ElementType => {
        const p = MultiArray.linearize(PolynomialFunctions.numeric(coefficients, 'polyval', true)) as ComplexType[];
        const x = PolynomialFunctions.numeric(points, 'polyval');
        const result = new MultiArray(x.dimension);
        result.array = x.array.map((row) =>
            row.map((value) => {
                // Start with the leading coefficient: a constant stays constant even at Inf/NaN.
                let evaluated = p.length ? Complex.copy(p[0]) : Complex.zero();
                for (let k = 1; k < p.length; k++) evaluated = Complex.add(Complex.mul(evaluated, value as ComplexType), p[k]);
                return evaluated;
            }),
        );
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    };

    /** Single-polynomial derivative; product/quotient forms are explicitly outside this subset. */
    public static polyder = (coefficients: ElementType): ElementType => {
        const p = MultiArray.linearize(PolynomialFunctions.numeric(coefficients, 'polyder', true)) as ComplexType[];
        const derivative = p.slice(0, -1).map((value, index) => Complex.mul(value, Complex.create(p.length - index - 1)));
        while (derivative.length > 1 && Complex.realIsZero(derivative[0]) && Complex.imagIsZero(derivative[0])) derivative.shift();
        return derivative.length ? MultiArray.MultiArrayToScalar(MultiArray.toRowVector(derivative)) : Complex.zero();
    };

    /** Direct convolution, accumulated in increasing left-coefficient order. */
    public static conv = (left: ElementType, right: ElementType, shape?: ElementType): ElementType => {
        const a = PolynomialFunctions.numeric(left, 'conv', true);
        const b = PolynomialFunctions.numeric(right, 'conv', true);
        if (shape !== undefined && (!CharString.isInstanceOf(shape) || !['full', 'same', 'valid'].includes(shape.str))) throw new EvalError('conv: shape must be full, same or valid.');
        const mode = CharString.isInstanceOf(shape) ? shape.str : 'full';
        const av = MultiArray.linearize(a) as ComplexType[];
        const bv = MultiArray.linearize(b) as ComplexType[];
        const fullLength = av.length && bv.length ? av.length + bv.length - 1 : 0;
        const start = mode === 'same' ? Math.floor(bv.length / 2) : mode === 'valid' ? Math.max(0, bv.length - 1) : 0;
        const count = mode === 'same' ? av.length : mode === 'valid' ? (bv.length ? Math.max(av.length - bv.length + 1, 0) : av.length) : fullLength;
        // MATLAB R2026a full-orientation policy; cropped forms follow u.
        const row = mode === 'full' ? !(a.dimension[1] === 1 && b.dimension[1] === 1) : a.dimension[0] === 1;
        const result = new MultiArray(row ? [1, count] : [count, 1]);
        for (let k = 0; k < count; k++) {
            const index = start + k;
            let total = Complex.zero();
            for (let j = Math.max(0, index - bv.length + 1); j <= Math.min(av.length - 1, index); j++) total = Complex.add(total, Complex.mul(av[j], bv[index - j]));
            if (row) result.array[0][k] = total;
            else result.array[k][0] = total;
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    };

    private static readonly numericParameter: BuiltInFunctionParameter = { name: 'value', classes: ['double', 'logical'], validators: ['numericOrLogical'] };
    public static readonly polyvalSignature: BuiltInFunctionSignature = {
        inputs: { arity: 2, parameters: [PolynomialFunctions.numericParameter, PolynomialFunctions.numericParameter] },
        outputs: { arity: 1 },
    };
    public static readonly polyderSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [PolynomialFunctions.numericParameter] }, outputs: { arity: 1 } };
    public static readonly convSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 2, parameters: [PolynomialFunctions.numericParameter, PolynomialFunctions.numericParameter] },
            { arity: 3, parameters: [PolynomialFunctions.numericParameter, PolynomialFunctions.numericParameter, { name: 'shape', classes: ['char', 'string'] }] },
        ],
        outputs: { arity: 1 },
    };
    public static readonly functions: Record<string, FunctionSignatureEntry> = {
        polyval: { func: PolynomialFunctions.polyval, signature: PolynomialFunctions.polyvalSignature },
        polyder: { func: PolynomialFunctions.polyder, signature: PolynomialFunctions.polyderSignature },
        conv: { func: PolynomialFunctions.conv, signature: PolynomialFunctions.convSignature },
    };
}
