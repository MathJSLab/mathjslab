/**
 * Filename: `MathOperation.ts`
 * Description: Definitions of mathematical operations on elements of various
 * basic types.
 */

import { CharString } from './CharString';
import type { TUnaryOperationLeftName, TBinaryOperationName } from './ComplexInterface';
import { type ComplexType, Complex } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { FunctionHandle } from './FunctionHandle';
import { ClassInstance } from './ClassInstance';
import { LinearAlgebra } from './LinearAlgebra';
import { RuntimeValue } from './RuntimeValue';

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
 * Key of type `MathOperation`. Keys of the `MathOperation` class that are static methods.
 */
type KeyOfTypeOfMathOperation = Exclude<keyof typeof MathOperation, 'prototype' | 'unaryOperations' | 'binaryOperations' | 'leftAssociativeMultipleOperations'>;

/**
 * # `MathOperation`
 *
 * Mathematical operations on generic elements.
 *
 */
abstract class MathOperation {
    /**
     * Creates a copy of `MathObject` object.
     * @param value
     * @returns
     */
    public static readonly copy: UnaryMathOperation = (value: MathObject): MathObject => RuntimeValue.copy(value);

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
        if (op === 'eq' || op === 'ne') {
            if (MathOperation.hasClassInstanceOperand(left) || MathOperation.hasClassInstanceOperand(right)) {
                return MathOperation.classInstanceEqualityOperation(op, left, right);
            }
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

    private static readonly hasClassInstanceOperand = (value: MathObject): boolean =>
        ClassInstance.isInstanceOf(value) || (MultiArray.isInstanceOf(value) && MultiArray.linearize(value).some((element) => ClassInstance.isInstanceOf(element)));

    private static readonly numericScalarValue = (value: MathObject): ComplexType | undefined => {
        if (Complex.isInstanceOf(value)) {
            return value as ComplexType;
        }
        if (MultiArray.isInstanceOf(value) && RuntimeValue.isScalar(value)) {
            const element = MultiArray.firstElement(value as MultiArray);
            return Complex.isInstanceOf(element) ? (element as ComplexType) : undefined;
        }
        return undefined;
    };

    private static readonly classInstanceEqualityOperation = (op: 'eq' | 'ne', left: MathObject, right: MathObject): MathObject => {
        const compare = (leftValue: ElementType, rightValue: ElementType): ComplexType => {
            if (!ClassInstance.isInstanceOf(leftValue) || !ClassInstance.isInstanceOf(rightValue)) {
                throw new EvalError(`binary operator '${op}' is not defined for class instance operands.`);
            }
            if (!leftValue.classDefinition.isHandleClass() || !rightValue.classDefinition.isHandleClass()) {
                throw new EvalError(`binary operator '${op}' is not defined for value class operands.`);
            }
            const same = leftValue === rightValue;
            return (op === 'eq' ? same : !same) ? Complex.true() : Complex.false();
        };
        const leftArray = MultiArray.scalarToMultiArray(left);
        const rightArray = MultiArray.scalarToMultiArray(right);
        const leftDim = leftArray.dimension.slice();
        const rightDim = rightArray.dimension.slice();
        const maxDim = Math.max(leftDim.length, rightDim.length);
        while (leftDim.length < maxDim) leftDim.push(1);
        while (rightDim.length < maxDim) rightDim.push(1);
        const resultDim = new Array<number>(maxDim);
        const leftBroadcast = new Array<boolean>(maxDim);
        const rightBroadcast = new Array<boolean>(maxDim);
        for (let i = 0; i < maxDim; i++) {
            if (leftDim[i] === rightDim[i]) {
                resultDim[i] = leftDim[i];
                leftBroadcast[i] = rightBroadcast[i] = false;
            } else if (leftDim[i] === 1) {
                resultDim[i] = rightDim[i];
                leftBroadcast[i] = true;
                rightBroadcast[i] = false;
            } else if (rightDim[i] === 1) {
                resultDim[i] = leftDim[i];
                leftBroadcast[i] = false;
                rightBroadcast[i] = true;
            } else {
                throw new EvalError(`operator ${op}: nonconformant arguments (op1 is ${leftDim.join('x')}, op2 is ${rightDim.join('x')}).`);
            }
        }
        const leftStrides = MultiArray.computeStrides(leftDim);
        const rightStrides = MultiArray.computeStrides(rightDim);
        const resultStrides = MultiArray.computeStrides(resultDim);
        const result = new MultiArray(resultDim);
        const totalElements = resultDim.reduce((a, b) => a * b, 1);
        for (let n = 0; n < totalElements; n++) {
            let leftIndexLinear = 0;
            let rightIndexLinear = 0;
            for (let d = 0; d < maxDim; d++) {
                const coord = Math.floor(n / resultStrides[d]) % resultDim[d];
                leftIndexLinear += (leftBroadcast[d] ? 0 : coord) * leftStrides[d];
                rightIndexLinear += (rightBroadcast[d] ? 0 : coord) * rightStrides[d];
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(leftDim[0], leftDim[1], leftIndexLinear);
            const [k, l] = MultiArray.linearIndexToMultiArrayRowColumn(rightDim[0], rightDim[1], rightIndexLinear);
            const [o, p] = MultiArray.linearIndexToMultiArrayRowColumn(resultDim[0], resultDim[1], n);
            result.array[o][p] = compare(leftArray.array[i][j], rightArray.array[k][l]);
        }
        result.type = Complex.LOGICAL;
        return MultiArray.MultiArrayToScalar(result) as MathObject;
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
            return LinearAlgebra.mul(left as MultiArray, right as MultiArray);
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
            return LinearAlgebra.mrdivide(left as MultiArray, right as MultiArray);
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
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.ldiv(left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return MultiArray.scalarOpMultiArray('ldiv', left as ComplexType, right as MultiArray);
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            throw new EvalError(`operator \\: nonconformant arguments (op1 is ${left.dimension.join('x')}, op2 is 1x1).`);
        } else {
            return LinearAlgebra.mldivide(left as MultiArray, right as MultiArray);
        }
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
        const leftScalar = MathOperation.numericScalarValue(left);
        const rightScalar = MathOperation.numericScalarValue(right);
        if (leftScalar && rightScalar) {
            return Complex.power(leftScalar, rightScalar);
        } else if (MultiArray.isInstanceOf(left) && rightScalar) {
            return LinearAlgebra.power(left as MultiArray, rightScalar);
        } else if (leftScalar && MultiArray.isInstanceOf(right)) {
            return LinearAlgebra.scalarPower(leftScalar, right as MultiArray);
        } else {
            // TODO: implement general matrix exponent operands.
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
            return RuntimeValue.copy(left);
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
            return RuntimeValue.copy(left);
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
