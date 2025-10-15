/**
 * Filename: `ComplexInterface.ts`
 * Description: Definitions for a complex number library based on a facade
 * architecture and method factories.
 * References:
 * * https://mathworld.wolfram.com/ComplexNumber.html
 */

import { Evaluator } from './Evaluator';

export type Rounding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type RoundingName = 'up' | 'down' | 'ceil' | 'floor' | 'half_up' | 'half_down' | 'half_even' | 'half_ceil' | 'half_floor';

export type Modulo = Rounding | 9;

export type ModuloName = 'up' | 'down' | 'floor' | 'half_even' | 'euclid';

/**
 * `Complex` backend engine configuration.
 */
export interface ComplexConfig<ROUNDING = Rounding, MODULO = Modulo> {
    /**
     * The maximum number of significant digits of the result of an operation.
     * Values equal to or greater than 336 is used to produce correct rounding of
     * trigonometric, hyperbolic and exponential functions.
     */
    precision: number;
    /**
     * Number of significant digits to reduce precision before compare operations and
     * unparse.
     */
    precisionCompare: number;
    /**
     * The default rounding mode used when rounding the result of an operation to
     * precision significant digits.
     */
    rounding: ROUNDING;
    /**
     * The positive exponent value at and above which unparse returns exponential
     * notation.
     */
    toExpPos: number;
    /**
     * The negative exponent limit, i.e. the exponent value below which underflow
     * to zero occurs.
     */
    minE: number;
    /**
     * The positive exponent limit, i.e. the exponent value above which overflow
     * to Infinity occurs.
     */
    maxE: number;
    /**
     * The negative exponent value at and below which unparse returns exponential
     * notation.
     */
    toExpNeg: number;
    /**
     * The modulo mode used when calculating the modulus: a mod n.
     */
    modulo: MODULO;
    /**
     * The value that determines whether cryptographically-secure
     * pseudo-random number generation is used.
     */
    crypto: boolean;
}

/**
 * Key of ComplexInterfaceStatic type.
 */
export type ComplexConfigKey = keyof ComplexConfig;
export { ComplexConfigKeyTable } from './ComplexConfigKeyTable';

export type NumLike<REAL = number> = string | number | bigint | REAL;
export type NumType<TYPE = number> = TYPE;
export type NumParent<PARENT = unknown> = PARENT;

export interface ComplexInterface<REAL, TYPE = number, PARENT = unknown> {
    /**
     * Real, imaginary, `type` and `parent` properties.
     */
    re: REAL;
    im: REAL;
    type: TYPE;
    parent: PARENT;
    /**
     * Instance methods.
     */
    unparse(): string;
    copy(): ComplexInterface<REAL, TYPE, PARENT>;
    toLogical(): ComplexInterface<REAL, TYPE, PARENT>;
}

/**
 * Key of ComplexInterface type.
 */
export type ComplexInterfaceKey = keyof ComplexInterface<any, any>;
export { ComplexInterfaceKeyTable } from './ComplexInterfaceKeyTable';

export type OmitComplexInterfaceDynamic<REAL, TYPE, PARENT> = Omit<ComplexInterface<REAL, TYPE, PARENT>, ComplexInterfaceKey>;

export type ComplexLike<REAL, TYPE = number, PARENT = unknown> = {
    re?: NumLike<REAL>;
    im?: NumLike<REAL>;
    type?: NumType<TYPE>;
    parent?: NumParent<PARENT>;
};

export type TCompareOperationName = 'lt' | 'lte' | 'eq' | 'gt' | 'gte';
export type TMinMaxCompareOperationName = 'lt' | 'gte';
export type TMinMaxArrayCompareOperationName = 'lt' | 'gt';
export type ComplexHandlerType<REAL, COMPLEX extends ComplexInterface<REAL>> = COMPLEX;
export type IsInstanceOfComplexHandler = (value: unknown) => boolean;
export type SetComplexHandler = (config: Partial<ComplexConfig>) => void;
export type SetNumberTypeComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (value: COMPLEX) => void;
export type CreateComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>, TYPE = number, PARENT = unknown> = (
    re?: NumLike<REAL>,
    im?: NumLike<REAL>,
    type?: NumType<TYPE>,
    parent?: NumParent<PARENT>,
) => COMPLEX;
export type PartSetComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (value: COMPLEX, n: NumLike<REAL>) => void;
export type PartApplyComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (value: COMPLEX, func: (re: REAL) => REAL) => void;
export type PartApplyComplexHandlerTable<REAL> = Record<TApplyName, (n: REAL) => REAL>;
export type OneArgValueComplexHandler<REAL> = (value: REAL) => REAL;
export type FromComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (obj: Partial<COMPLEX>) => COMPLEX;
export type NoArgComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = () => COMPLEX;
export type OneArgComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (z: COMPLEX) => COMPLEX;
export type OneOptNumArgComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (significantDigits?: number) => COMPLEX;
export type OneArgNoReturnComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (z: COMPLEX) => void;
export type MapComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = OneArgComplexHandler<REAL, COMPLEX>;
export type TwoArgComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (x: COMPLEX, y: COMPLEX) => COMPLEX;
export type OneArgReturnBooleanComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (z: COMPLEX) => boolean;
export type OneArgReturnNumberComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (z: COMPLEX) => number;
export type TestNumLikeComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (z: COMPLEX, value: NumLike<REAL>) => boolean;
export type CompareValueComplexHandler<REAL> = (cmp: TCompareOperationName, left: REAL, right: REAL) => boolean;
export type CmpComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (cmp: TCompareOperationName, left: COMPLEX, right: COMPLEX) => COMPLEX;
export type ParseComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (value: string) => COMPLEX;
export type UnparseValueComplexHandler<REAL> = (value: REAL) => string;
export type UnparseComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>, PRECEDENCE = number> = (value: COMPLEX, parentPrecedence: PRECEDENCE) => string;
export type PrecedenceComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>, EVALUATOR, PRECEDENCE = number> = (value: COMPLEX, evaluator: EVALUATOR) => PRECEDENCE;
export type UnparseMathMLComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>, EVALUATOR, PRECEDENCE = number> = (
    value: COMPLEX,
    evaluator: EVALUATOR,
    parentPrecedence: PRECEDENCE,
) => string;
export type RandomComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (significantDigits?: number) => COMPLEX;
export type CompareComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (cmp: TCompareOperationName, left: COMPLEX, right: COMPLEX) => COMPLEX;
export type MinMaxArrayComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => COMPLEX;
export type MinMaxArrayWithIndexComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => [COMPLEX, number];
export type AbsoluteValueComplexHandler<REAL, COMPLEX extends ComplexInterface<REAL>> = (z: COMPLEX) => REAL;
/**
 * Binary operations name type.
 */
export type TBinaryOperationName = 'add' | 'sub' | 'mul' | 'rdiv' | 'ldiv' | 'power' | 'lt' | 'le' | 'eq' | 'ge' | 'gt' | 'ne' | 'and' | 'or' | 'xor' | 'mod' | 'rem' | 'minWise' | 'maxWise';

/**
 * Unary operations name type.
 */
export type TUnaryOperationLeftName = 'copy' | 'neg' | 'not';

export type TApplyName = 'fix' | 'ceil' | 'floor' | 'round' | 'sign' | 'trunc';

export interface RealInterfaceStatic<REAL> {
    create(x: REAL | number | string): REAL;
    add(a: REAL, b: REAL): REAL;
    sub(a: REAL, b: REAL): REAL;
    neg(x: REAL): REAL;
    mul(a: REAL, b: REAL): REAL;
    pow(a: REAL, b: REAL): REAL;
    div(a: REAL, b: REAL): REAL;
    mod(a: REAL, b: REAL): REAL;
    sqrt(x: REAL): REAL;
    trunc(x: REAL): REAL;
    ceil(x: REAL): REAL;
    floor(x: REAL): REAL;
    round(x: REAL): REAL;
    sign(x: REAL): REAL;
    exp(x: REAL): REAL;
    ln(x: REAL): REAL;
    abs(x: REAL): REAL;
    abs(x: REAL): REAL;
    sin(x: REAL): REAL;
    cos(x: REAL): REAL;
    atan2(x: REAL, y: REAL): REAL;
    sinh(x: REAL): REAL;
    cosh(x: REAL): REAL;
    MINUSONE: REAL;
    ZERO: REAL;
    TWO: REAL;
    PI: REAL;
    PI_DEG: REAL;
    INF: REAL;
    unparse(value: REAL): string;
    isNeg(x: REAL): boolean;
    isZero(x: REAL): boolean;
    isNaN(x: REAL): boolean;
    isFinite(x: REAL): boolean;
}

export interface ComplexInterfaceStatic<
    REAL,
    COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>,
    TYPE = number,
    PARENT = unknown,
    PRECEDENCE = number,
    ROUNDING = Rounding,
    MODULO = Modulo,
