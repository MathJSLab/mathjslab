import { type BuiltInFunctionParameter, type BuiltInFunctionSignature, type FunctionSignatureEntry } from './AST';
import { Complex, type ComplexType } from './Complex';
import { MultiArray, type ElementType } from './MultiArray';

/** Ordered trapezoidal integration over native numeric slices. */
export class SampledIntegration {
    /** Normalizes samples or coordinates and rejects cell and nonnumeric arrays. */
    private static array(value: ElementType, name: string): MultiArray {
        if (!Complex.isInstanceOf(value) && !MultiArray.isInstanceOf(value)) throw new EvalError(`${name}: expected numeric input.`);
        const array = MultiArray.scalarToMultiArray(value);
        if (array.isCell || MultiArray.linearize(array).some((item) => !Complex.isInstanceOf(item))) throw new EvalError(`${name}: expected numeric input.`);
        return array;
    }

    /** Shares axis selection, spacing validation and ordered accumulation between trapz and cumtrapz. */
    private static integrate(cumulative: boolean, args: ElementType[]): ElementType {
        const name = cumulative ? 'cumtrapz' : 'trapz';
        let y = SampledIntegration.array(args[0], name);
        const second = args.length > 1 ? SampledIntegration.array(args[1], name) : undefined;
        let x: MultiArray | undefined;
        let dimension: ElementType;
        if (args.length === 3 || (args.length === 2 && (MultiArray.linearLength(y) === 1 || MultiArray.linearLength(second!) !== 1))) {
            x = y;
            y = second!;
            dimension = args[2];
        } else dimension = args[1];
        let axis = Math.max(
            0,
            y.dimension.findIndex((size) => size !== 1),
        );
        if (dimension !== undefined) {
            if (MultiArray.isInstanceOf(dimension) && MultiArray.linearLength(dimension) === 1) dimension = MultiArray.firstElement(dimension);
            if (
                !Complex.isInstanceOf(dimension) ||
                !Complex.imagIsZero(dimension) ||
                !Complex.realIsInteger(dimension) ||
                !Complex.realGreaterThan(dimension, 0) ||
                !Complex.realLessThanOrEqualTo(dimension, y.dimension.length)
            ) {
                throw new EvalError(`${name}: dimension must be an integer between 1 and ndims(Y).`);
            }
            axis = Complex.realToNumber(dimension) - 1;
        }
        const length = y.dimension[axis];
        let coordinates: ComplexType[] | undefined;
        let spacing = Complex.one();
        if (x) {
            const values = MultiArray.linearize(x) as ComplexType[];
            if (values.some((value) => !Complex.imagIsZero(value) || !Complex.realIsFinite(value))) throw new EvalError(`${name}: coordinates must be finite and real.`);
            if (values.length === 1) spacing = values[0];
            else {
                if (values.length !== length || (values.length > 0 && (x.dimension.length !== 2 || !x.dimension.includes(1))))
                    throw new EvalError(`${name}: coordinate vector length must match size(Y,dim).`);
                coordinates = values;
            }
        }
        const shape = y.dimension.slice();
        if (!cumulative) shape[axis] = 1;
        const output = new MultiArray(shape, Complex.zero());
        const lineShape = y.dimension.slice();
        lineShape[axis] = 1;
        for (let line = 0; line < lineShape.reduce((a, b) => a * b, 1); line++) {
            const subscript = MultiArray.linearIndexToSubscript(lineShape, line);
            let total = Complex.zero();
            for (let k = 1; k < length; k++) {
                subscript[axis] = k;
                const [pi, pj] = MultiArray.subscriptToMultiArrayRowColumn(y.dimension, subscript);
                subscript[axis] = k + 1;
                const [ci, cj] = MultiArray.subscriptToMultiArrayRowColumn(y.dimension, subscript);
                const width = coordinates ? Complex.sub(coordinates[k], coordinates[k - 1]) : spacing;
                // Divide endpoints before addition: avoid avoidable overflow for finite samples.
                const midpoint = Complex.add(Complex.rdiv(y.array[pi][pj] as ComplexType, Complex.two()), Complex.rdiv(y.array[ci][cj] as ComplexType, Complex.two()));
                total = Complex.add(total, Complex.mul(width, midpoint));
                if (cumulative) {
                    const [oi, oj] = MultiArray.subscriptToMultiArrayRowColumn(shape, subscript);
                    output.array[oi][oj] = total;
                }
            }
            if (!cumulative) {
                subscript[axis] = 1;
                const [oi, oj] = MultiArray.subscriptToMultiArrayRowColumn(shape, subscript);
                output.array[oi][oj] = total;
            }
        }
        MultiArray.setType(output);
        return MultiArray.MultiArrayToScalar(output);
    }

    private static readonly numericParameter: BuiltInFunctionParameter = { name: 'value', classes: ['double', 'logical'], validators: ['numericOrLogical'] };
    public static readonly signature: BuiltInFunctionSignature = {
        inputs: [1, 2, 3].map((arity) => ({ arity, parameters: Array.from({ length: arity }, () => SampledIntegration.numericParameter) })),
        outputs: { arity: 1 },
    };
    /** Integrates sampled data along one axis with unit spacing, scalar spacing or explicit coordinates. */
    public static readonly trapz = (...args: ElementType[]): ElementType => SampledIntegration.integrate(false, args);
    /** Returns cumulative trapezoidal integrals with a leading zero along the selected axis. */
    public static readonly cumtrapz = (...args: ElementType[]): ElementType => SampledIntegration.integrate(true, args);
    public static readonly functions: Record<string, FunctionSignatureEntry> = {
        trapz: { func: SampledIntegration.trapz, signature: SampledIntegration.signature },
        cumtrapz: { func: SampledIntegration.cumtrapz, signature: SampledIntegration.signature },
    };
}
