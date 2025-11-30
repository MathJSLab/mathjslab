import { Decimal } from 'decimal.js';

import * as TypeOfComplex from './ComplexInterface';
import { Evaluator } from './Evaluator';

const defaultSettings: Partial<TypeOfComplex.ComplexConfig> = {
    precision: 336,
    rounding: Decimal.ROUND_HALF_DOWN,
    toExpPos: 20,
    toExpNeg: -7,
    minE: -9e15,
    maxE: 9e15,
    modulo: Decimal.ROUND_DOWN,
    crypto: false,
};

Decimal.set(defaultSettings);

/**
 * `Decimal` object extensions for factories compatibility.
 */
(Decimal as any).create = (x: Decimal | number | string) => new Decimal(x);
(Decimal as any).neg = (x: Decimal) => x.neg();
(Decimal as any).MINUSONE = new Decimal(-1);
(Decimal as any).ZERO = new Decimal(0);
(Decimal as any).TWO = new Decimal(2);
(Decimal as any).PI = Decimal.acos(-1);
(Decimal as any).PI_DEG = new Decimal(180);
(Decimal as any).INF = new Decimal(Infinity);
(Decimal as any).unparse = (value: Decimal) => value.valueOf();
(Decimal as any).isZero = (x: Decimal) => x.isZero();
(Decimal as any).isNeg = (x: Decimal) => x.isNeg();
(Decimal as any).isNaN = (x: Decimal) => x.isNaN();
(Decimal as any).isFinite = (x: Decimal) => x.isFinite();

/**
 * # `ComplexDecimal`
 *
 * An arbitrary precision complex number library.
 *
 * ## References
 * * https://mathworld.wolfram.com/ComplexNumber.html
 */
class ComplexDecimal implements TypeOfComplex.ComplexInterface<Decimal, number, unknown> {
    public static readonly LOGICAL = TypeOfComplex.numberClass.LOGICAL;
    public static readonly REAL = TypeOfComplex.numberClass.REAL;
    public static readonly COMPLEX = TypeOfComplex.numberClass.COMPLEX;

    public static readonly defaultSettings: TypeOfComplex.ComplexConfig = Object.assign({ precisionCompare: 7 }, defaultSettings as TypeOfComplex.ComplexConfig);
    public static readonly settings: TypeOfComplex.ComplexConfig = ComplexDecimal.defaultSettings;

    public static readonly isInstanceOf: TypeOfComplex.IsInstanceOfComplexHandler<ComplexDecimal> = (value: unknown): value is ComplexDecimal => value instanceof ComplexDecimal;

    public static readonly set: TypeOfComplex.SetComplexHandler = (config: Partial<TypeOfComplex.ComplexConfig>): void => {
        const decimal: Decimal.Config = {};
        TypeOfComplex.ComplexConfigKeyTable.forEach((param) => {
            if (typeof config[param] !== 'undefined') {
                if (param !== 'precisionCompare') {
                    (this.settings as any)[param] = (decimal as any)[param] = config[param];
                } else {
                    (this.settings as any)[param] = config[param];
                }
            }
        });
        if (Object.keys(decimal).length > 0) {
            Decimal.set(decimal);
        }
    };

    public re: Decimal;
    public im: Decimal;
    public type: number;
    public parent: any;

    public static readonly setNumberType: TypeOfComplex.OneArgNoReturnComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.setNumberTypeFactory<Decimal, ComplexDecimal, number, unknown>(
        ComplexDecimal,
    );

    public constructor(re?: TypeOfComplex.NumLike<Decimal>, im?: TypeOfComplex.NumLike<Decimal>, type?: TypeOfComplex.NumType<number>, parent?: TypeOfComplex.NumParent<unknown>) {
        this.re = re ? new Decimal(re) : new Decimal(0);
        this.im = im ? new Decimal(im) : new Decimal(0);
        this.type = type ?? ComplexDecimal.COMPLEX;
        this.parent = parent ?? undefined;
        ComplexDecimal.setNumberType(this);
    }

    public static readonly create: TypeOfComplex.CreateComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.createFactory<Decimal, ComplexDecimal>(ComplexDecimal);

    public static readonly realSet: TypeOfComplex.PartSetComplexHandler<Decimal, ComplexDecimal> = (value: ComplexDecimal, re: TypeOfComplex.NumLike<Decimal>): void => {
        value.re = new Decimal(re);
    };