> {
    /**
     * COMPLEX most restricted number class.
     */
    readonly LOGICAL: TYPE;
    readonly REAL: TYPE;
    readonly COMPLEX: TYPE;
    /**
     * COMPLEX engine default settings.
     */
    readonly defaultSettings: ComplexConfig<ROUNDING, MODULO>;
    /**
     * COMPLEX engine current settings.
     */
    readonly settings: ComplexConfig<ROUNDING, MODULO>;
    /**
     * COMPLEX constructor
     * @param re Real part (optional).
     * @param im Imaginary part (optional).
     * @param type Class 'complex' | 'logical' (optional).
     * @param parent
     */
    new (re?: NumLike<REAL>, im?: NumLike<REAL>, type?: NumType<TYPE>, parent?: NumParent<PARENT>): COMPLEX;
    /**
     * Test if `value` is instance of COMPLEX.
     * @param value Value to test.
     * @returns `true` if value is instance of COMPLEX. `false` otherwise.
     */
    readonly isInstanceOf: (value: unknown) => boolean;
    /**
     * `COMPLEX` engine setup.
     * @param config `Object` with `COMPLEX` engine configurations
     * parameters:
     * - `precision`: Number of significant digits to reduce precision before
     * compare operations and unparse.
     * - `rounding`: The default rounding mode used when rounding the result
     * of an operation to precision significant digits.
     * - `toExpPos`: The positive exponent value at and above which unparse
     * returns exponential notation.
     * - `toExpNeg`: The negative exponent limit, i.e. the exponent value
     * below which underflow to zero occurs.
     * - `minE`: The positive exponent limit, i.e. the exponent value above
     * which overflow to Infinity occurs.
     * - `maxE`: The negative exponent value at and below which unparse
     * returns exponential notation.
     * - `modulo`: The modulo mode used when calculating the modulus: a mod n.
     * - `crypto`: The value that determines whether cryptographically-secure
     * pseudo-random number generation is used.
     */
    readonly set: (config: Partial<ComplexConfig<ROUNDING, MODULO>>) => void;
    /**
     * Set number type (`ctor.LOGICAL`, `ctor.REAL` or `ctor.COMPLEX`).
     * @param value number type.
     */
    readonly setNumberType: (value: COMPLEX) => void;
    readonly create: (re?: NumLike<REAL>, im?: NumLike<REAL>, type?: NumType<TYPE>, parent?: NumParent<PARENT>) => COMPLEX;
    /**
     * Sets the real part of the `COMPLEX`.
     * @param value
     * @param re
     */
    readonly realSet: (value: COMPLEX, re: NumLike<REAL>) => void;
    /**
     * Sets the imaginary part of the `COMPLEX`.
     * @param value
     * @param re
     */
    readonly imagSet: (value: COMPLEX, im: NumLike<REAL>) => void;
    /**
     * Sets the real part of the `COMPLEX` by applying a function to the
     * original value.
     * @param value
     * @param im
     */
    readonly realApply: (value: COMPLEX, func: (re: REAL) => REAL) => void;
    /**
     * Sets the imaginary part of the `COMPLEX` by applying a function to
     * the original value.
     * @param value
     * @param im
     */
    readonly imagApply: (value: COMPLEX, func: (im: REAL) => REAL) => void;
    /**
     * Creates a `COMPLEX` from another.
     * @param obj Original `COMPLEX`.
     * @returns A new `COMPLEX`.
     */
    readonly from: (obj: COMPLEX) => COMPLEX;
    /**
     * Real part of complex number.
     * @param z value.
     * @returns Real part of z
     */
    readonly real: (z: COMPLEX) => COMPLEX;
    /**
     * Imaginary part of complex number.
     * @param z value.
     * @returns Imaginary part of z
     */
    readonly imag: (z: COMPLEX) => COMPLEX;
    /**
     * Tests whether the real part is an integer.
     * @param z `COMPLEX` to test.
     * @returns `true` if the real part is an integer. `false` otherwise.
     */
    readonly realIsInteger: (z: COMPLEX) => boolean;
    /**
     * Tests whether the imaginary part is an integer.
     * @param z `COMPLEX` to test.
     * @returns `true` if the imaginary part is an integer. `false` otherwise.
     */
    readonly imagIsInteger: (z: COMPLEX) => boolean;
    /**
     * Tests whether the real part is finite.
     * @param z `COMPLEX` to test.
     * @returns `true` if the real part is finite. `false` otherwise.
     */
    readonly realIsFinite: (z: COMPLEX) => boolean;
    /**
     * Tests whether the imaginary part is finite.
     * @param z `COMPLEX` to test.
     * @returns `true` if the imaginary part is finite. `false` otherwise.
     */
    readonly imagIsFinite: (z: COMPLEX) => boolean;
    /**
     * Tests whether the real part is `NaN`.
     * @param z `COMPLEX` to test.
     * @returns `true` if the real part is `NaN`. `false` otherwise.
     */
    readonly realIsNaN: (z: COMPLEX) => boolean;
    /**
     * Tests whether the imaginary part is `NaN`.
     * @param z `COMPLEX` to test.
     * @returns `true` if the imaginary part is `NaN`. `false` otherwise.
     */
    readonly imagIsNaN: (z: COMPLEX) => boolean;
    /**
     * Tests whether the real part is negative.
     * @param z `COMPLEX` to test.
     * @returns `true` if the real part is negative. `false` otherwise.
     */
    readonly realIsNegative: (z: COMPLEX) => boolean;
    /**
     * Tests whether the imaginary part is negative.
     * @param z `COMPLEX` to test.
     * @returns `true` if the imaginary part is negative. `false` otherwise.
     */
    readonly imagIsNegative: (z: COMPLEX) => boolean;
    /**
     * Tests whether the real part is zero.
     * @param z `COMPLEX` to test.
     * @returns `true` if the real part is zero. `false` otherwise.
     */
    readonly realIsZero: (z: COMPLEX) => boolean;
    /**
     * Tests whether the imaginary part is zero.
     * @param z `COMPLEX` to test.
     * @returns `true` if the imaginary part is zero. `false` otherwise.
     */
    readonly imagIsZero: (z: COMPLEX) => boolean;
    /**
     * Tests whether the real part is positive.
     * @param z `COMPLEX` to test.
     * @returns `true` if the real part is positive. `false` otherwise.
     */
    readonly realIsPositive: (z: COMPLEX) => boolean;
    /**
     * Tests whether the imaginary part is positive.
     * @param z `COMPLEX` to test.
     * @returns `true` if the imaginary part is positive. `false` otherwise.
     */
    readonly imagIsPositive: (z: COMPLEX) => boolean;
    /**
     * Converts the real part to type `number`.
     * @param z `COMPLEX` value to convert real part.
     * @returns Real part of `COMPLEX` value coverted to `number`.
     */
    readonly realToNumber: (z: COMPLEX) => number;
    /**
     * Converts the imaginary part to type `number`.
     * @param z `COMPLEX` value to convert imaginary part.
     * @returns Imaginary part of `COMPLEX` value coverted to `number`.
     */
    readonly imagToNumber: (z: COMPLEX) => number;
    /**
     * Tests whether the real part is less than a value.
     * @param z `COMPLEX` to test real part.
     * @param value `REAL` value to compare with real part.
     * @returns `true` if real part is less than value. `false` otherwise.
     */
    readonly realLessThan: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the imaginary part is less than a value.
     * @param z `COMPLEX` to test imaginary part.
     * @param value `REAL` value to compare with imaginary part.
     * @returns `true` if imaginary part is less than value. `false` otherwise.
     */
    readonly imagLessThan: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the real part is less than or equals a value.
     * @param z `COMPLEX` to test real part.
     * @param value `REAL` value to compare with real part.
     * @returns `true` if real part is less than or equals value. `false` otherwise.
     */
    readonly realLessThanOrEqualTo: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the imaginary part is less than or equals a value.
     * @param z `COMPLEX` to test imaginary part.
     * @param value `REAL` value to compare with imaginary part.
     * @returns `true` if imaginary part is less than or equals value. `false` otherwise.
     */
    readonly imagLessThanOrEqualTo: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the real part is equals a value.
     * @param z `COMPLEX` to test real part.
     * @param value `REAL` value to compare with real part.
     * @returns `true` if real part is equals value. `false` otherwise.
     */
    readonly realEquals: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the imaginary part is equals a value.
     * @param z `COMPLEX` to test imaginary part.
     * @param value `REAL` value to compare with imaginary part.
     * @returns `true` if imaginary part is equals value. `false` otherwise.
     */
    readonly imagEquals: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the real part is greater than or equals a value.
     * @param z `COMPLEX` to test real part.
     * @param value `REAL` value to compare with real part.
     * @returns `true` if real part is greater than or equals value. `false` otherwise.
     */
    readonly realGreaterThanOrEqualTo: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the imaginary part is greater than or equals a value.
     * @param z `COMPLEX` to test imaginary part.
     * @param value `REAL` value to compare with imaginary part.
     * @returns `true` if imaginary part is greater than or equals value. `false` otherwise.
     */
    readonly imagGreaterThanOrEqualTo: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the real part is greater than a value.
     * @param z `ComplexNumber` to test real part.
     * @param value `number` value to compare with real part.
     * @returns `true` if real part is greater than value. `false` otherwise.
     */
    readonly realGreaterThan: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    /**
     * Tests whether the imaginary part is greater than a value.
     * @param z `COMPLEX` to test imaginary part.
     * @param value `REAL` value to compare with imaginary part.
     * @returns `true` if imaginary part is greater than value. `false` otherwise.
     */
    readonly imagGreaterThan: (z: COMPLEX, value: NumLike<REAL>) => boolean;
    readonly parse: (value: string) => COMPLEX;
    readonly unparseValue: (value: REAL) => string;
    readonly unparse: (value: COMPLEX, parentPrecedence: PRECEDENCE) => string;
    readonly unparseMathMLValue: (value: REAL) => string;
    readonly precedence: (value: COMPLEX, evaluator: Evaluator) => PRECEDENCE;
    readonly unparseMathML: (value: COMPLEX, evaluator: Evaluator, parentPrecedence: PRECEDENCE) => string;
    readonly copy: (value: COMPLEX) => COMPLEX;
    /**
     * Reduce precision of real or imaginary part.
     * @param value Full precision value.
     * @returns Reduced precision value.
     */
    readonly toMaxPrecisionValue: (value: REAL) => REAL;
    readonly toMaxPrecision: (value: COMPLEX) => COMPLEX;
    /**
     * Get the minimal diference of two consecutive numbers for real or
     * imaginary part, the floating-point relative accuracy.
     * @returns Minimal diference of two consecutive numbers.
     */
    readonly epsilonValue: () => REAL;
    readonly epsilon: () => COMPLEX;
    /**
     * Returns a new `COMPLEX` with a pseudo-random value equal to or
     * greater than 0 and less than 1. The return value will have
     * significantDigits decimal places (or less if trailing zeros are
     * produced). If significantDigits is omitted then the number of decimal
     * places will default to the current `precision` setting.
     * @param significantDigits
     * @returns Random number.
     */
    readonly random: (significantDigits?: number) => COMPLEX;
    readonly eq: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly ne: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly compareValue: (cmp: TCompareOperationName, left: REAL, right: REAL) => boolean;
    readonly cmp: (cmp: TCompareOperationName, left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly minMaxArrayReal: (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => COMPLEX;
    readonly minMaxArrayRealWithIndex: (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => [COMPLEX, number];
    readonly minMaxArrayComplex: (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => COMPLEX;
    readonly minMaxArrayComplexWithIndex: (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => [COMPLEX, number];
    readonly min: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly minWise: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly max: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly maxWise: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly lt: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly le: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly gt: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly ge: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    /**
     * `COMPLEX` logical false.
     * @returns `false` as `COMPLEX`.
     */
    readonly false: () => COMPLEX;
    /**
     * `COMPLEX` logical true.
     * @returns `true` as `COMPLEX`.
     */
    readonly true: () => COMPLEX;
    readonly logical: (value: COMPLEX) => COMPLEX;
    readonly toLogical: (value: COMPLEX) => COMPLEX;
    readonly and: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly or: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly xor: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly not: (right: COMPLEX) => COMPLEX;
    /**
     * 0
     * @returns 0 as `COMPLEX`.
     */
    readonly zero: () => COMPLEX;
    /**
     * 1
     * @returns 1 as `COMPLEX`.
     */
    readonly one: () => COMPLEX;
    /**
     * 1/2
     * @returns 1/2 as `COMPLEX`.
     */
    readonly onediv2: () => COMPLEX;
    /**
     * -1/2
     * @returns -1/2 as `COMPLEX`.
     */
    readonly minusonediv2: () => COMPLEX;
    /**
     * -1
     * @returns -1 as `COMPLEX`.
     */
    readonly minusone: () => COMPLEX;
    /**
     * pi
     * @returns pi as `COMPLEX`.
     */
    readonly pi: () => COMPLEX;
    /**
     * pi/2
     * @returns pi/2 as `COMPLEX`.
     */
    readonly pidiv2: () => COMPLEX;
    /**
     * i
     * @returns i as `COMPLEX`.
     */
    readonly onei: () => COMPLEX;
    /**
     * i/2
     * @returns i/2 as `COMPLEX`.
     */
    readonly onediv2i: () => COMPLEX;
    /**
     * -i/2
     * @returns -i/2 as `COMPLEX`.
     */
    readonly minusonediv2i: () => COMPLEX;
    /**
     * -i
     * @returns -i as `COMPLEX`.
     */
    readonly minusonei: () => COMPLEX;
    /**
     * 2
     * @returns 2 as `COMPLEX`.
     */
    readonly two: () => COMPLEX;
    /**
     * sqrt(2*pi)
     * @returns sqrt(2*pi) as `COMPLEX`.
     */
    readonly sqrt2pi: () => COMPLEX;
    /**
     * e (Napier number).
     * @returns e as `COMPLEX`.
     */
    readonly e: () => COMPLEX;
    /**
     * NaN
     * @returns NaN as `COMPLEX`.
     */
    readonly NaN_0: () => COMPLEX;
    /**
     * Inf
     * @returns Inf as `COMPLEX`.
     */
    readonly inf_0: () => COMPLEX;
    /**
     * Addition of COMPLEX numbers.
     * @param left Value.
     * @param right Value.
     * @returns left + right
     */
    readonly add: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    /**
     * Subtraction of `COMPLEX` numbers.
     * @param left Value
     * @param right Value
     * @returns left - right
     */
    readonly sub: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    /**
     * Negates the `COMPLEX` number.
     * @param z Value.
     * @returns -z
     */
    readonly neg: (z: COMPLEX) => COMPLEX;
    readonly mul: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly rdiv: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    /**
     * Left division. For `COMPLEX` the left division is the same of right division.
     * @param left Dividend.
     * @param right Divisor.
     * @returns left \ right.
     */
    readonly ldiv: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly inv: (x: COMPLEX) => COMPLEX;
    readonly power: (left: COMPLEX, right: COMPLEX) => COMPLEX;
    readonly root: (x: COMPLEX, n: COMPLEX) => COMPLEX;
    readonly absValue: (z: COMPLEX) => REAL;
    readonly abs: (z: COMPLEX) => COMPLEX;
    readonly hypot: (x: COMPLEX, y: COMPLEX) => COMPLEX;
    readonly arg: (z: COMPLEX) => COMPLEX;
    readonly conj: (z: COMPLEX) => COMPLEX;
    readonly mod: (x: COMPLEX, y: COMPLEX) => COMPLEX;
    readonly rem: (x: COMPLEX, y: COMPLEX) => COMPLEX;
    readonly fix: (z: COMPLEX) => COMPLEX;
    readonly ceil: (z: COMPLEX) => COMPLEX;
    readonly floor: (z: COMPLEX) => COMPLEX;
    readonly round: (z: COMPLEX) => COMPLEX;
    readonly sign: (z: COMPLEX) => COMPLEX;
    readonly sqrt: (z: COMPLEX) => COMPLEX;
    readonly exp: (z: COMPLEX) => COMPLEX;
    readonly log: (z: COMPLEX) => COMPLEX;
    readonly logb: (b: COMPLEX, l: COMPLEX) => COMPLEX;
    readonly log2: (z: COMPLEX) => COMPLEX;
    readonly log10: (z: COMPLEX) => COMPLEX;
    readonly deg2rad: (z: COMPLEX) => COMPLEX;
    readonly rad2deg: (z: COMPLEX) => COMPLEX;
    readonly sin: (z: COMPLEX) => COMPLEX;
    readonly sind: (z: COMPLEX) => COMPLEX;
    readonly cos: (z: COMPLEX) => COMPLEX;
    readonly cosd: (z: COMPLEX) => COMPLEX;
    readonly tan: (z: COMPLEX) => COMPLEX;
    readonly tand: (z: COMPLEX) => COMPLEX;
    readonly csc: (z: COMPLEX) => COMPLEX;
    readonly cscd: (z: COMPLEX) => COMPLEX;
    readonly sec: (z: COMPLEX) => COMPLEX;
    readonly secd: (z: COMPLEX) => COMPLEX;
    readonly cot: (z: COMPLEX) => COMPLEX;
    readonly cotd: (z: COMPLEX) => COMPLEX;
    readonly asin: (z: COMPLEX) => COMPLEX;
    readonly asind: (z: COMPLEX) => COMPLEX;
    readonly acos: (z: COMPLEX) => COMPLEX;
    readonly acosd: (z: COMPLEX) => COMPLEX;
    readonly atan: (z: COMPLEX) => COMPLEX;
    readonly atand: (z: COMPLEX) => COMPLEX;
    readonly acsc: (z: COMPLEX) => COMPLEX;
    readonly acscd: (z: COMPLEX) => COMPLEX;
    readonly asec: (z: COMPLEX) => COMPLEX;
    readonly asecd: (z: COMPLEX) => COMPLEX;
    readonly acot: (z: COMPLEX) => COMPLEX;
    readonly acotd: (z: COMPLEX) => COMPLEX;
    readonly sinh: (z: COMPLEX) => COMPLEX;
    readonly cosh: (z: COMPLEX) => COMPLEX;
    readonly tanh: (z: COMPLEX) => COMPLEX;
    readonly csch: (z: COMPLEX) => COMPLEX;
    readonly sech: (z: COMPLEX) => COMPLEX;
    readonly coth: (z: COMPLEX) => COMPLEX;
    readonly asinh: (z: COMPLEX) => COMPLEX;
    readonly acosh: (z: COMPLEX) => COMPLEX;
    readonly atanh: (z: COMPLEX) => COMPLEX;
    readonly acsch: (z: COMPLEX) => COMPLEX;
    readonly asech: (z: COMPLEX) => COMPLEX;
    readonly acoth: (z: COMPLEX) => COMPLEX;
    readonly gamma: (z: COMPLEX) => COMPLEX;
    readonly factorial: (x: COMPLEX) => COMPLEX;
    applyFunction: PartApplyComplexHandlerTable<REAL>;
    mapFunction: Record<string, (z: COMPLEX) => COMPLEX>;
    twoArgFunction: Record<string, (x: COMPLEX, y: COMPLEX) => COMPLEX>;
}

/**
 * Key of ComplexInterfaceStatic type.
 */
export type ComplexInterfaceStaticKey = keyof ComplexInterfaceStatic<any, any>;
export { ComplexInterfaceStaticKeyTable } from './ComplexInterfaceStaticKeyTable';

export const roundingMode: Record<string, Rounding | Modulo> = {
    ROUND_UP: 0,
    ROUND_DOWN: 1,
    ROUND_CEIL: 2,
    ROUND_FLOOR: 3,
    ROUND_HALF_UP: 4,
    ROUND_HALF_DOWN: 5,
    ROUND_HALF_EVEN: 6,
    ROUND_HALF_CEIL: 7,
    ROUND_HALF_FLOOR: 8,
    EUCLID: 9,
};

export const roundingName: RoundingName[] = ['up', 'down', 'ceil', 'floor', 'half_up', 'half_down', 'half_even', 'half_ceil', 'half_floor'] as RoundingName[];
export const moduloName: ModuloName[] = ['up', 'down', undefined, 'floor', undefined, undefined, 'half_even', undefined, undefined, 'euclid'] as ModuloName[];

/**
 * Most restricted number class.
 */
export const numberClass: Record<string, number> = {
    LOGICAL: 0,
    REAL: 1,
    COMPLEX: 2,
};

/**
 * Factory for `ctor.setNumberType` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.setNumberType` COMPLEX method.
 */
export const setNumberTypeFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((value: COMPLEX) => void) => {
    /**
     * Set number type (`ctor.LOGICAL`, `ctor.REAL` or `ctor.COMPLEX`).
     * @param value number type.
     */
    return (value: COMPLEX): void => {
        if (ctor.imagIsZero(value)) {
            if (!((ctor.realIsZero(value) || ctor.realEquals(value, 1)) && value.type === ctor.LOGICAL)) {
                value.type = ctor.REAL;
            }
        } else {
            value.type = ctor.COMPLEX;
        }
    };
};

/**
 * Factory for `ctor.create` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.create` COMPLEX method.
 */
export const createFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((re?: NumLike<REAL>, im?: NumLike<REAL>, type?: NumType<TYPE>, parent?: NumParent<PARENT>) => COMPLEX) =>
    /**
     * Create new COMPLEX.
     * @param re Real part (optional).
     * @param im Imaginary part (optional).
     * @param type Class 'complex' | 'logical' (optional).
     * @param parent
     * @returns new ctor(re, im, type, parent).
     */
    (re?: NumLike<REAL>, im?: NumLike<REAL>, type?: NumType<TYPE>, parent?: NumParent<PARENT>): COMPLEX =>
        new ctor(re, im, type, parent);

/**
 * Factory for `ctor.parse` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.parse` COMPLEX method.
 */
export const parseFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((value: string) => COMPLEX) => {
    /**
     * Parse string and return its `COMPLEX` value.
     * @param value String to parse.
     * @returns `COMPLEX` parsed value.
     */
    return (value: string): COMPLEX => {
        const num = value[0] === '0' && (value[1] === 'x' || value[1] === 'X') ? value.replace('_', '') : value.replace(/[dD]/, 'e');

        if (/[ijIJ]$/.test(num)) {
            return ctor.create(0, num.slice(0, -1));
        }
        return ctor.create(num, 0);
    };
};

/**
 * Factory for `ctor.unparseValue` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.unparseValue` method.
 */
export const unparseValueFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((value: REAL) => string) =>
    /**
     * Unparse real or imaginary part.
     * @param value `REAL` value
     * @returns String of unparsed value
     */
    (value: REAL): string => {
        if ((rctor as RealInterfaceStatic<REAL>).isFinite(value)) {
            const value_unparsed = (rctor as RealInterfaceStatic<REAL>).unparse(value).split('e');
            if (value_unparsed.length === 1) {
                return value_unparsed[0].slice(0, ctor.settings.toExpPos);
            } else {
                return value_unparsed[0].slice(0, ctor.settings.toExpPos) + 'e' + Number(value_unparsed[1]);
            }
        } else {
            return (rctor as RealInterfaceStatic<REAL>).isNaN(value) ? 'NaN' : ((rctor as RealInterfaceStatic<REAL>).isNeg(value) ? '-' : '') + '&infin;';
        }
    };

/**
 * Factory for `ctor.unparse` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.unparse` COMPLEX method.
 */
export const unparseFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((value: COMPLEX, parentPrecedence?: number) => string) => {
    /**
     * Unparse `ctor` value. Show true/false if logical value,
     * otherwise show real and imaginary parts enclosed by parenthesis. If
     * some part is zero the null part is ommited (and parenthesis is ommited
     * too).
     * @param value Value to unparse.
     * @returns String of unparsed value.
     */
    return (value: COMPLEX, parentPrecedence: number = 0): string => {
        if (value.type !== ctor.LOGICAL) {
            const value_prec = ctor.toMaxPrecision(value);
            if (!ctor.realIsZero(value_prec) && !ctor.imagIsZero(value_prec)) {
                return (
                    '(' +
                    ctor.unparseValue(value_prec.re) +
                    (ctor.imagGreaterThan(value_prec, 0) ? '+' : '') +
                    (!ctor.imagEquals(value_prec, 1) ? (!ctor.imagEquals(value_prec, -1) ? ctor.unparseValue(value_prec.im) : '-') : '') +
                    'i)'
                );
            } else if (!ctor.realIsZero(value_prec)) {
                return ctor.unparseValue(value_prec.re);
            } else if (!ctor.imagIsZero(value_prec)) {
                return (!ctor.imagEquals(value_prec, 1) ? (!ctor.imagEquals(value_prec, -1) ? ctor.unparseValue(value_prec.im) : '-') : '') + 'i';
            } else if (!ctor.realIsNegative(value_prec) && !ctor.imagIsNegative(value_prec)) {
                return '0';
            } else if (ctor.realIsNegative(value_prec) && ctor.imagIsNegative(value_prec)) {
                return '-0';
            } else if (ctor.realIsNegative(value_prec) && !ctor.imagIsNegative(value_prec)) {
                return '(-0+0i)';
            } else {
                return '(0-0i)';
            }
        } else {
            if (ctor.realIsZero(value)) {
                return 'false';
            } else {
                return 'true';
            }
        }
    };
};

/**
 * Factory for `ctor.unparseMathMLValue` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.unparseMathMLValue` method.
 */
export const unparseMathMLValueFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((value: REAL) => string) =>
    /**
     * Unparse real or imaginary part.
     * @param value `REAL` value
     * @returns string of value unparsed
     */
    (value: REAL): string => {
        if ((rctor as RealInterfaceStatic<REAL>).isFinite(value)) {
            const value_unparsed = (rctor as RealInterfaceStatic<REAL>).unparse(value).split('e');
            if (value_unparsed.length == 1) {
                return '<mn>' + value_unparsed[0].slice(0, ctor.settings.toExpPos) + '</mn>';
            } else {
                return (
                    '<mn>' +
                    value_unparsed[0].slice(0, ctor.settings.toExpPos) +
                    '</mn><mo>&sdot;</mo><msup><mrow><mn>10</mn></mrow><mrow><mn>' +
                    Number(value_unparsed[1]) +
                    '</mn></mrow></msup>'
                );
            }
        } else {
            return (rctor as RealInterfaceStatic<REAL>).isNaN(value) ? '<mi><b>NaN</b></mi>' : ((rctor as RealInterfaceStatic<REAL>).isNeg(value) ? '<mo>-</mo>' : '') + '<mi>&infin;</mi>';
        }
    };

/**
 * Factory for `ctor.precedence` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.precedence` COMPLEX method.
 */
export const precedenceFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((value: COMPLEX, evaluator: Evaluator) => number) => {
    /**
     * Returns the precedence of a `ctor` `value` by querying the precedence table in `evaluator` object (`Evaluator.ts`).
     * @param value `ctor` value.
     * @param evaluator `Evaluator` instance.
     * @returns Precedence level.
     */
    return (value: COMPLEX, evaluator: Evaluator): number => {
        if (value.type !== ctor.LOGICAL) {
            const value_prec = ctor.toMaxPrecision(value);
            if (!ctor.realIsZero(value_prec) && !ctor.imagIsZero(value_prec)) {
                return evaluator.precedenceTable['+'];
            } else if (!ctor.realIsZero(value_prec)) {
                return ctor.realIsNegative(value_prec) ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'];
            } else if (!ctor.imagIsZero(value_prec)) {
                return ctor.imagIsNegative(value_prec) ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'];
            } else if (!ctor.realIsNegative(value_prec) && !ctor.imagIsNegative(value_prec)) {
                return evaluator.precedenceTable['()'];
            } else if (ctor.realIsNegative(value_prec) && ctor.imagIsNegative(value_prec)) {
                return evaluator.precedenceTable['-_'];
            } else {
                return evaluator.precedenceTable['+'];
            }
        } else {
            return evaluator.precedenceTable['()'];
        }
    };
};

/**
 * Factory for `ctor.unparseMathML` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.unparseMathML` COMPLEX method.
 */
export const unparseMathMLFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((value: COMPLEX, evaluator: Evaluator, parentPrecedence?: number) => string) => {
    /**
     * Unparse `ctor` value as MathML language. Show true/false if
     * logical value, otherwise show real and imaginary parts enclosed by
     * parenthesis. If some part is zero the null part is ommited (and
     * parenthesis is ommited too).
     * @param value value to unparse.
     * @returns string of unparsed value.
     */
    return (value: COMPLEX, evaluator: Evaluator, parentPrecedence: number = 0): string => {
        if (value.type !== ctor.LOGICAL) {
            const value_prec = ctor.toMaxPrecision(value);
            if (!ctor.realIsZero(value_prec) && !ctor.imagIsZero(value_prec)) {
                const unparsed =
                    ctor.unparseMathMLValue(value_prec.re) +
                    (ctor.imagGreaterThan(value_prec, 0) ? '<mo>+</mo>' : '') +
                    (!ctor.imagEquals(value_prec, 1) ? (!ctor.imagEquals(value_prec, -1) ? ctor.unparseMathMLValue(value_prec.im) : '<mo>-</mo>') : '') +
                    '<mi>i</mi>';
                if (parentPrecedence > evaluator.precedenceTable['+']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (!ctor.realIsZero(value_prec)) {
                const unparsed = ctor.unparseMathMLValue(value_prec.re);
                if (parentPrecedence > (ctor.realIsNegative(value_prec) ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'])) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (!ctor.imagIsZero(value_prec)) {
                const unparsed = (!ctor.imagEquals(value_prec, 1) ? (!ctor.imagEquals(value_prec, -1) ? ctor.unparseMathMLValue(value_prec.im) : '<mo>-</mo>') : '') + '<mi>i</mi>';
                if (parentPrecedence > (ctor.imagIsNegative(value_prec) ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'])) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (!ctor.realIsNegative(value_prec) && !ctor.imagIsNegative(value_prec)) {
                const unparsed = '<mn>0</mn>';
                if (parentPrecedence > evaluator.precedenceTable['()']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (ctor.realIsNegative(value_prec) && ctor.imagIsNegative(value_prec)) {
                const unparsed = '<mn>-0</mn>';
                if (parentPrecedence > evaluator.precedenceTable['-_']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (ctor.realIsNegative(value_prec) && !ctor.imagIsNegative(value_prec)) {
                const unparsed = '<mn>-0</mn><mo>+</mo><mn>0</mn><mi>i</mi>';
                if (parentPrecedence > evaluator.precedenceTable['+']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else {
                const unparsed = '<mn>0</mn><mo>-</mo><mn>0</mn><mi>i</mi>';
                if (parentPrecedence > evaluator.precedenceTable['+']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            }
        } else {
            if (ctor.realIsZero(value)) {
                return '<mi>false</mi>';
            } else {
                return '<mi>true</mi>';
            }
        }
    };
};

/**
 * Factory for `ctor.toMaxPrecision` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.toMaxPrecision` COMPLEX method.
 */
export const toMaxPrecisionFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((value: COMPLEX) => COMPLEX) =>
    /**
     * Reduce precision.
     * @param value Full precision value.
     * @returns Reduced precision value.
     */
    (value: COMPLEX): COMPLEX =>
        new ctor(ctor.toMaxPrecisionValue(value.re), ctor.toMaxPrecisionValue(value.im));

/**
 * Factory for `ctor.copy` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.copy` COMPLEX method.
 */
export const copyFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((value: COMPLEX) => COMPLEX) =>
    /**
     * Creates a copy of the value.
     * @param value `COMPLEX` value
     * @returns copy of value
     */
    (value: COMPLEX): COMPLEX =>
        new ctor(value.re, value.im, value.type);

/**
 * Factory for `ctor.epsilon` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.epsilon` COMPLEX method.
 */
export const epsilonFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): (() => COMPLEX) =>
    /**
     * Get the minimal diference of two consecutive numbers, the
     * floating-point relative accuracy.
     * @returns Minimal diference of two consecutive numbers.
     */
    (): COMPLEX =>
        new ctor(ctor.epsilonValue());

/**
 * Factory for `ctor.eq` and `ctor.ne` methods.
 * @param ctor COMPLEX instance constructor.
 * @param test Logic value for true test result (`true` for `ctor.eq` and `false` for `ctor.ne`)
 * @returns `ctor.eq` or `ctor.ne` COMPLEX method.
 */
export const equalsFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    test: boolean = true,
): ((left: COMPLEX, right: COMPLEX) => COMPLEX) => {
    if (test) {
        /**
         * Test for equality.
         * @param left Value.
         * @param right Value.
         * @returns Returns `ctor.true()` if left and right are equals.
         */
        return (left: COMPLEX, right: COMPLEX): COMPLEX => {
            const left_prec = ctor.toMaxPrecision(left);
            const right_prec = ctor.toMaxPrecision(right);
            return ctor.realEquals(left_prec, right_prec.re) && ctor.imagEquals(left_prec, right_prec.im) ? ctor.true() : ctor.false();
        };
    } else {
        /**
         * Test for inequality.
         * @param left Value.
         * @param right Value.
         * @returns Returns `ctor.true()` if left and right are different.
         */
        return (left: COMPLEX, right: COMPLEX): COMPLEX => {
            const left_prec = ctor.toMaxPrecision(left);
            const right_prec = ctor.toMaxPrecision(right);
            return ctor.realEquals(left_prec, right_prec.re) && ctor.imagEquals(left_prec, right_prec.im) ? ctor.false() : ctor.true();
        };
    }
};

/**
 * Factory for `ctor.cmp` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.cmp` COMPLEX method.
 */
export const cmpFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((cmp: TCompareOperationName, left: COMPLEX, right: COMPLEX) => COMPLEX) => {
    return (cmp: TCompareOperationName, left: COMPLEX, right: COMPLEX): COMPLEX => {
        /**
         * Comparison made in polar lexicographical ordering. It's ordered by
         * absolute value, or by polar angle in (-pi,pi] when absolute values are
         * equal.
         * @param cmp Type of comparison.
         * @param left Value.
         * @param right Value.
         * @returns Result of comparison as `ctor.true()` or `ctor.false()`.
         */
        const left_prec = ctor.toMaxPrecision(left);
        const right_prec = ctor.toMaxPrecision(right);
        if (ctor.imagIsZero(left_prec) && ctor.imagIsZero(right_prec)) {
            return ctor.compareValue(cmp, left_prec.re, right_prec.re) ? ctor.true() : ctor.false();
        }
        const left_abs = ctor.toMaxPrecisionValue(ctor.abs(left).re);
        const right_abs = ctor.toMaxPrecisionValue(ctor.abs(right).re);
        if (ctor.compareValue('eq', left_abs, right_abs)) {
            return ctor.compareValue(cmp, ctor.toMaxPrecisionValue(ctor.arg(left).re), ctor.toMaxPrecisionValue(ctor.arg(right).re)) ? ctor.true() : ctor.false();
        } else {
            return ctor.compareValue(cmp, left_abs, right_abs) ? ctor.true() : ctor.false();
        }
    };
};

/**
 * Factory for `ctor.minMaxArrayReal` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.minMaxArrayReal` COMPLEX method.
 */
export const minMaxArrayRealFactory = <
    REAL,
    COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>,
    TYPE = number,
    PARENT = unknown,
    PRECEDENCE = number,
    ROUNDING = Rounding,
    MODULO = Modulo,
>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => COMPLEX) => {
    /**
     * Gets the maximum or minimum of an array of COMPLEX using real comparison.
     * @param cmp 'lt' for minimum or 'gt' for maximum.
     * @param args COMPLEX values.
     * @returns Minimum or maximum of COMPLEX values.
     */
    return (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]): COMPLEX =>
        args.reduce((previous: COMPLEX, current: COMPLEX): COMPLEX => (ctor.compareValue(cmp, previous.re, current.re) ? previous : current), args[0]);
};

/**
 * Factory for `ctor.minMaxArrayRealWithIndex` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.minMaxArrayRealWithIndex` COMPLEX method.
 */
export const minMaxArrayRealWithIndexFactory = <
    REAL,
    COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>,
    TYPE = number,
    PARENT = unknown,
    PRECEDENCE = number,
    ROUNDING = Rounding,
    MODULO = Modulo,
>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => [COMPLEX, number]) => {
    /**
     * Gets the maximum or minimum of an array of COMPLEX using real comparison.
     * @param cmp 'lt' for minimum or 'gt' for maximum.
     * @param args COMPLEX values.
     * @returns Minimum or maximum of COMPLEX values.
     */
    return (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]): [COMPLEX, number] => {
        let index: number = 0;
        const result = args.reduceRight(
            (previous: COMPLEX, current: COMPLEX, i: number): COMPLEX => {
                if (ctor.compareValue(cmp, previous.re, current.re)) {
                    return previous;
                } else {
                    index = i;
                    return current;
                }
            },
            args[args.length - 1],
        );
        return [result, index];
    };
};

/**
 * Factory for `ctor.minMaxArrayComplex` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.minMaxArrayComplex` COMPLEX method.
 */
export const minMaxArrayComplexFactory = <
    REAL,
    COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>,
    TYPE = number,
    PARENT = unknown,
    PRECEDENCE = number,
    ROUNDING = Rounding,
    MODULO = Modulo,
>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => COMPLEX) => {
    /**
     * Gets the maximum or minimum of an array of COMPLEX using complex
     * comparison. The arguments are in polar lexicographical ordering
     * (ordered by absolute value, or by polar angle in (-pi,pi] when absolute
     * values are equal).
     * @param cmp 'lt' for minimum or 'gt' for maximum.
     * @param args COMPLEX values.
     * @returns Minimum or maximum of COMPLEX values.
     */
    return (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]): COMPLEX => {
        return args.reduce((previous: COMPLEX, current: COMPLEX): COMPLEX => {
            const previous_abs = ctor.abs(previous).re;
            const current_abs = ctor.abs(current).re;
            if (ctor.compareValue('eq', previous_abs, current_abs)) {
                return ctor.compareValue(cmp, ctor.arg(previous).re, ctor.arg(current).re) ? previous : current;
            } else {
                return ctor.compareValue(cmp, previous_abs, current_abs) ? previous : current;
            }
        }, args[0]);
    };
};

/**
 * Factory for `ctor.minMaxArrayComplexWithIndex` method.
 * @param ctor COMPLEX instance constructor.
 * @returns `ctor.minMaxArrayComplexWithIndex` COMPLEX method.
 */
export const minMaxArrayComplexWithIndexFactory = <
    REAL,
    COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>,
    TYPE = number,
    PARENT = unknown,
    PRECEDENCE = number,
    ROUNDING = Rounding,
    MODULO = Modulo,
>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): ((cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]) => [COMPLEX, number]) => {
    /**
     * Gets the maximum or minimum of an array of COMPLEX using complex comparison.
     * @param cmp 'lt' for minimum or 'gt' for maximum.
     * @param args COMPLEX values.
     * @returns Minimum or maximum of COMPLEX values with index.
     */
    return (cmp: TMinMaxArrayCompareOperationName, ...args: COMPLEX[]): [COMPLEX, number] => {
        let index: number = 0;
        const result = args.reduceRight(
            (previous: COMPLEX, current: COMPLEX, i: number): COMPLEX => {
                const previous_abs = ctor.abs(previous).re;
                const current_abs = ctor.abs(current).re;
                if (ctor.compareValue('eq', previous_abs, current_abs)) {
                    if (ctor.compareValue(cmp, ctor.arg(previous).re, ctor.arg(current).re)) {
                        return previous;
                    } else {
                        index = i;
                        return current;
                    }
                } else {
                    if (ctor.compareValue(cmp, previous_abs, current_abs)) {
                        return previous;
                    } else {
                        index = i;
                        return current;
                    }
                }
            },
            args[args.length - 1],
        );
        return [result, index];
    };
};

/**
 * Factory for `ctor.min` and `ctor.max` methods.
 * @param ctor COMPLEX instance constructor.
 * @param cmp `'lt'` for `ctor.min` result or `'gte'` for `ctor.max` result.
 * @returns `ctor.min` or `ctor.max` COMPLEX method.
 */
export const minMaxFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    cmp: TMinMaxCompareOperationName,
): ((left: COMPLEX, right: COMPLEX) => COMPLEX) => {
    /**
     * Returns the minimum or maximum of arguments. The arguments are in polar
     * lexicographical ordering (ordered by absolute value, or by polar angle
     * in (-pi,pi] when absolute values are equal).
     * @param left Value to compare.
     * @param right Value to compare.
     * @returns Maximum of left and right
     */
    return (left: COMPLEX, right: COMPLEX): COMPLEX => {
        if (ctor.imagIsZero(left) && ctor.imagIsZero(right)) {
            return ctor.compareValue(cmp, left.re, right.re) ? left : right;
        } else {
            const left_abs = ctor.abs(left).re;
            const right_abs = ctor.abs(right).re;
            if (ctor.compareValue('eq', left_abs, right_abs)) {
                return ctor.compareValue(cmp, ctor.arg(left).re, ctor.arg(right).re) ? left : right;
            } else {
                return ctor.compareValue(cmp, left_abs, right_abs) ? left : right;
            }
        }
    };
};

/**
 * Factory for `ctor.minWise` and `ctor.maxWise` methods.
 * @param ctor COMPLEX instance constructor.
 * @param cmp `'lt'` for `ctor.minWise` result or `'gte'` for `ctor.maxWise` result.
 * @returns `ctor.minWise` or `ctor.maxWise` COMPLEX method.
 */
export const minMaxWiseFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    cmp: TMinMaxCompareOperationName,
): ((left: COMPLEX, right: COMPLEX) => COMPLEX) => {
    /**
     * Returns the minimum or maximum of arguments. The arguments are in polar
     * lexicographical ordering (ordered by absolute value, or by polar angle
     * in (-pi,pi] when absolute values are equal).
     * This method is used by element wise operations.
     * @param left Value to compare.
     * @param right Value to compare.
     * @returns Maximum of left and right
     */
    return (left: COMPLEX, right: COMPLEX): COMPLEX => {
        if (left.type <= ctor.REAL && left.type <= ctor.REAL) {
            return ctor.compareValue(cmp, left.re, right.re) ? left : right;
        } else {
            const left_abs = ctor.abs(left).re;
            const right_abs = ctor.abs(right).re;
            if (ctor.compareValue('eq', left_abs, right_abs)) {
                return ctor.compareValue(cmp, ctor.arg(left).re, ctor.arg(right).re) ? left : right;
            } else {
                return ctor.compareValue(cmp, left_abs, right_abs) ? left : right;
            }
        }
    };
};

/**
 * Factory for comparison methods (`ctor.lt`, `ctor.le`, `ctor.gt` and `ctor.ge`).
 * @param ctor COMPLEX instance constructor.
 * @param cmp Comparison descriptor.
 * @returns `ctor.lt`, `ctor.le`, `ctor.gt` and `ctor.ge` COMPLEX methods.
 */
export const comparisonFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    cmp: TCompareOperationName,
): ((left: COMPLEX, right: COMPLEX) => COMPLEX) => {
    /**
     * Comparison (lexicographical ordering).
     * @param left Value.
     * @param right Value.
     * @returns Result of comparison of left and right as `ctor.true()` or `ctor.false()`.
     */
    return (left: COMPLEX, right: COMPLEX): COMPLEX => ctor.cmp(cmp, left, right);
};

/**
 * Factory for `ctor.logical` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.logical` method.
 */
export const logicalFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((value: COMPLEX) => COMPLEX) =>
    /**
     * Convert numeric values to logicals.
     * @param value COMPLEX decimal value.
     * @returns COMPLEX logical value.
     */
    (value: COMPLEX): COMPLEX => {
        const prec = ctor.toMaxPrecision(value);
        return new ctor(ctor.realIsZero(prec) && ctor.imagIsZero(prec) ? 0 : 1, 0, ctor.LOGICAL);
    };

/**
 * Factory for `ctor.and` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.and` method.
 */
export const andFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((left: COMPLEX, right: COMPLEX) => COMPLEX) =>
    /**
     * Logical **AND**.
     * @param left Value.
     * @param right Value.
     * @returns left AND right.
     */
    (left: COMPLEX, right: COMPLEX): COMPLEX => {
        const left_prec = ctor.toMaxPrecision(left);
        const right_prec = ctor.toMaxPrecision(right);
        return (ctor.realIsZero(left_prec) && ctor.imagIsZero(left_prec)) || (ctor.realIsZero(right_prec) && ctor.imagIsZero(right_prec)) ? ctor.false() : ctor.true();
    };

/**
 * Factory for `ctor.or` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.or` method.
 */
export const orFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((left: COMPLEX, right: COMPLEX) => COMPLEX) =>
    /**
     * Logical **OR**.
     * @param left Value.
     * @param right Value.
     * @returns left OR right.
     */
    (left: COMPLEX, right: COMPLEX): COMPLEX => {
        const left_prec = ctor.toMaxPrecision(left);
        const right_prec = ctor.toMaxPrecision(right);
        return ctor.realIsZero(left_prec) && ctor.imagIsZero(left_prec) && ctor.realIsZero(right_prec) && ctor.imagIsZero(right_prec) ? ctor.false() : ctor.true();
    };

/**
 * Factory for `ctor.xor` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.xor` method.
 */
export const xorFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((left: COMPLEX, right: COMPLEX) => COMPLEX) =>
    /**
     * Logical **XOR**.
     * @param left Value.
     * @param right Value.
     * @returns left XOR right.
     */
    (left: COMPLEX, right: COMPLEX): COMPLEX => {
        const left_prec = ctor.toMaxPrecision(left);
        const right_prec = ctor.toMaxPrecision(right);
        return (ctor.realIsZero(left_prec) && ctor.imagIsZero(left_prec) && !(ctor.realIsZero(right_prec) && ctor.imagIsZero(right_prec))) ||
            (!(ctor.realIsZero(left_prec) && ctor.imagIsZero(left_prec)) && ctor.realIsZero(right_prec) && ctor.imagIsZero(right_prec))
            ? ctor.true()
            : ctor.false();
    };

/**
 * Factory for `ctor.not` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.not` method.
 */
export const notFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((right: COMPLEX) => COMPLEX) =>
    /**
     * Logical **NOT**.
     * @param right Value.
     * @returns NOT right.
     */
    (right: COMPLEX): COMPLEX => {
        const right_prec = ctor.toMaxPrecision(right);
        return ctor.realIsZero(right_prec) && ctor.imagIsZero(right_prec) ? ctor.true() : ctor.false();
    };

/**
 * Factory for literal complex values.
 * @param ctor Complex instance constructor.
 * @param real Real part value.
 * @param imag Imaginary part value.
 * @param type Number type value.
 * @returns Literal value COMPLEX method `(): COMPLEX => new ctor(real, imag, type);`.
 */
export const literalFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
        real?: NumLike<REAL>,
        imag?: NumLike<REAL>,
        type?: NumType<TYPE>,
    ): (() => COMPLEX) =>
    /**
     * Literal complex value.
     * @returns Literal value as COMPLEX.
     */
    (): COMPLEX =>
        new ctor(real, imag, type);

/**
 * Factory for `ctor.mul` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.mul` method.
 */
export const mulFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((left: COMPLEX, right: COMPLEX) => COMPLEX) =>
    /**
     * Multiplication of `COMPLEX` numbers.
     * @param left Value.
     * @param right Value.
     * @returns left * right
     */
    (left: COMPLEX, right: COMPLEX): COMPLEX => {
        if (ctor.imagIsZero(left) && ctor.imagIsZero(right)) {
            return new ctor((rctor as RealInterfaceStatic<REAL>).mul(left.re, right.re), (rctor as RealInterfaceStatic<REAL>).ZERO);
        } else {
            return new ctor(
                (rctor as RealInterfaceStatic<REAL>).sub((rctor as RealInterfaceStatic<REAL>).mul(left.re, right.re), (rctor as RealInterfaceStatic<REAL>).mul(left.im, right.im)),
                (rctor as RealInterfaceStatic<REAL>).add((rctor as RealInterfaceStatic<REAL>).mul(left.re, right.im), (rctor as RealInterfaceStatic<REAL>).mul(left.im, right.re)),
            );
        }
    };

/**
 * Factory for `ctor.rdiv` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.rdiv` method.
 */
export const rdivFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((left: COMPLEX, right: COMPLEX) => COMPLEX) =>
    /**
     * Right Division.
     * @param left Dividend.
     * @param right Divisor.
     * @returns left / right.
     */
    (left: COMPLEX, right: COMPLEX): COMPLEX => {
        const denom = (rctor as RealInterfaceStatic<REAL>).add((rctor as RealInterfaceStatic<REAL>).mul(right.re, right.re), (rctor as RealInterfaceStatic<REAL>).mul(right.im, right.im));
        if ((rctor as RealInterfaceStatic<REAL>).isFinite(denom)) {
            if ((rctor as RealInterfaceStatic<REAL>).isZero(denom)) {
                return new ctor(
                    (rctor as RealInterfaceStatic<REAL>).mul(left.re, (rctor as RealInterfaceStatic<REAL>).INF),
                    ctor.imagIsZero(left) ? (rctor as RealInterfaceStatic<REAL>).ZERO : (rctor as RealInterfaceStatic<REAL>).mul(left.im, (rctor as RealInterfaceStatic<REAL>).INF),
                );
            } else {
                return new ctor(
                    (rctor as RealInterfaceStatic<REAL>).div(
                        (rctor as RealInterfaceStatic<REAL>).add((rctor as RealInterfaceStatic<REAL>).mul(left.re, right.re), (rctor as RealInterfaceStatic<REAL>).mul(left.im, right.im)),
                        denom,
                    ),
                    (rctor as RealInterfaceStatic<REAL>).div(
                        (rctor as RealInterfaceStatic<REAL>).sub((rctor as RealInterfaceStatic<REAL>).mul(left.im, right.re), (rctor as RealInterfaceStatic<REAL>).mul(left.re, right.im)),
                        denom,
                    ),
                );
            }
        } else {
            if ((rctor as RealInterfaceStatic<REAL>).isNaN(denom)) {
                if ((ctor.realIsFinite(right) || ctor.realIsNaN(right)) && (ctor.imagIsFinite(right) || ctor.imagIsNaN(right))) {
                    return new ctor(NaN, 0);
                } else {
                    return ctor.zero();
                }
            } else if (ctor.realIsFinite(left) && ctor.imagIsFinite(left)) {
                return ctor.zero();
            } else {
                return new ctor(NaN, 0);
            }
        }
    };

/**
 * Factory for `ctor.inv` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.inv` method.
 */
export const invFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse.
     * @param x Denominator
     * @returns 1/x
     */
    (z: COMPLEX): COMPLEX => {
        const denom = (rctor as RealInterfaceStatic<REAL>).add((rctor as RealInterfaceStatic<REAL>).mul(z.re, z.re), (rctor as RealInterfaceStatic<REAL>).mul(z.im, z.im));
        if ((rctor as RealInterfaceStatic<REAL>).isFinite(denom)) {
            if ((rctor as RealInterfaceStatic<REAL>).isZero(denom)) {
                return new ctor(Infinity, 0);
            } else {
                return new ctor((rctor as RealInterfaceStatic<REAL>).div(z.re, denom), (rctor as RealInterfaceStatic<REAL>).neg((rctor as RealInterfaceStatic<REAL>).div(z.im, denom)));
            }
        } else {
            if ((rctor as RealInterfaceStatic<REAL>).isNaN(denom)) {
                if ((ctor.realIsFinite(z) || ctor.realIsNaN(z)) && (ctor.imagIsFinite(z) || ctor.imagIsNaN(z))) {
                    return new ctor(NaN, 0);
                } else {
                    return ctor.zero();
                }
            } else {
                return ctor.zero();
            }
        }
    };

/**
 * Factory for `ctor.power` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.power` method.
 */
export const powerFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((left: COMPLEX, right: COMPLEX) => COMPLEX) =>
    /**
     * Power of `COMPLEX` numbers.
     * @param left Base.
     * @param right Exponent.
     * @returns left^right
     */
    (left: COMPLEX, right: COMPLEX): COMPLEX => {
        if (ctor.imagIsZero(left) && ctor.imagIsZero(right) && ctor.realGreaterThanOrEqualTo(left, 0)) {
            return new ctor((rctor as RealInterfaceStatic<REAL>).pow(left.re, right.re), 0);
        } else {
            const arg_left = (rctor as RealInterfaceStatic<REAL>).atan2(
                ctor.imagIsZero(left) ? (rctor as RealInterfaceStatic<REAL>).ZERO : left.im,
                ctor.realIsZero(left) ? (rctor as RealInterfaceStatic<REAL>).ZERO : left.re,
            );
            const mod2_left = (rctor as RealInterfaceStatic<REAL>).add(
                (rctor as RealInterfaceStatic<REAL>).mul(left.re, left.re),
                (rctor as RealInterfaceStatic<REAL>).mul(left.im, left.im),
            );
            const mul = (rctor as RealInterfaceStatic<REAL>).mul(
                (rctor as RealInterfaceStatic<REAL>).pow(mod2_left, (rctor as RealInterfaceStatic<REAL>).div(right.re, (rctor as RealInterfaceStatic<REAL>).TWO)),
                (rctor as RealInterfaceStatic<REAL>).exp(
                    (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).MINUSONE, right.im), arg_left),
                ),
            );
            const trig = (rctor as RealInterfaceStatic<REAL>).add(
                (rctor as RealInterfaceStatic<REAL>).mul(right.re, arg_left),
                (rctor as RealInterfaceStatic<REAL>).mul(
                    (rctor as RealInterfaceStatic<REAL>).div(right.im, (rctor as RealInterfaceStatic<REAL>).TWO),
                    (rctor as RealInterfaceStatic<REAL>).ln(mod2_left),
                ),
            );
            return new ctor(
                (rctor as RealInterfaceStatic<REAL>).mul(mul, (rctor as RealInterfaceStatic<REAL>).cos(trig)),
                ctor.imagIsZero(left) && ctor.imagIsZero(right) && (ctor.realGreaterThanOrEqualTo(right, 1) || ctor.realLessThanOrEqualTo(right, -1))
                    ? 0
                    : (rctor as RealInterfaceStatic<REAL>).mul(mul, (rctor as RealInterfaceStatic<REAL>).sin(trig)),
            );
        }
    };

/**
 * Factory for `ctor.root` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.root` method.
 */
export const rootFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX, n: COMPLEX) => COMPLEX) =>
    /**
     * Root of ctor numbers.
     * @param x Radicand.
     * @param n Index.
     * @returns nth root of x.
     */
    (z: COMPLEX, n: COMPLEX): COMPLEX =>
        ctor.power(z, ctor.inv(n));

