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
    private static readonly elementWiseOperatorSymbols: Record<TBinaryOperationName, string> = {
        add: '+',
        sub: '-',
        mod: 'mod',
        rem: 'rem',
        mul: '.*',
        rdiv: './',
        ldiv: '.\\',
        power: '.^',
        lt: '<',
        le: '<=',
        eq: '==',
        ge: '>=',
        gt: '>',
        ne: '~=',
        and: '&',
        or: '|',
        xor: 'xor',
        minWise: 'min',
        maxWise: 'max',
    };

    private static readonly unaryOperatorSymbols: Record<TUnaryOperationLeftName, string> = {
        copy: '+',
        neg: '-',
        not: '~',
    };

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
        MathOperation.throwIfStructureBinaryOperand(MathOperation.elementWiseOperatorSymbols[op], left, right);
        MathOperation.throwIfCellBinaryOperand(MathOperation.elementWiseOperatorSymbols[op], left, right);
        if (op === 'lt' || op === 'le' || op === 'eq' || op === 'ge' || op === 'gt' || op === 'ne') {
            if (MathOperation.hasClassInstanceOperand(left) || MathOperation.hasClassInstanceOperand(right)) {
                return MathOperation.classInstanceRelationalOperation(op, left, right);
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
            throw new EvalError(`operator ${MathOperation.elementWiseOperatorSymbols[op]} is not defined for these operands.`);
        }
    };

    private static readonly hasStructureOperand = (value: MathObject): boolean => Structure.isInstanceOf(value) || (MultiArray.isInstanceOf(value) && Structure.isStructure(value));

    private static readonly hasCellOperand = (value: MathObject): boolean => MultiArray.isInstanceOf(value) && value.isCell;

    private static readonly throwIfCellBinaryOperand = (operator: string, left: MathObject, right: MathObject): void => {
        if (MathOperation.hasCellOperand(left) || MathOperation.hasCellOperand(right)) {
            throw new EvalError(`operator ${operator} is not defined for cell operands.`);
        }
    };

    private static readonly throwIfStructureBinaryOperand = (operator: string, left: MathObject, right: MathObject): void => {
        if (MathOperation.hasStructureOperand(left) || MathOperation.hasStructureOperand(right)) {
            throw new EvalError(`operator ${operator} is not defined for struct operands.`);
        }
    };

    private static readonly throwIfCellUnaryOperand = (operator: string, value: MathObject): void => {
        if (MathOperation.hasCellOperand(value)) {
            throw new EvalError(`operator ${operator} is not defined for cell operands.`);
        }
    };

    private static readonly throwIfStructureUnaryOperand = (operator: string, value: MathObject): void => {
        if (MathOperation.hasStructureOperand(value)) {
            throw new EvalError(`operator ${operator} is not defined for struct operands.`);
        }
    };

    private static readonly hasClassInstanceOperand = (value: MathObject): boolean =>
        ClassInstance.isInstanceOf(value) || (MultiArray.isInstanceOf(value) && MultiArray.linearize(value).some((element) => ClassInstance.isInstanceOf(element)));

    private static readonly handleComparisonOrder = new WeakMap<ClassInstance, number>();

    private static nextHandleComparisonOrder = 1;

    private static readonly handleOrder = (instance: ClassInstance): number => {
        let order = MathOperation.handleComparisonOrder.get(instance);
        if (typeof order === 'undefined') {
            order = MathOperation.nextHandleComparisonOrder++;
            MathOperation.handleComparisonOrder.set(instance, order);
        }
        return order;
    };

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

    private static readonly classInstanceRelationalOperation = (op: 'lt' | 'le' | 'eq' | 'ge' | 'gt' | 'ne', left: MathObject, right: MathObject): MathObject => {
        const compare = (leftValue: ElementType, rightValue: ElementType): ComplexType => {
            const leftIsClassInstance = ClassInstance.isInstanceOf(leftValue);
            const rightIsClassInstance = ClassInstance.isInstanceOf(rightValue);
            if (!leftIsClassInstance || !rightIsClassInstance) {
                return Complex.false();
            }
            if (!leftValue.classDefinition.isHandleClass() || !rightValue.classDefinition.isHandleClass()) {
                throw new EvalError(`binary operator '${op}' is not defined for value class operands.`);
            }
            if (leftValue.classDefinition.name !== rightValue.classDefinition.name) {
                return Complex.false();
            }
            const leftOrder = MathOperation.handleOrder(leftValue);
            const rightOrder = MathOperation.handleOrder(rightValue);
            const result =
                op === 'lt'
                    ? leftOrder < rightOrder
                    : op === 'le'
                      ? leftOrder <= rightOrder
                      : op === 'eq'
                        ? leftValue === rightValue
                        : op === 'ge'
                          ? leftOrder >= rightOrder
                          : op === 'gt'
                            ? leftOrder > rightOrder
                            : leftValue !== rightValue;
            return result ? Complex.true() : Complex.false();
        };
        const leftArray = MultiArray.scalarToMultiArray(left);
        const rightArray = MultiArray.scalarToMultiArray(right);
        const result = MultiArray.mapBroadcasted(leftArray, rightArray, `operator ${op}`, compare);
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
        MathOperation.throwIfStructureUnaryOperand(MathOperation.unaryOperatorSymbols[op], right);
        MathOperation.throwIfCellUnaryOperand(MathOperation.unaryOperatorSymbols[op], right);
        if (Complex.isInstanceOf(right)) {
            return Complex[op](right as ComplexType);
        } else if (MultiArray.isInstanceOf(right)) {
            return MultiArray.leftOperation(op, right as MultiArray);
        } else {
            throw new EvalError(`operator ${MathOperation.unaryOperatorSymbols[op]} is not defined for this operand.`);
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
        MathOperation.throwIfStructureBinaryOperand('*', left, right);
        MathOperation.throwIfCellBinaryOperand('*', left, right);
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
     *
     * Scalar cases use complex division directly. Matrix cases delegate to the
     * linear algebra layer so `A / B` follows the MATLAB/Octave identity
     * `((B') \ (A'))'`.
     *
     * @param left Numerator value.
     * @param right Denominator value.
     * @returns Scalar or matrix right-division result.
     */
    public static readonly mrdivide: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        MathOperation.throwIfStructureBinaryOperand('/', left, right);
        MathOperation.throwIfCellBinaryOperand('/', left, right);
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
     *
     * @param left Denominator value.
     * @param right Numerator value.
     * @returns Element-wise left-division result.
     */
    public static readonly ldivide: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => MathOperation.elementWiseOperation('ldiv', left, right);

    /**
     * Matrix left division operator (`\`).
     *
     * Scalar cases use complex division directly. Matrix cases delegate to the
     * linear algebra layer, which chooses the square solve or least-squares
     * path according to the operand shapes.
     *
     * @param left Coefficient matrix or scalar denominator.
     * @param right Right-hand side matrix or scalar numerator.
     * @returns Scalar or matrix left-division result.
     */
    public static readonly mldivide: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        MathOperation.throwIfStructureBinaryOperand('\\', left, right);
        MathOperation.throwIfCellBinaryOperand('\\', left, right);
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
        MathOperation.throwIfStructureBinaryOperand('^', left, right);
        MathOperation.throwIfCellBinaryOperand('^', left, right);
        const leftScalar = MathOperation.numericScalarValue(left);
        const rightScalar = MathOperation.numericScalarValue(right);
        if (leftScalar && rightScalar) {
            return Complex.power(leftScalar, rightScalar);
        } else if (MultiArray.isInstanceOf(left) && rightScalar) {
            return LinearAlgebra.power(left as MultiArray, rightScalar);
        } else if (leftScalar && MultiArray.isInstanceOf(right)) {
            return LinearAlgebra.scalarPower(leftScalar, right as MultiArray);
        } else {
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
            left = MultiArray.characterVectorFromCharString(left as CharString);
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
            left = MultiArray.characterVectorFromCharString(left as CharString);
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
     * Scalar logical `&&` helper.
     *
     * Public expression evaluation short-circuits before this helper is called.
     * When it is reached directly, both operands are reduced with the
     * MATLAB/Octave condition rule: non-empty and all elements logically true.
     *
     * @param left Left logical operand.
     * @param right Right logical operand.
     * @returns Logical scalar result.
     */
    public static readonly mand: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        MathOperation.throwIfStructureBinaryOperand('&&', left, right);
        MathOperation.throwIfCellBinaryOperand('&&', left, right);
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.and(left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return Complex.and(left as ComplexType, MultiArray.toLogical(right as MultiArray));
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.and(MultiArray.toLogical(left as MultiArray), right as ComplexType);
        } else if (MultiArray.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return Complex.and(MultiArray.toLogical(left as MultiArray), MultiArray.toLogical(right as MultiArray));
        }
        throw new EvalError('operator && is not defined for these operands.');
    };

    /**
     * Scalar logical `||` helper.
     *
     * Public expression evaluation short-circuits before this helper is called.
     * When it is reached directly, both operands are reduced with the
     * MATLAB/Octave condition rule: non-empty and all elements logically true.
     *
     * @param left Left logical operand.
     * @param right Right logical operand.
     * @returns Logical scalar result.
     */
    public static readonly mor: BinaryMathOperation = (left: MathObject, right: MathObject): MathObject => {
        if (CharString.isInstanceOf(left)) {
            left = MultiArray.fromCharString(left as CharString);
        }
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        MathOperation.throwIfStructureBinaryOperand('||', left, right);
        MathOperation.throwIfCellBinaryOperand('||', left, right);
        if (Complex.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.or(left as ComplexType, right as ComplexType);
        } else if (Complex.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return Complex.or(left as ComplexType, MultiArray.toLogical(right as MultiArray));
        } else if (MultiArray.isInstanceOf(left) && Complex.isInstanceOf(right)) {
            return Complex.or(MultiArray.toLogical(left as MultiArray), right as ComplexType);
        } else if (MultiArray.isInstanceOf(left) && MultiArray.isInstanceOf(right)) {
            return Complex.or(MultiArray.toLogical(left as MultiArray), MultiArray.toLogical(right as MultiArray));
        }
        throw new EvalError('operator || is not defined for these operands.');
    };

    /**
     * Logical negation (`~` and Octave `!`) for numeric, logical, and
     * character-vector values.
     *
     * Structures, function handles, and other runtime-only objects are not
     * implicitly coerced here; MATLAB/Octave require logical operations to be
     * defined by the operand type itself.
     *
     * @param right Operand to negate.
     * @returns Element-wise logical negation of the operand.
     */
    public static readonly not: UnaryMathOperation = (right: MathObject): MathObject => {
        if (CharString.isInstanceOf(right)) {
            right = MultiArray.fromCharString(right as CharString);
        }
        MathOperation.throwIfStructureUnaryOperand(MathOperation.unaryOperatorSymbols.not, right);
        MathOperation.throwIfCellUnaryOperand(MathOperation.unaryOperatorSymbols.not, right);
        if (Complex.isInstanceOf(right)) {
            return Complex.not(right as ComplexType);
        } else if (MultiArray.isInstanceOf(right)) {
            return MultiArray.leftOperation('not', right as MultiArray);
        }
        throw new EvalError(`operator ${MathOperation.unaryOperatorSymbols.not} is not defined for this operand.`);
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
        lt: MathOperation.lt,
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
