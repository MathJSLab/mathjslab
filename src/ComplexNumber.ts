import * as TypeOfComplex from './ComplexInterface';
import { Evaluator } from './Evaluator';

const defaultSettings: Partial<TypeOfComplex.ComplexConfig> = {
    precision: 15 /* 16 can be used too, but 15 ensures compatibility */,
    precisionCompare: 0,
    rounding: TypeOfComplex.roundingMode.ROUND_HALF_EVEN as TypeOfComplex.Rounding,
    toExpPos: 21,
    toExpNeg: -7,
    minE: -324,
    maxE: 308,
    modulo: TypeOfComplex.roundingMode.ROUND_DOWN,
    crypto: false,
};

/**
 * Native `Math` object extensions for factories compatibility.
 */
(Math as any).add = (a: number, b: number) => a + b;
(Math as any).sub = (a: number, b: number) => a - b;
(Math as any).neg = (x: number) => -x;
(Math as any).mul = (a: number, b: number) => a * b;
(Math as any).div = (a: number, b: number) => a / b;
(Math as any).mod = (a: number, b: number) => a % b;
(Math as any).ln = Math.log;
(Math as any).create = (x: number | string) => Number(x);
(Math as any).MINUSONE = -1;
(Math as any).ZERO = 0;
(Math as any).TWO = 2;
(Math as any).PI_DEG = 180;
(Math as any).INF = Infinity;
(Math as any).unparse = (value: number) => (value === 0 ? (Object.is(value, -0) ? '-0' : '0') : value.toString());
(Math as any).isZero = (x: number) => x === 0;
(Math as any).isNeg = (x: number) => (x === 0 ? Object.is(x, -0) : x < 0);
(Math as any).isNaN = Number.isNaN;
(Math as any).isFinite = Number.isFinite;

/**
 * # ComplexNumber
 *
 * An native `number` type complex number library.
 *
 * ## References
 * * https://mathworld.wolfram.com/ComplexNumber.html
 */
class ComplexNumber implements TypeOfComplex.ComplexInterface<number, number, unknown> {
    public static readonly LOGICAL = TypeOfComplex.numberClass.LOGICAL;
    public static readonly REAL = TypeOfComplex.numberClass.REAL;
    public static readonly COMPLEX = TypeOfComplex.numberClass.COMPLEX;

    public static readonly defaultSettings: TypeOfComplex.ComplexConfig = Object.assign({}, defaultSettings as TypeOfComplex.ComplexConfig);
    public static readonly settings: TypeOfComplex.ComplexConfig = this.defaultSettings;

    public static readonly isInstanceOf = (value: unknown): boolean => value instanceof ComplexNumber;

    public static readonly set = (config: Partial<TypeOfComplex.ComplexConfig>): void => {};

    public re: number;
    public im: number;
    public type: number;
    public parent: any;

    public static readonly setNumberType: TypeOfComplex.OneArgNoReturnComplexHandler<number, ComplexNumber> = TypeOfComplex.setNumberTypeFactory<number, ComplexNumber, number, unknown>(
        ComplexNumber,
    );

    public constructor(re?: TypeOfComplex.NumLike<number>, im?: TypeOfComplex.NumLike<number>, type?: TypeOfComplex.NumType<number>, parent?: TypeOfComplex.NumParent<unknown>) {
        this.re = re ? Number(re) : 0;
        this.im = im ? Number(im) : 0;
        this.type = type ?? ComplexNumber.COMPLEX;
        if (parent) {
            this.parent = parent;
        }
        ComplexNumber.setNumberType(this);
    }