/**
 * Factory for `ctor.absValue` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.absValue` method.
 */
export const absValueFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
    ): ((z: COMPLEX) => REAL) =>
    /**
     *
     * @param z
     * @returns
     */
    (z: COMPLEX): REAL =>
        (rctor as RealInterfaceStatic<REAL>).sqrt(
            (rctor as RealInterfaceStatic<REAL>).add((rctor as RealInterfaceStatic<REAL>).mul(z.re, z.re), (rctor as RealInterfaceStatic<REAL>).mul(z.im, z.im)),
        );

/**
 * Factory for `ctor.abs` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.abs` method.
 */
export const absFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Absolute value and complex magnitude.
     * @param z value
     * @returns Absolute value of z
     */
    (z: COMPLEX): COMPLEX =>
        ctor.imagIsZero(z) ? new ctor((rctor as RealInterfaceStatic<REAL>).abs(z.re)) : new ctor(ctor.absValue(z));

/**
 * Factory for `ctor.hypot` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.root` method.
 */
export const hypotFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((x: COMPLEX, y: COMPLEX) => COMPLEX) =>
    /**
     * Square root of sum of squares (hypotenuse)
     * @param x vertex.
     * @param y vertex.
     * @returns hypotenuse of the two orthogonal vertex x and y.
     */
    (x: COMPLEX, y: COMPLEX): COMPLEX =>
        new ctor(ctor.absValue(new ctor(ctor.absValue(x), ctor.absValue(y))));

