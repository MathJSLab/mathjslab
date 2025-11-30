/**
 * Filename: `MathOperation.ts`
 * Description: Definitions of mathematical operations on elements of various
 * basic types.
 */

import { CharString } from './CharString';
import { Complex, ComplexType } from './Complex';
import type { TUnaryOperationLeftName, TBinaryOperationName } from './ComplexInterface';
import { type ElementType, MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';
import { Structure } from './Structure';
import { FunctionHandle } from './FunctionHandle';
import { BLAS } from './BLAS';

/**
 * Generic mathematical object.
 */
type MathObject = ElementType;

/**
 * Unary mathematical operations.
 */
type UnaryMathOperation = (expression: MathObject) => MathObject;

/**
 * Binary mathematical operations.
 */
type BinaryMathOperation = (left: MathObject, right: MathObject) => MathObject;

/**
 * Unary mathematical operations.
 */
type MathOperationType = UnaryMathOperation | BinaryMathOperation;

/**
 * Key of type of `MathOperation`. The keys of `MathOperation` class.
 */
type KeyOfTypeOfMathOperation = keyof typeof MathOperation;

/**
 * # `MathOperation`
 *
 * Mathematical operations on generic elements.
 *
 */
abstract class MathOperation {
    /**
     * Creates a copy of `MathObject` object.
     * @param right
     * @returns
     */
    public static readonly copy: UnaryMathOperation = (right: MathObject): MathObject => {
        if (Complex.isInstanceOf(right)) {
            return Complex.copy(right as ComplexType);
        } else if (MultiArray.isInstanceOf(right)) {
            return MultiArray.copy(right as MultiArray);
        } else if (CharString.isInstanceOf(right)) {
            return CharString.copy(right as CharString);
        } else if (Structure.isInstanceOf(right)) {
            return Structure.copy(right as Structure);
        } else {
            return FunctionHandle.copy(right as FunctionHandle);
        }
    };

    /**
     * Element-Wise operations.
     * @param op
     * @param left
     * @param right
     * @returns
     */
    private static readonly elementWiseOperation = (op: TBinaryOperationName, left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex[op](left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return MultiArray.scalarOpMultiArray(op, left as ComplexType, right as MultiArray);
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return MultiArray.MultiArrayOpScalar(op, left as MultiArray, right as ComplexType);
        } else if (MultiArray.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return MultiArray.elementWiseOperation(op, left as MultiArray, right as MultiArray);
        } else {
            throw new EvalError(`binary operator '${op}' not implemented for 'scalar struct' operands.`);
        }
    };

    /**
     * Left associative operations.
     * @param op
     * @param right
     * @returns
     */
    private static readonly leftOperation = (op: TUnaryOperationLeftName, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(right)) {
            return Complex[op](right as ComplexType);
        } else if (MultiArray.isInstanceOf(right)) {
            return MultiArray.leftOperation(op, right as MultiArray);
        } else {
            throw new EvalError(`unary operator '${op}' not implemented for 'scalar struct' operands.`);
        }
    };

    /**
     * Plus operation (`+`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly plus: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('add', left, right);

    /**
     * Minus operation (`-`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly minus: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('sub', left, right);

    /**
     * Mod operation.
     * @param left
     * @param right
     * @returns
     */
    public static readonly mod: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('mod', left, right);

    /**
     * Rem operation.
     * @param left
     * @param right
     * @returns
     */
    public static readonly rem: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('rem', left, right);

    /**
     * Times operation (`.*`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly times: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('mul', left, right);

    /**
     * Matrix multiplication operator (`*`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly mtimes: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.mul(left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return MultiArray.scalarOpMultiArray('mul', left as ComplexType, right as MultiArray);
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return MultiArray.MultiArrayOpScalar('mul', left as MultiArray, right as ComplexType);
        } else {
            // return BLAS.gemm(
            //     left as MultiArray,
            //     right as MultiArray
            // );
            const result = new MultiArray([(left as MultiArray).dimension[0], (right as MultiArray).dimension[1]]);
            BLAS.gemm(
                Complex.one(),
                (left as MultiArray).array as ComplexType[][],
                (left as MultiArray).dimension[0],
                (left as MultiArray).dimension[1],
                (right as MultiArray).array as ComplexType[][],
                (right as MultiArray).dimension[1],
                Complex.zero(),
                result.array as ComplexType[][],
            );
            return result;
        }
    };

    /**
     * Right division operator (`./`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly rdivide: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('rdiv', left, right);

    /**
     * Matrix right division operator (`/`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly mrdivide: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.rdiv(left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return MultiArray.scalarOpMultiArray('mul', left as ComplexType, LinearAlgebra.inv(right as MultiArray));
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return MultiArray.scalarOpMultiArray('mul', Complex.inv(right as ComplexType), left as MultiArray);
        } else {
            // return BLAS.gemm(left as MultiArray, LinearAlgebra.inv(right as MultiArray));
            const denom = LinearAlgebra.inv(right as MultiArray);
            const result = new MultiArray([(left as MultiArray).dimension[0], (denom as MultiArray).dimension[1]]);
            BLAS.gemm(
                Complex.one(),
                (left as MultiArray).array as ComplexType[][],
                (left as MultiArray).dimension[0],
                (left as MultiArray).dimension[1],
                (denom as MultiArray).array as ComplexType[][],
                (denom as MultiArray).dimension[1],
                Complex.zero(),
                result.array as ComplexType[][],
            );
            return result;
        }
    };

    /**
     * Left division operator (`.\`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly ldivide: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('ldiv', left, right);

    /**
     * Matrix left division operator (`\`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly mldivide: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        return Complex.one(); // TODO: implement left division.
    };

    /**
     * Power operator (`.^`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly power: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('power', left, right);

    /**
     * Matrix power operator (`^`).
     * @param left
     * @param right
     * @returns
     */
    public static readonly mpower: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.power(left as ComplexType, right as ComplexType);
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return LinearAlgebra.power(left as MultiArray, right as ComplexType);
        } else {
            // TODO: implement matrix power.
            throw new Error("invalid exponent in '^'.");
        }
    };

    /**
     *
     * @param right
     * @returns
     */
    public static readonly uplus: UnaryMathOperation = (right: MathObject): MathObject => MathOperation.leftOperation('copy', right);

    /**
     *
     * @param right
     * @returns
     */
    public static readonly uminus: UnaryMathOperation = (right: MathObject): MathObject => MathOperation.leftOperation('neg', right);

    /**
     *
     * @param left
     * @returns
     */
    public static readonly transpose: UnaryMathOperation = (left: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (MultiArray.isInstanceOf(left)) {
            return LinearAlgebra.transpose(left as MultiArray);
        } else {
            return left!.copy();
        }
    };

    /**
     *
     * @param left
     * @returns
     */
    public static readonly ctranspose: UnaryMathOperation = (left: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (Complex.isInstanceOf(left)) {
            return Complex.conj(left as ComplexType);
        } else if (MultiArray.isInstanceOf(left)) {
            return LinearAlgebra.ctranspose(left as MultiArray);
        } else {
            return left!.copy();
        }
    };

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly lt: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('lt', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly le: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('le', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly eq: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('eq', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly ge: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('ge', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly gt: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('gt', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly ne: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('ne', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly mand: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.and(left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return Complex.and(left as ComplexType, MultiArray.toLogical(right as MultiArray));
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.and(MultiArray.toLogical(left as MultiArray), right as ComplexType);
        } else {
            return Complex.and(MultiArray.toLogical(left as MultiArray), MultiArray.toLogical(right as MultiArray));
        }
    };

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly mor: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.or(left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return Complex.or(left as ComplexType, MultiArray.toLogical(right as MultiArray));
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.or(MultiArray.toLogical(left as MultiArray), right as ComplexType);
        } else {
            return Complex.or(MultiArray.toLogical(left as MultiArray), MultiArray.toLogical(right as MultiArray));
        }
    };

    /**
     *
     * @param right
     * @returns
     */
    public static readonly not: UnaryMathOperation = (right: MathObject): MathObject => {
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(right)) {
            return Complex.not(right as ComplexType);
        } else if (MultiArray.isInstanceOf(right)) {
            return Complex.not(MultiArray.toLogical(right as MultiArray));
        } else if (Structure.isInstanceOf(right)) {
            return Complex.not(Structure.toLogical(right as Structure));
        } else {
            return Complex.not(FunctionHandle.toLogical(right as FunctionHandle));
        }
    };

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly and: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('and', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly or: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('or', left, right);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly xor: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('xor', left, right);

    /**
     * Unary operations.
     */
    public static readonly unaryOperations: {
        [OP in KeyOfTypeOfMathOperation]?: UnaryMathOperation;
    } = {
        uplus: MathOperation.uplus,
        uminus: MathOperation.uminus,
        not: MathOperation.not,
        transpose: MathOperation.transpose,
        ctranspose: MathOperation.ctranspose,
    } satisfies Record<string, UnaryMathOperation>;

    /**
     * Binary operations
     */
    public static readonly binaryOperations: {
        [OP in KeyOfTypeOfMathOperation]?: BinaryMathOperation;
    } = {
        minus: MathOperation.minus,
        mod: MathOperation.mod,
        rem: MathOperation.rem,
        rdivide: MathOperation.rdivide,
        mrdivide: MathOperation.mrdivide,
        ldivide: MathOperation.ldivide,
        mldivide: MathOperation.mldivide,
        power: MathOperation.power,
        mpower: MathOperation.mpower,
        le: MathOperation.le,
        ge: MathOperation.ge,
        gt: MathOperation.gt,
        eq: MathOperation.eq,
        ne: MathOperation.ne,
    } satisfies Record<string, BinaryMathOperation>;

    /**
     * Left associative multiple arguments operations.
     */
    public static readonly leftAssociativeMultipleOperations: {
        [OP in KeyOfTypeOfMathOperation]?: BinaryMathOperation;
    } = {
        plus: MathOperation.plus,
        times: MathOperation.times,
        mtimes: MathOperation.mtimes,
        and: MathOperation.and,
        or: MathOperation.or,
        xor: MathOperation.xor,
    } satisfies Record<string, BinaryMathOperation>;
}

export type { MathObject, UnaryMathOperation, BinaryMathOperation, MathOperationType, KeyOfTypeOfMathOperation };
export { MathOperation };
export default { MathOperation };