    public static readonly create = (
        re?: TypeOfComplex.NumLike<number>,
        im?: TypeOfComplex.NumLike<number>,
        type?: TypeOfComplex.NumType<number>,
        parent?: TypeOfComplex.NumParent<unknown>,
    ): ComplexNumber => new ComplexNumber(re, im, type, parent);
    public static readonly realSet = (value: ComplexNumber, re: TypeOfComplex.NumLike<number>): void => {
        value.re = Number(re);
    };
    public static readonly imagSet = (value: ComplexNumber, im: TypeOfComplex.NumLike<number>): void => {
        value.im = Number(im);
    };
    public static readonly realApply = (value: ComplexNumber, func: (re: number) => number): void => {
        value.re = func(value.re);
    };
    public static readonly imagApply = (value: ComplexNumber, func: (im: number) => number): void => {
        value.im = func(value.im);
    };
    public static readonly from = (obj: ComplexNumber): ComplexNumber => new ComplexNumber(obj.re, obj.im, obj.type);
    public static readonly real = (z: ComplexNumber): ComplexNumber => new ComplexNumber(z.re);
    public static readonly imag = (z: ComplexNumber): ComplexNumber => new ComplexNumber(z.im);
    public static readonly realIsInteger = (z: ComplexNumber): boolean => Number.isInteger(z.re);
    public static readonly imagIsInteger = (z: ComplexNumber): boolean => Number.isInteger(z.im);
    public static readonly realIsFinite = (z: ComplexNumber): boolean => Number.isFinite(z.re);
    public static readonly imagIsFinite = (z: ComplexNumber): boolean => Number.isFinite(z.im);
    public static readonly realIsNaN = (z: ComplexNumber): boolean => Number.isNaN(z.re);
    public static readonly imagIsNaN = (z: ComplexNumber): boolean => Number.isNaN(z.im);
    public static readonly realIsNegative = (z: ComplexNumber): boolean => z.re < 0 || Object.is(z.re, -0);
    public static readonly imagIsNegative = (z: ComplexNumber): boolean => z.im < 0 || Object.is(z.im, -0);
    public static readonly realIsZero = (z: ComplexNumber): boolean => z.re === 0;
    public static readonly imagIsZero = (z: ComplexNumber): boolean => z.im === 0;
    public static readonly realIsPositive = (z: ComplexNumber): boolean => z.re >= 0;
    public static readonly imagIsPositive = (z: ComplexNumber): boolean => z.im >= 0;
    public static readonly realToNumber = (z: ComplexNumber): number => z.re;
    public static readonly imagToNumber = (z: ComplexNumber): number => z.im;
    public static readonly realLessThan = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.re < Number(value);
    public static readonly imagLessThan = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.im < Number(value);
    public static readonly realLessThanOrEqualTo = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.re <= Number(value);
    public static readonly imagLessThanOrEqualTo = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.im <= Number(value);
    public static readonly realEquals = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.re === Number(value);
    public static readonly imagEquals = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.im === Number(value);
    public static readonly realGreaterThanOrEqualTo = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.re >= Number(value);
    public static readonly imagGreaterThanOrEqualTo = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.im >= Number(value);
    public static readonly realGreaterThan = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.re > Number(value);
    public static readonly imagGreaterThan = (z: ComplexNumber, value: TypeOfComplex.NumLike<number>): boolean => z.im > Number(value);

    public static readonly parse: TypeOfComplex.ParseComplexHandler<number, ComplexNumber> = TypeOfComplex.parseFactory<number, ComplexNumber>(ComplexNumber);
    public static readonly unparseValue: TypeOfComplex.UnparseValueComplexHandler<number> = TypeOfComplex.unparseValueFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static readonly unparse: TypeOfComplex.UnparseComplexHandler<number, ComplexNumber> = TypeOfComplex.unparseFactory<number, ComplexNumber>(ComplexNumber);

    public unparse(): string {
        return ComplexNumber.unparse(this, 0);
    }