/**
 * Factory for `ctor.arg` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.arg` method.
 */
export const argFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Phase angle.
     * @param z value.
     * @returns Phase angle of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).atan2(ctor.imagIsZero(z) ? (rctor as RealInterfaceStatic<REAL>).ZERO : z.im, z.re) /*test if imaginary part is 0 to change -0 to 0*/,
            0,
        );

/**
 * Factory for `ctor.conj` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.conj` method.
 */
export const conjFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Complex conjugate
     * @param z value.
     * @returns Complex conjugate of z
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(z.re, (rctor as RealInterfaceStatic<REAL>).neg(z.im));

/**
 * Factory for `ctor.mod` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.mod` method.
 */
export const modFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((x: COMPLEX, y: COMPLEX) => COMPLEX) =>
    /**
     * Remainder after division (modulo operation). By convention
     * mod(a,0) = a.
     * @param x Dividend.
     * @param y Divisor.
     * @returns Remainder after division.
     */
    (x: COMPLEX, y: COMPLEX): COMPLEX => {
        if (!(ctor.imagIsZero(x) && ctor.imagIsZero(y))) {
            throw new Error('mod: not defined for complex numbers');
        }
        return ctor.realIsZero(y) ? x : new ctor((rctor as RealInterfaceStatic<REAL>).mod(x.re, y.re));
    };