    public static readonly imagSet: TypeOfComplex.PartSetComplexHandler<Decimal, ComplexDecimal> = (value: ComplexDecimal, im: TypeOfComplex.NumLike<Decimal>): void => {
        value.im = new Decimal(im);
    };

    public static readonly realApply: TypeOfComplex.PartApplyComplexHandler<Decimal, ComplexDecimal> = (value: ComplexDecimal, func: (re: Decimal) => Decimal): void => {
        value.re = func(value.re);
    };

    public static readonly imagApply: TypeOfComplex.PartApplyComplexHandler<Decimal, ComplexDecimal> = (value: ComplexDecimal, func: (im: Decimal) => Decimal): void => {
        value.im = func(value.im);
    };

    public static readonly from = (obj: ComplexDecimal): ComplexDecimal => new ComplexDecimal(obj.re, obj.im, obj.type, obj.parent);
    public static readonly real = (z: ComplexDecimal): ComplexDecimal => new ComplexDecimal(z.re);
    public static readonly imag = (z: ComplexDecimal): ComplexDecimal => new ComplexDecimal(z.im);
    public static readonly realIsInteger = (z: ComplexDecimal): boolean => z.re.isInteger();
    public static readonly imagIsInteger = (z: ComplexDecimal): boolean => z.im.isInteger();
    public static readonly realIsFinite = (z: ComplexDecimal): boolean => z.re.isFinite();
    public static readonly imagIsFinite = (z: ComplexDecimal): boolean => z.im.isFinite();
    public static readonly realIsNaN = (z: ComplexDecimal): boolean => z.re.isNaN();
    public static readonly imagIsNaN = (z: ComplexDecimal): boolean => z.im.isNaN();
    public static readonly realIsNegative = (z: ComplexDecimal): boolean => z.re.isNegative();
    public static readonly imagIsNegative = (z: ComplexDecimal): boolean => z.im.isNegative();
    public static readonly realIsZero = (z: ComplexDecimal): boolean => z.re.isZero();
    public static readonly imagIsZero = (z: ComplexDecimal): boolean => z.im.isZero();
    public static readonly realIsPositive = (z: ComplexDecimal): boolean => z.re.isPositive();
    public static readonly imagIsPositive = (z: ComplexDecimal): boolean => z.im.isPositive();
    public static readonly realToNumber = (z: ComplexDecimal): number => z.re.toNumber();
    public static readonly imagToNumber = (z: ComplexDecimal): number => z.im.toNumber();
    public static readonly realLessThan = (z: ComplexDecimal, value: Decimal.Value): boolean => z.re.lt(value);
    public static readonly imagLessThan = (z: ComplexDecimal, value: Decimal.Value): boolean => z.im.lt(value);
    public static readonly realLessThanOrEqualTo = (z: ComplexDecimal, value: Decimal.Value): boolean => z.re.lte(value);
    public static readonly imagLessThanOrEqualTo = (z: ComplexDecimal, value: Decimal.Value): boolean => z.im.lte(value);
    public static readonly realEquals = (z: ComplexDecimal, value: Decimal.Value): boolean => z.re.eq(value);
    public static readonly imagEquals = (z: ComplexDecimal, value: Decimal.Value): boolean => z.im.eq(value);
    public static readonly realGreaterThanOrEqualTo = (z: ComplexDecimal, value: Decimal.Value): boolean => z.re.gte(value);
    public static readonly imagGreaterThanOrEqualTo = (z: ComplexDecimal, value: Decimal.Value): boolean => z.im.gte(value);
    public static readonly realGreaterThan = (z: ComplexDecimal, value: Decimal.Value): boolean => z.re.gt(value);
    public static readonly imagGreaterThan = (z: ComplexDecimal, value: Decimal.Value): boolean => z.im.gt(value);

    public static readonly parse: TypeOfComplex.ParseComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.parseFactory<Decimal, ComplexDecimal, number, unknown>(ComplexDecimal);
    public static readonly unparseValue: TypeOfComplex.UnparseValueComplexHandler<Decimal> = TypeOfComplex.unparseValueFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static readonly unparse: TypeOfComplex.UnparseComplexHandler<Decimal, ComplexDecimal, number> = TypeOfComplex.unparseFactory<Decimal, ComplexDecimal, number, unknown>(
        ComplexDecimal,
    );