    public static readonly unparseMathMLValue: TypeOfComplex.UnparseValueComplexHandler<number> = TypeOfComplex.unparseMathMLValueFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static readonly precedence: TypeOfComplex.PrecedenceComplexHandler<number, ComplexNumber, Evaluator, number> = TypeOfComplex.precedenceFactory<
        number,
        ComplexNumber,
        number,
        unknown
    >(ComplexNumber);
    public static readonly unparseMathML: TypeOfComplex.UnparseMathMLComplexHandler<number, ComplexNumber, Evaluator, number> = TypeOfComplex.unparseMathMLFactory<
        number,
        ComplexNumber,
        number,
        unknown
    >(ComplexNumber);

    public static copy: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.copyFactory<number, ComplexNumber>(ComplexNumber);

    public copy = (): ComplexNumber => new ComplexNumber(this.re, this.im, this.type);

    public static toMaxPrecisionValue: TypeOfComplex.OneArgValueComplexHandler<number> = (value: number): number => {
        const precision = this.settings.precision - this.settings.precisionCompare;
        return Number(Number(value.toPrecision(precision)).toFixed(precision));
    };

    public static toMaxPrecision: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.toMaxPrecisionFactory<number, ComplexNumber>(ComplexNumber);

    public static epsilonValue(): number {
        return Math.pow(10, -this.settings.precision + this.settings.precisionCompare!);
    }

    public static epsilon: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.epsilonFactory<number, ComplexNumber>(ComplexNumber);

    public static random: TypeOfComplex.RandomComplexHandler<number, ComplexNumber> = (significantDigits?: number): ComplexNumber => {
        if (typeof significantDigits !== 'undefined' && significantDigits !== 15) {
            if (significantDigits < 15) {
                return new ComplexNumber(Math.random().toPrecision(significantDigits));
            } else {
                throw new Error(`invalid number of significant digits: ${significantDigits}`);
            }
        } else {
            return new ComplexNumber(Math.random());
        }
    };