/**
 * Factory for `ctor.rem` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.rem` method.
 */
export const remFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((x: COMPLEX, y: COMPLEX) => COMPLEX) =>
    /**
     * Remainder after division. By convention rem(a,0) = NaN.
     * @param x Dividend.
     * @param y Divisor.
     * @returns Remainder after division.
     */
    (x: COMPLEX, y: COMPLEX): COMPLEX => {
        if (!(ctor.imagIsZero(x) && ctor.imagIsZero(y))) {
            throw new Error('rem: not defined for complex numbers');
        }
        return new ctor((rctor as RealInterfaceStatic<REAL>).mod(x.re, y.re));
    };

/**
 * Factory for `ctor.fix` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.fix` method.
 */
export const fixFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Round toward zero. This operation effectively truncates the number to
     * integer by removing the decimal portion.
     * @param z Value.
     * @returns Integer portion of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor((rctor as RealInterfaceStatic<REAL>).trunc(z.re), (rctor as RealInterfaceStatic<REAL>).trunc(z.im));

/**
 * Factory for `ctor.ceil` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.ceil` method.
 */
export const ceilFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Round toward positive infinity.
     * @param z Value
     * @returns Smallest integer greater than or equal to z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor((rctor as RealInterfaceStatic<REAL>).ceil(z.re), (rctor as RealInterfaceStatic<REAL>).ceil(z.im));