    public unparse(): string {
        return ComplexDecimal.unparse(this, 0);
    }

    public static readonly unparseMathMLValue: TypeOfComplex.UnparseValueComplexHandler<Decimal> = TypeOfComplex.unparseMathMLValueFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static readonly precedence: TypeOfComplex.PrecedenceComplexHandler<Decimal, ComplexDecimal, Evaluator, number> = TypeOfComplex.precedenceFactory<
        Decimal,
        ComplexDecimal,
        number,
        unknown
    >(ComplexDecimal);
    public static readonly unparseMathML: TypeOfComplex.UnparseMathMLComplexHandler<Decimal, ComplexDecimal, Evaluator, number> = TypeOfComplex.unparseMathMLFactory<
        Decimal,
        ComplexDecimal,
        number,
        unknown
    >(ComplexDecimal);

    public static copy: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.copyFactory<Decimal, ComplexDecimal>(ComplexDecimal);

    public copy = (): ComplexDecimal => new ComplexDecimal(this.re, this.im, this.type);

    public static toMaxPrecisionValue: TypeOfComplex.OneArgValueComplexHandler<Decimal> = (value: Decimal): Decimal => {
        const precision = this.settings.precision - this.settings.precisionCompare;
        return value.toSignificantDigits(precision).toDecimalPlaces(precision);
    };

    public static toMaxPrecision: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.toMaxPrecisionFactory<Decimal, ComplexDecimal>(ComplexDecimal);

    public static epsilonValue = (): Decimal => Decimal.pow(10, -this.settings.precision + this.settings.precisionCompare);
    public static epsilon: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.epsilonFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static random: TypeOfComplex.RandomComplexHandler<Decimal, ComplexDecimal> = (significantDigits?: number): ComplexDecimal => new ComplexDecimal(Decimal.random(significantDigits));