    public static eq: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.equalsFactory<number, ComplexNumber>(ComplexNumber, true);
    public static ne: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.equalsFactory<number, ComplexNumber>(ComplexNumber, false);
    public static compareValue: TypeOfComplex.CompareValueComplexHandler<number> = (cmp: TypeOfComplex.TCompareOperationName, left: number, right: number) => {
        switch (cmp) {
            case 'lt':
                return left < right;
            case 'lte':
                return left <= right;
            case 'eq':
                return left === right;
            case 'gte':
                return left >= right;
            case 'gt':
                return left > right;
        }
    };
    public static cmp: TypeOfComplex.CmpComplexHandler<number, ComplexNumber> = TypeOfComplex.cmpFactory<number, ComplexNumber>(ComplexNumber);
    public static minMaxArrayReal: TypeOfComplex.MinMaxArrayComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxArrayRealFactory<number, ComplexNumber>(ComplexNumber);
    public static minMaxArrayRealWithIndex: TypeOfComplex.MinMaxArrayWithIndexComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxArrayRealWithIndexFactory<number, ComplexNumber>(
        ComplexNumber,
    );
    public static minMaxArrayComplex: TypeOfComplex.MinMaxArrayComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxArrayComplexFactory<number, ComplexNumber>(ComplexNumber);
    public static minMaxArrayComplexWithIndex: TypeOfComplex.MinMaxArrayWithIndexComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxArrayComplexWithIndexFactory<
        number,
        ComplexNumber
    >(ComplexNumber);
    public static min: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxFactory<number, ComplexNumber>(ComplexNumber, 'lt');
    public static minWise: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxWiseFactory<number, ComplexNumber>(ComplexNumber, 'lt');
    public static max: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxFactory<number, ComplexNumber>(ComplexNumber, 'gte');
    public static maxWise: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.minMaxWiseFactory<number, ComplexNumber>(ComplexNumber, 'gte');
    public static lt: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.comparisonFactory<number, ComplexNumber>(ComplexNumber, 'lt');
    public static le: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.comparisonFactory<number, ComplexNumber>(ComplexNumber, 'lte');
    public static gt: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.comparisonFactory<number, ComplexNumber>(ComplexNumber, 'gt');
    public static ge: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.comparisonFactory<number, ComplexNumber>(ComplexNumber, 'gte');
    public static false: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = (): ComplexNumber => new ComplexNumber(0, 0, ComplexNumber.LOGICAL);
    public static true: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = (): ComplexNumber => new ComplexNumber(1, 0, ComplexNumber.LOGICAL);
    public static logical: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.logicalFactory<number, ComplexNumber>(ComplexNumber);
    public static toLogical: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = (value: ComplexNumber): ComplexNumber => ComplexNumber.logical(value);
    public toLogical: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = (): ComplexNumber => ComplexNumber.logical(this);
    public static and: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.andFactory<number, ComplexNumber>(ComplexNumber);
    public static or: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.orFactory<number, ComplexNumber>(ComplexNumber);
    public static xor: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.xorFactory<number, ComplexNumber>(ComplexNumber);
    public static not: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.notFactory<number, ComplexNumber>(ComplexNumber);
    public static zero: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 0, 0);
    public static one: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 1, 0);
    public static onediv2: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 1 / 2, 0);
    public static minusonediv2: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, -1 / 2, 0);
    public static minusone: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, -1, 0);
    public static pi: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, Math.PI, 0);
    public static pidiv2: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, Math.PI / 2, 0);
    public static onei: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 0, 1);
    public static onediv2i: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 0, 1 / 2);
    public static minusonediv2i: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 0, -1 / 2);
    public static minusonei: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 0, -1);
    public static two: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, 2, 0);
    public static sqrt2pi: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, Math.sqrt(2 * Math.PI), 0);
    public static e: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, Math.E, 0);
    public static NaN_0: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, NaN, 0);
    public static inf_0: TypeOfComplex.NoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.literalFactory<number, ComplexNumber>(ComplexNumber, Infinity, 0);

    public static add: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = (left: ComplexNumber, right: ComplexNumber): ComplexNumber =>
        new ComplexNumber(left.re + right.re, left.im + right.im);
    public static sub: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = (left: ComplexNumber, right: ComplexNumber): ComplexNumber =>
        new ComplexNumber(left.re - right.re, left.im - right.im);
    public static neg: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = (z: ComplexNumber): ComplexNumber => new ComplexNumber(-z.re, -z.im);

    public static mul: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.mulFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static rdiv: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.rdivFactory<number, ComplexNumber>(Math, ComplexNumber);

    public static ldiv: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = ComplexNumber.rdiv;

    public static inv: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.invFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static power: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.powerFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static root: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.rootFactory<number, ComplexNumber>(ComplexNumber);
    public static absValue: TypeOfComplex.AbsoluteValueComplexHandler<number, ComplexNumber> = TypeOfComplex.absValueFactory<number, ComplexNumber>(Math);
    public static abs: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.absFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static hypot: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.hypotFactory<number, ComplexNumber>(ComplexNumber);
    public static arg: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.argFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static conj: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.conjFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static mod: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.modFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static rem: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.remFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static fix: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.fixFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static ceil: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.ceilFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static floor: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.floorFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static round: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.roundFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static sign: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.signFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static sqrt: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.sqrtFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static exp: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.expFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static log: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.logFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static logb: TypeOfComplex.TwoArgComplexHandler<number, ComplexNumber> = TypeOfComplex.logbFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static log2: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.log2Factory<number, ComplexNumber>(ComplexNumber);
    public static log10: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.log10Factory<number, ComplexNumber>(ComplexNumber);
    public static deg2rad: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.deg2radFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static rad2deg: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.rad2degFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static sin: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.sinFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static sind: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.sindFactory<number, ComplexNumber>(ComplexNumber);
    public static cos: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cosFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static cosd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cosdFactory<number, ComplexNumber>(ComplexNumber);
    public static tan: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.tanFactory<number, ComplexNumber>(ComplexNumber);
    public static tand: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.tandFactory<number, ComplexNumber>(ComplexNumber);
    public static csc: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cscFactory<number, ComplexNumber>(ComplexNumber);
    public static cscd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cscdFactory<number, ComplexNumber>(ComplexNumber);
    public static sec: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.secFactory<number, ComplexNumber>(ComplexNumber);
    public static secd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.secdFactory<number, ComplexNumber>(ComplexNumber);
    public static cot: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cotFactory<number, ComplexNumber>(ComplexNumber);
    public static cotd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cotdFactory<number, ComplexNumber>(ComplexNumber);
    public static asin: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.asinFactory<number, ComplexNumber>(ComplexNumber);
    public static asind: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.asindFactory<number, ComplexNumber>(ComplexNumber);
    public static acos: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acosFactory<number, ComplexNumber>(ComplexNumber);
    public static acosd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acosdFactory<number, ComplexNumber>(ComplexNumber);
    public static atan: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.atanFactory<number, ComplexNumber>(ComplexNumber);
    public static atand: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.atandFactory<number, ComplexNumber>(ComplexNumber);
    public static acsc: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acscFactory<number, ComplexNumber>(ComplexNumber);
    public static acscd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acscdFactory<number, ComplexNumber>(ComplexNumber);
    public static asec: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.asecFactory<number, ComplexNumber>(ComplexNumber);
    public static asecd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.asecdFactory<number, ComplexNumber>(ComplexNumber);
    public static acot: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acotFactory<number, ComplexNumber>(ComplexNumber);
    public static acotd: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acotdFactory<number, ComplexNumber>(ComplexNumber);
    public static sinh: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.sinhFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static cosh: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.coshFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static tanh: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.tanhFactory<number, ComplexNumber>(ComplexNumber);
    public static csch: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cschFactory<number, ComplexNumber>(ComplexNumber);
    public static sech: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.sechFactory<number, ComplexNumber>(ComplexNumber);
    public static coth: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.cothFactory<number, ComplexNumber>(ComplexNumber);
    public static asinh: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.asinhFactory<number, ComplexNumber>(ComplexNumber);
    public static acosh: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acoshFactory<number, ComplexNumber>(ComplexNumber);
    public static atanh: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.atanhFactory<number, ComplexNumber>(ComplexNumber);
    public static acsch: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acschFactory<number, ComplexNumber>(ComplexNumber);
    public static asech: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.asechFactory<number, ComplexNumber>(ComplexNumber);
    public static acoth: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.acothFactory<number, ComplexNumber>(ComplexNumber);
    public static gamma: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.gammaFactory<number, ComplexNumber>(ComplexNumber);
    public static factorial: TypeOfComplex.OneArgComplexHandler<number, ComplexNumber> = TypeOfComplex.factorialFactory<number, ComplexNumber>(Math, ComplexNumber);
    public static readonly applyFunction: TypeOfComplex.PartApplyComplexHandlerTable<number> = TypeOfComplex.applyFunctionFactory<number>(Math);
    public static mapFunction: Record<string, (z: ComplexNumber) => ComplexNumber> = TypeOfComplex.mapFunctionFactory<number, ComplexNumber>(ComplexNumber);
    public static twoArgFunction: Record<string, (x: ComplexNumber, y: ComplexNumber) => ComplexNumber> = TypeOfComplex.twoArgFunctionFactory<number, ComplexNumber>(ComplexNumber);
}

/**
 * The static type ensures compatibility with the contract (TypeOfComplex.ComplexInterface).
 */
type ComplexNumberStatic = typeof ComplexNumber extends TypeOfComplex.ComplexInterfaceStatic<number, ComplexNumber> ? typeof ComplexNumber : never;

/**
 * Initial setup.
 */
ComplexNumber.set(ComplexNumber.defaultSettings);

export { type ComplexNumberStatic, ComplexNumber };

export default { ComplexNumber };