/**
 * Factory for `ctor.floor` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.floor` method.
 */
export const floorFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Round toward negative infinity.
     * @param z Value
     * @returns Largest integer less than or equal to z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor((rctor as RealInterfaceStatic<REAL>).floor(z.re), (rctor as RealInterfaceStatic<REAL>).floor(z.im));

/**
 * Factory for `ctor.round` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.round` method.
 */
export const roundFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Round to nearest integer.
     * @param z Value.
     * @returns Nearest integer of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor((rctor as RealInterfaceStatic<REAL>).round(z.re), (rctor as RealInterfaceStatic<REAL>).round(z.im));

/**
 * Factory for `ctor.sign` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.sign` method.
 */
export const signFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Sign function (signum function).
     * @param z Value.
     * @returns
     * * 1 if the corresponding element of z is greater than 0.
     * * 0 if the corresponding element of z equals 0.
     * * -1 if the corresponding element of z is less than 0.
     * * z/abs(z) if z is complex.
     */
    (z: COMPLEX): COMPLEX => {
        if (ctor.realIsZero(z)) {
            return ctor.imagIsZero(z) ? ctor.zero() : new ctor(0, (rctor as RealInterfaceStatic<REAL>).div(z.im, ctor.absValue(z)));
        } else {
            return ctor.imagIsZero(z)
                ? new ctor((rctor as RealInterfaceStatic<REAL>).div(z.re, ctor.absValue(z)), 0)
                : new ctor((rctor as RealInterfaceStatic<REAL>).div(z.re, ctor.absValue(z)), (rctor as RealInterfaceStatic<REAL>).div(z.im, ctor.absValue(z)));
        }
    };