    public static eq: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.equalsFactory<Decimal, ComplexDecimal>(ComplexDecimal, true);
    public static ne: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.equalsFactory<Decimal, ComplexDecimal>(ComplexDecimal, false);
    public static compareValue: TypeOfComplex.CompareValueComplexHandler<Decimal> = (cmp: TypeOfComplex.TCompareOperationName, left: Decimal, right: Decimal): boolean => left[cmp](right);
    public static cmp: TypeOfComplex.CmpComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cmpFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static minMaxArrayReal: TypeOfComplex.MinMaxArrayComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxArrayRealFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static minMaxArrayRealWithIndex: TypeOfComplex.MinMaxArrayWithIndexComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxArrayRealWithIndexFactory<
        Decimal,
        ComplexDecimal
    >(ComplexDecimal);
    public static minMaxArrayComplex: TypeOfComplex.MinMaxArrayComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxArrayComplexFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static minMaxArrayComplexWithIndex: TypeOfComplex.MinMaxArrayWithIndexComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxArrayComplexWithIndexFactory<
        Decimal,
        ComplexDecimal
    >(ComplexDecimal);
    public static min: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'lt');
    public static minWise: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxWiseFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'lt');
    public static max: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'gte');
    public static maxWise: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.minMaxWiseFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'gte');
    public static lt: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.comparisonFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'lt');
    public static le: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.comparisonFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'lte');
    public static gt: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.comparisonFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'gt');
    public static ge: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.comparisonFactory<Decimal, ComplexDecimal>(ComplexDecimal, 'gte');
    public static false: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 0, 0, ComplexDecimal.LOGICAL);
    public static true: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 1, 0, ComplexDecimal.LOGICAL);
    public static logical: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.logicalFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static toLogical: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = (value: ComplexDecimal): ComplexDecimal => ComplexDecimal.logical(value);
    public toLogical: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = (): ComplexDecimal => ComplexDecimal.logical(this);
    public static and: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.andFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static or: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.orFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static xor: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.xorFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static not: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.notFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static zero: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 0, 0);
    public static one: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 1, 0);
    public static onediv2: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 1 / 2, 0);
    public static minusonediv2: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, -1 / 2, 0);
    public static minusone: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, -1, 0);
    public static pi: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, Decimal.acos(-1), 0);
    public static pidiv2: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(
        ComplexDecimal,
        Decimal.div(Decimal.acos(-1), 2),
        0,
    );
    public static onei: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 0, 1);
    public static onediv2i: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 0, 1 / 2);
    public static minusonediv2i: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 0, -1 / 2);
    public static minusonei: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 0, -1);
    public static two: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, 2, 0);
    public static sqrt2pi: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(
        ComplexDecimal,
        Decimal.sqrt(Decimal.mul(2, Decimal.acos(-1))),
        0,
    );
    public static e: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, Decimal.exp(1), 0);
    public static NaN_0: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, NaN, 0);
    public static inf_0: TypeOfComplex.NoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.literalFactory<Decimal, ComplexDecimal>(ComplexDecimal, Infinity, 0);

    public static add: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = (left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal =>
        new ComplexDecimal(Decimal.add(left.re, right.re), Decimal.add(left.im, right.im));
    public static sub: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = (left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal =>
        new ComplexDecimal(Decimal.sub(left.re, right.re), Decimal.sub(left.im, right.im));
    public static neg: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = (z: ComplexDecimal): ComplexDecimal => new ComplexDecimal(z.re.neg(), z.im.neg());

    public static mul: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.mulFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static mulAndSumTo: TypeOfComplex.ThreeArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.mulAndSumToFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static rdiv: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.rdivFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);

    public static ldiv: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = ComplexDecimal.rdiv;

    public static inv: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.invFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static power: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.powerFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static root: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.rootFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static absValue: TypeOfComplex.AbsoluteValueComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.absValueFactory<Decimal, ComplexDecimal>(Decimal);
    public static abs2Value: TypeOfComplex.AbsoluteValueComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.abs2ValueFactory<Decimal, ComplexDecimal>(Decimal);
    public static abs: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.absFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static abs2: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.abs2Factory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static hypot: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.hypotFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static arg: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.argFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static conj: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.conjFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static mod: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.modFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static rem: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.remFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static fix: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.fixFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static ceil: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.ceilFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static floor: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.floorFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static round: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.roundFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static sign: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.signFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static sqrt: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.sqrtFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static exp: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.expFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static log: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.logFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static logb: TypeOfComplex.TwoArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.logbFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static log2: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.log2Factory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static log10: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.log10Factory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static deg2rad: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.deg2radFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static rad2deg: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.rad2degFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static sin: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.sinFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static sind: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.sindFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static cos: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cosFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static cosd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cosdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static tan: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.tanFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static tand: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.tandFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static csc: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cscFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static cscd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cscdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static sec: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.secFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static secd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.secdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static cot: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cotFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static cotd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cotdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static asin: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.asinFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static asind: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.asindFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acos: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acosFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acosd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acosdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static atan: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.atanFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static atand: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.atandFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acsc: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acscFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acscd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acscdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static asec: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.asecFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static asecd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.asecdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acot: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acotFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acotd: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acotdFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static sinh: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.sinhFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static cosh: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.coshFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static tanh: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.tanhFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static csch: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cschFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static sech: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.sechFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static coth: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.cothFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static asinh: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.asinhFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acosh: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acoshFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static atanh: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.atanhFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acsch: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acschFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static asech: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.asechFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static acoth: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.acothFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static gamma: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.gammaFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static factorial: TypeOfComplex.OneArgComplexHandler<Decimal, ComplexDecimal> = TypeOfComplex.factorialFactory<Decimal, ComplexDecimal>(Decimal, ComplexDecimal);
    public static readonly applyFunction: TypeOfComplex.PartApplyComplexHandlerTable<Decimal> = TypeOfComplex.applyFunctionFactory<Decimal>(Decimal);
    public static mapFunction: Record<string, (z: ComplexDecimal) => ComplexDecimal> = TypeOfComplex.mapFunctionFactory<Decimal, ComplexDecimal>(ComplexDecimal);
    public static twoArgFunction: Record<string, (x: ComplexDecimal, y: ComplexDecimal) => ComplexDecimal> = TypeOfComplex.twoArgFunctionFactory<Decimal, ComplexDecimal>(ComplexDecimal);
}

/**
 * The static type ensures compatibility with the contract (TypeOfComplex.ComplexInterface).
 */
type ComplexDecimalStatic = typeof ComplexDecimal extends TypeOfComplex.ComplexInterfaceStatic<Decimal, ComplexDecimal> ? typeof ComplexDecimal : never;

/**
 * Initial setup.
 */
ComplexDecimal.set(ComplexDecimal.defaultSettings);

export { Decimal, type ComplexDecimalStatic, ComplexDecimal };

export default { ComplexDecimal };