/**
 * Factory for `ctor.sqrt` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.sqrt` method.
 */
export const sqrtFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Square root.
     * @param z Value.
     * @returns Square root of z.
     */
    (z: COMPLEX): COMPLEX => {
        const mod_z = ctor.absValue(z);
        const arg_z = (rctor as RealInterfaceStatic<REAL>).atan2(ctor.imagIsZero(z) ? (rctor as RealInterfaceStatic<REAL>).ZERO : z.im, z.re);
        return new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul(
                (rctor as RealInterfaceStatic<REAL>).sqrt(mod_z),
                (rctor as RealInterfaceStatic<REAL>).cos((rctor as RealInterfaceStatic<REAL>).div(arg_z, (rctor as RealInterfaceStatic<REAL>).TWO)),
            ),
            (rctor as RealInterfaceStatic<REAL>).mul(
                (rctor as RealInterfaceStatic<REAL>).sqrt(mod_z),
                (rctor as RealInterfaceStatic<REAL>).sin((rctor as RealInterfaceStatic<REAL>).div(arg_z, (rctor as RealInterfaceStatic<REAL>).TWO)),
            ),
        );
    };

/**
 * Factory for `ctor.exp` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.exp` method.
 */
export const expFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Exponential
     * @param z Value.
     * @returns Exponential of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).exp(z.re), (rctor as RealInterfaceStatic<REAL>).cos(z.im)),
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).exp(z.re), (rctor as RealInterfaceStatic<REAL>).sin(z.im)),
        );

/**
 * Factory for `ctor.log` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.log` method.
 */
export const logFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Natural logarithm.
     * @param z Value.
     * @returns Natural logarithm of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).ln(ctor.absValue(z)),
            (rctor as RealInterfaceStatic<REAL>).atan2(ctor.imagIsZero(z) ? (rctor as RealInterfaceStatic<REAL>).ZERO : z.im, z.re),
        );

/**
 * Factory for `ctor.logb` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.logb` method.
 */
export const logbFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((b: COMPLEX, l: COMPLEX) => COMPLEX) =>
    /**
     * Compute the log using a specified base.
     * @param b Base.
     * @param l Value.
     * @returns Logarith base b of l.
     */
    (b: COMPLEX, l: COMPLEX): COMPLEX => {
        const mod_b = ctor.absValue(b);
        if ((rctor as RealInterfaceStatic<REAL>).isZero(mod_b)) {
            return ctor.zero();
        } else {
            const arg_b = (rctor as RealInterfaceStatic<REAL>).atan2(ctor.imagIsZero(b) ? (rctor as RealInterfaceStatic<REAL>).ZERO : b.im, b.re);
            const mod_l = ctor.absValue(l);
            const arg_l = (rctor as RealInterfaceStatic<REAL>).atan2(ctor.imagIsZero(l) ? (rctor as RealInterfaceStatic<REAL>).ZERO : l.im, l.re);
            const denom = (rctor as RealInterfaceStatic<REAL>).add(
                (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).ln(mod_b), (rctor as RealInterfaceStatic<REAL>).ln(mod_b)),
                (rctor as RealInterfaceStatic<REAL>).mul(arg_b, arg_b),
            );
            return new ctor(
                (rctor as RealInterfaceStatic<REAL>).div(
                    (rctor as RealInterfaceStatic<REAL>).add(
                        (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).ln(mod_l), (rctor as RealInterfaceStatic<REAL>).ln(mod_b)),
                        (rctor as RealInterfaceStatic<REAL>).mul(arg_l, arg_b),
                    ),
                    denom,
                ),
                (rctor as RealInterfaceStatic<REAL>).div(
                    (rctor as RealInterfaceStatic<REAL>).sub(
                        (rctor as RealInterfaceStatic<REAL>).mul(arg_l, (rctor as RealInterfaceStatic<REAL>).ln(mod_b)),
                        (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).ln(mod_l), arg_b),
                    ),
                    denom,
                ),
            );
        }
    };

/**
 * Factory for `ctor.log2` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.log2` method.
 */
export const log2Factory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Base 2 logarithm
     * @param z Value
     * @returns logarithm base 2 of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.logb(new ctor(2), z);

/**
 * Factory for `ctor.log2` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.log2` method.
 */
export const log10Factory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Base 2 logarithm
     * @param z Value
     * @returns logarithm base 2 of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.logb(new ctor(10), z);

/**
 * Factory for `ctor.deg2rad` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.deg2rad` method.
 */
export const deg2radFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Convert angle from degrees to radians.
     * @param z Angle in degrees.
     * @returns Angle in radians.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).div((rctor as RealInterfaceStatic<REAL>).PI, (rctor as RealInterfaceStatic<REAL>).PI_DEG), z.re),
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).div((rctor as RealInterfaceStatic<REAL>).PI, (rctor as RealInterfaceStatic<REAL>).PI_DEG), z.im),
        );

/**
 * Factory for `ctor.rad2deg` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.rad2deg` method.
 */
export const rad2degFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Convert angle from radians to degrees.
     * @param z Angle in radians.
     * @returns Angle in degrees.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).div((rctor as RealInterfaceStatic<REAL>).PI_DEG, (rctor as RealInterfaceStatic<REAL>).PI), z.re),
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).div((rctor as RealInterfaceStatic<REAL>).PI_DEG, (rctor as RealInterfaceStatic<REAL>).PI), z.im),
        );

/**
 * Factory for `ctor.sin` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.sin` method.
 */
export const sinFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trignometric sine.
     * @param z Argument in radians.
     * @returns Sine of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).sin(z.re), (rctor as RealInterfaceStatic<REAL>).cosh(z.im)),
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).cos(z.re), (rctor as RealInterfaceStatic<REAL>).sinh(z.im)),
        );

/**
 * Factory for `ctor.sind` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.sind` method.
 */
export const sindFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trignometric sine in degrees.
     * @param z Argument in degrees.
     * @returns Sine of z
     */
    (z: COMPLEX): COMPLEX =>
        ctor.sin(ctor.deg2rad(z));

/**
 * Factory for `ctor.cos` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.cos` method.
 */
export const cosFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trignometric cosine.
     * @param z Argument in radians.
     * @returns Cosine of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).cos(z.re), (rctor as RealInterfaceStatic<REAL>).cosh(z.im)),
            (rctor as RealInterfaceStatic<REAL>).mul(
                (rctor as RealInterfaceStatic<REAL>).sin(z.re),
                (rctor as RealInterfaceStatic<REAL>).neg((rctor as RealInterfaceStatic<REAL>).sinh(z.im)),
            ),
        );

/**
 * Factory for `ctor.cosd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.cosd` method.
 */
export const cosdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trignometric cosine in degrees.
     * @param z Argument in degrees.
     * @returns Cosine of z
     */
    (z: COMPLEX): COMPLEX =>
        ctor.cos(ctor.deg2rad(z));

/**
 * Factory for `ctor.tan` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.tan` method.
 */
export const tanFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric tangent. Implemented as: tan(z) = sin(z)/cos(z)
     * @param z Argument in radians.
     * @returns Tangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.sin(z), ctor.cos(z));

/**
 * Factory for `ctor.tand` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.tand` method.
 */
export const tandFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric tangent in degrees.
     * @param z Argument in degrees.
     * @returns Tangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.tan(ctor.deg2rad(z));

/**
 * Factory for `ctor.csc` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.csc` method.
 */
export const cscFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric cosecant. Implemented as csc(z)=1/sin(z)
     * @param z Argument in radians.
     * @returns Cosecant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.one(), ctor.sin(z));

/**
 * Factory for `ctor.cscd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.cscd` method.
 */
export const cscdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric cosecant in degrees.
     * @param z Argument in degrees.
     * @returns Cosecant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.csc(ctor.deg2rad(z));

/**
 * Factory for `ctor.sec` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.sec` method.
 */
export const secFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric secant. Implemented as: sec(z) = 1/cos(z)
     * @param z Argument in radians.
     * @returns Secant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.one(), ctor.cos(z));

/**
 * Factory for `ctor.secd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.secd` method.
 */
export const secdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric secant in degrees.
     * @param z Argument in degrees.
     * @returns Secant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.sec(ctor.deg2rad(z));

/**
 * Factory for `ctor.cot` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.cot` method.
 */
export const cotFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric cotangent. Implemented as: cot(z) = cos(z)/sin(z)
     * @param z Argument in radians.
     * @returns Cotangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.cos(z), ctor.sin(z));

/**
 * Factory for `ctor.cotd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.cotd` method.
 */
export const cotdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Trigonometric cotangent in degrees.
     * @param z Argument in degrees.
     * @returns Cotangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.cos(z), ctor.sin(z));

/**
 * Factory for `ctor.asin` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.asin` method.
 */
export const asinFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) sine. Implemented as: asin(z) = I*ln(sqrt(1-z^2)-I*z)
     * @param z Argument (unitless).
     * @returns Inverse sine of z in radians.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.mul(ctor.onei(), ctor.log(ctor.sub(ctor.sqrt(ctor.sub(ctor.one(), ctor.power(z, ctor.two()))), ctor.mul(ctor.onei(), z))));

/**
 * Factory for `ctor.asind` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.asind` method.
 */
export const asindFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) sine in degrees.
     * @param z Argument (unitless).
     * @returns Inverse sine of z in degrees.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rad2deg(ctor.asin(z));

/**
 * Factory for `ctor.acos` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acos` method.
 */
export const acosFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) cosine. Implemented as: acos(z) = pi/2-asin(z)
     * @param z Argument (unitless).
     * @returns Inverse cosine of z in radians.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.sub(ctor.pidiv2(), ctor.asin(z));

/**
 * Factory for `ctor.acosd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acosd` method.
 */
export const acosdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) cosine in degrees.
     * @param z Argument (unitless).
     * @returns Inverse cosine of z in degrees.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rad2deg(ctor.acos(z));

/**
 * Factory for `ctor.atan` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.atan` method.
 */
export const atanFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) tangent. Implemented as: atan(z) = -I/2*ln((I-z)/(I+z))
     * @param z Argument (unitless).
     * @returns Inverse tangent of z in radians.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.mul(ctor.minusonediv2i(), ctor.log(ctor.rdiv(ctor.sub(ctor.onei(), z), ctor.add(ctor.onei(), z))));

/**
 * Factory for `ctor.atand` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.atand` method.
 */
export const atandFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) tangent in degrees.
     * @param z Argument (unitless).
     * @returns Inverse tangent of z in degrees.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rad2deg(ctor.atan(z));

/**
 * Factory for `ctor.acsc` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acsc` method.
 */
export const acscFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) cosecant. Implemented as: acsc(z) = asin(1/z)
     * @param z Argument (unitless).
     * @returns Inverse cosecant of z in radians.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.asin(ctor.rdiv(ctor.one(), z));

/**
 * Factory for `ctor.acscd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acscd` method.
 */
export const acscdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) cosecant in degrees.
     * @param z Argument (unitless).
     * @returns Inverse cosecant of z in degrees.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rad2deg(ctor.acsc(z));

/**
 * Factory for `ctor.asec` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.asec` method.
 */
export const asecFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) secant. Implemented as: asec(z) = acos(1/z)
     * @param z Argument (unitless).
     * @returns Inverse secant of z in radians.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.acos(ctor.rdiv(ctor.one(), z));

/**
 * Factory for `ctor.asecd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.asecd` method.
 */
export const asecdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) secant in degrees.
     * @param z Argument (unitless).
     * @returns Inverse secant of z in degrees.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rad2deg(ctor.asec(z));

/**
 * Factory for `ctor.acot` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acot` method.
 */
export const acotFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) cotangent. Implemented as: acot(z) = atan(1/z)
     * @param z Argument (unitless).
     * @returns Inverse cotangent of z in radians.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.atan(ctor.rdiv(ctor.one(), z));

/**
 * Factory for `ctor.acotd` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acotd` method.
 */
export const acotdFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (arc) cotangent in degrees.
     * @param z Argument (unitless).
     * @returns Inverse cotangent of z in degrees.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rad2deg(ctor.acot(z));

/**
 * Factory for `ctor.sinh` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.sinh` method.
 */
export const sinhFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Hyperbolic sine.
     * @param z Argument.
     * @returns Hyperbolic sine of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).sinh(z.re), (rctor as RealInterfaceStatic<REAL>).cos(z.im)),
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).cosh(z.re), (rctor as RealInterfaceStatic<REAL>).sin(z.im)),
        );

/**
 * Factory for `ctor.cosh` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.cosh` method.
 */
export const coshFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Hyperbolic cosine.
     * @param z Argument.
     * @returns Hyperbolic cosine of z.
     */
    (z: COMPLEX): COMPLEX =>
        new ctor(
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).cosh(z.re), (rctor as RealInterfaceStatic<REAL>).cos(z.im)),
            (rctor as RealInterfaceStatic<REAL>).mul((rctor as RealInterfaceStatic<REAL>).sinh(z.re), (rctor as RealInterfaceStatic<REAL>).sin(z.im)),
        );

/**
 * Factory for `ctor.tanh` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.tanh` method.
 */
export const tanhFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Hyperbolic tangent. Implemented as: tanh(z) = sinh(z)/cosh(z)
     * @param z Argument.
     * @returns Hyperbolic tangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.sinh(z), ctor.cosh(z));

/**
 * Factory for `ctor.csch` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.csch` method.
 */
export const cschFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Hyperbolic cosecant. Implemented as: csch(z) = 1/sinh(z)
     * @param z Argument.
     * @returns Hyperbolic cosecant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.one(), ctor.sinh(z));

/**
 * Factory for `ctor.sech` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.sech` method.
 */
export const sechFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Hyperbolic secant. Implemented as: sech(z) = 1/cosh(z)
     * @param z Argument.
     * @returns Hyperbolic secant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.one(), ctor.cosh(z));

/**
 * Factory for `ctor.coth` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.coth` method.
 */
export const cothFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Hyperbolic cotangent. Implemented as: coth(z) = cosh(z)/sinh(z)
     * @param z Argument.
     * @returns Hyperbolic cotangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.cosh(z), ctor.sinh(z));

/**
 * Factory for `ctor.asinh` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.asinh` method.
 */
export const asinhFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (area) hyperbolic sine. Implemented as: asinh(z) = ln(sqrt(1+z^2)+z)
     * @param z Argument.
     * @returns Inverse hyperbolic sine of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.log(ctor.add(ctor.sqrt(ctor.add(ctor.one(), ctor.power(z, ctor.two()))), z));

/**
 * Factory for `ctor.acosh` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acosh` method.
 */
export const acoshFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (area) hyperbolic cosine. Implemented as: acosh(z) = ln(sqrt(-1+z^2)+z)
     * @param z Argument.
     * @returns Inverse hyperbolic cosine of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.log(ctor.add(ctor.sqrt(ctor.add(ctor.minusone(), ctor.power(z, ctor.two()))), z));

/**
 * Factory for `ctor.atanh` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.atanh` method.
 */
export const atanhFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (area) hyperbolic tangent. Implemented as: atanh(z) = 1/2*ln((1+z)/(1-z))
     * @param z Argument.
     * @returns Inverse hyperbolic tangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.mul(ctor.onediv2(), ctor.log(ctor.rdiv(ctor.add(ctor.one(), z), ctor.sub(ctor.one(), z))));

/**
 * Factory for `ctor.acsch` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acsch` method.
 */
export const acschFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (area) hyperbolic cosecant. Implemented as: acsch(z) = asinh(1/z)
     * @param z Argument.
     * @returns Inverse hyperbolic cosecant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.one(), ctor.asinh(z));

/**
 * Factory for `ctor.asech` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.asech` method.
 */
export const asechFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (area) hyperbolic secant. Implemented as: asech(z) = acosh(1/z)
     * @param z Argument.
     * @returns Inverse hyperbolic secant of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.one(), ctor.acosh(z));

/**
 * Factory for `ctor.acoth` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.acoth` method.
 */
export const acothFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Inverse (area) hyperbolic cotangent. Implemented as: acoth(z) = atanh(1/z)
     * @param z Argument.
     * @returns Inverse hyperbolic cotangent of z.
     */
    (z: COMPLEX): COMPLEX =>
        ctor.rdiv(ctor.one(), ctor.atanh(z));

/**
 * Factory for `ctor.gamma` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.gamma` method.
 */
export const gammaFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Compute the Gamma function.
     * The Gamma function is defined as integral with t from 0 to infinity of t^(z-1)*exp(-t)
     *
     * ## References
     * * https://rosettacode.org/wiki/Gamma_function#JavaScript
     * * https://en.wikipedia.org/wiki/Lanczos_approximation
     * * https://math.stackexchange.com/questions/19236/algorithm-to-compute-gamma-function
     * * https://en.wikipedia.org/wiki/Gamma_function#Stirling's_formula
     * * https://mathworld.wolfram.com/GammaFunction.html
     * * https://www.geeksforgeeks.org/gamma-function/
     * * https://octave.org/doxygen/dev/d0/d77/gamma_8f_source.html
     * @param z
     * @returns
     */
    (z: COMPLEX): COMPLEX => {
        const p = [
            '0.99999999999980993',
            '676.5203681218851',
            '-1259.1392167224028',
            '771.32342877765313',
            '-176.61502916214059',
            '12.507343278686905',
            '-0.13857109526572012',
            '9.9843695780195716e-6',
            '1.5056327351493116e-7',
        ];
        if (ctor.realLessThan(z, 0.5)) {
            // Euler's reflection formula.
            return ctor.rdiv(ctor.pi(), ctor.mul(ctor.sin(ctor.mul(ctor.pi(), z)), ctor.gamma(ctor.sub(ctor.one(), z))));
        } else {
            z = ctor.sub(z, ctor.one());
            let x = new ctor(p[0]);
            const t = ctor.add(z, new ctor(p.length - 1.5));
            for (let i = 1; i < p.length; i++) {
                x = ctor.add(x, ctor.rdiv(new ctor(p[i]), ctor.add(z, new ctor(i))));
            }
            return ctor.mul(ctor.mul(ctor.sqrt2pi(), ctor.power(t, ctor.add(z, new ctor(0.5)))), ctor.mul(ctor.exp(ctor.neg(t)), x));
        }
    };

/**
 * Factory for `ctor.factorial` method.
 * @param ctor Complex instance constructor.
 * @returns `ctor.factorial` method.
 */
export const factorialFactory =
    <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
        rctor: RealInterfaceStatic<REAL> | unknown,
        ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
    ): ((z: COMPLEX) => COMPLEX) =>
    /**
     * Factorial.
     * @param Z Argument.
     * @returns Factorial of z.
     */
    (z: COMPLEX): COMPLEX => {
        if (!(ctor.realGreaterThanOrEqualTo(z, 0) && ctor.realIsInteger(z) && ctor.imagIsZero(z))) {
            throw new Error('factorial: all N must be real non-negative integers');
        }
        const result = ctor.gamma(ctor.add(new ctor((rctor as RealInterfaceStatic<REAL>).round(z.re)), ctor.one()));
        ctor.realApply(result, ctor.applyFunction.trunc);
        return result;
    };

/**
 * Factory for `ctor.applyFunction` property.
 * @param ctor Complex instance constructor.
 * @returns `ctor.applyFunction` property.
 */
export const applyFunctionFactory = <REAL>(rctor: RealInterfaceStatic<REAL> | unknown): PartApplyComplexHandlerTable<REAL> => ({
    fix: (n: REAL) => (rctor as RealInterfaceStatic<REAL>).trunc(n),
    ceil: (n: REAL) => (rctor as RealInterfaceStatic<REAL>).ceil(n),
    floor: (n: REAL) => (rctor as RealInterfaceStatic<REAL>).floor(n),
    round: (n: REAL) => (rctor as RealInterfaceStatic<REAL>).round(n),
    sign: (n: REAL) => (rctor as RealInterfaceStatic<REAL>).create((rctor as RealInterfaceStatic<REAL>).sign(n)),
    trunc: (n: REAL) => (rctor as RealInterfaceStatic<REAL>).trunc(n),
});

export const mapFunctionFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): Record<string, (z: COMPLEX) => COMPLEX> =>
    /**
     * Functions with one argument (mappers)
     */
    ({
        real: ctor.real,
        imag: ctor.imag,
        logical: ctor.logical,
        abs: ctor.abs,
        arg: ctor.arg,
        conj: ctor.conj,
        fix: ctor.fix,
        ceil: ctor.ceil,
        floor: ctor.floor,
        round: ctor.round,
        sign: ctor.sign,
        sqrt: ctor.sqrt,
        exp: ctor.exp,
        log: ctor.log,
        log2: ctor.log2,
        log10: ctor.log10,
        deg2rad: ctor.deg2rad,
        rad2deg: ctor.rad2deg,
        sin: ctor.sin,
        sind: ctor.sind,
        cos: ctor.cos,
        cosd: ctor.cosd,
        tan: ctor.tan,
        tand: ctor.tand,
        csc: ctor.csc,
        cscd: ctor.cscd,
        sec: ctor.sec,
        secd: ctor.secd,
        cot: ctor.cot,
        cotd: ctor.cotd,
        asin: ctor.asin,
        asind: ctor.asind,
        acos: ctor.acos,
        acosd: ctor.acosd,
        atan: ctor.atan,
        atand: ctor.atand,
        acsc: ctor.acsc,
        acscd: ctor.acscd,
        asec: ctor.asec,
        asecd: ctor.asecd,
        acot: ctor.acot,
        acotd: ctor.acotd,
        sinh: ctor.sinh,
        cosh: ctor.cosh,
        tanh: ctor.tanh,
        csch: ctor.csch,
        sech: ctor.sech,
        coth: ctor.coth,
        asinh: ctor.asinh,
        acosh: ctor.acosh,
        atanh: ctor.atanh,
        acsch: ctor.acsch,
        asech: ctor.asech,
        acoth: ctor.acoth,
        gamma: ctor.gamma,
        factorial: ctor.factorial,
    });

export const twoArgFunctionFactory = <REAL, COMPLEX extends ComplexInterface<REAL, TYPE, PARENT>, TYPE = number, PARENT = unknown, PRECEDENCE = number, ROUNDING = Rounding, MODULO = Modulo>(
    ctor: ComplexInterfaceStatic<REAL, COMPLEX, TYPE, PARENT, PRECEDENCE, ROUNDING, MODULO>,
): Record<string, (x: COMPLEX, y: COMPLEX) => COMPLEX> =>
    /**
     * Functions with two arguments.
     */
    ({
        root: ctor.root,
        hypot: ctor.hypot,
        power: ctor.power,
        logb: ctor.logb,
    });
