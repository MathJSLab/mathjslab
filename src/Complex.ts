/**
 * filename: `Complex.ts`
 * Description: Complex number library based on a facade architecture.
 */

import * as TypeOfComplex from './ComplexInterface';
import { ComplexNumber } from './ComplexNumber';
import { ComplexDecimal, Decimal } from './ComplexDecimal';
import { Evaluator } from './Evaluator';

/**
 * External type complex facade definitions.
 */

type RealType = number | Decimal;
type NumberObjectType = number;
type RealTypeDescriptor = 'number' | 'decimal';
type ComplexType = TypeOfComplex.ComplexHandlerType<RealType, TypeOfComplex.ComplexInterface<RealType>>;

/**
 * Complex Facade internal type definitions.
 */

type ComplexInterfaceBase = TypeOfComplex.OmitComplexInterfaceDynamic<RealType, NumberObjectType, unknown>;
type InterfaceStaticHandler = TypeOfComplex.ComplexInterfaceStatic<RealType, ComplexType>;
type IsInstanceOfHandler = TypeOfComplex.IsInstanceOfComplexHandler<ComplexType>;
type SetHandler = TypeOfComplex.SetComplexHandler;
type CreateHandler = TypeOfComplex.CreateComplexHandler<RealType, ComplexType, number>;
type PartSetHandler = TypeOfComplex.PartSetComplexHandler<RealType, TypeOfComplex.ComplexInterface<RealType>>;
type PartApplyHandler = TypeOfComplex.PartApplyComplexHandler<RealType, ComplexType>;
type PartApplyHandlerTable = TypeOfComplex.PartApplyComplexHandlerTable<RealType>;
type OneArgValueHandler = TypeOfComplex.OneArgValueComplexHandler<RealType>;
type FromHandler = TypeOfComplex.FromComplexHandler<RealType, ComplexType>;
type NoArgHandler = TypeOfComplex.NoArgComplexHandler<RealType, ComplexType>;
type OneArgHandler = TypeOfComplex.OneArgComplexHandler<RealType, ComplexType>;
type OneOptNumArgHandler = TypeOfComplex.OneOptNumArgComplexHandler<RealType, ComplexType>;
type OneArgNoReturnHandler = TypeOfComplex.OneArgNoReturnComplexHandler<RealType, ComplexType>;
type MapHandler = TypeOfComplex.MapComplexHandler<RealType, ComplexType>;
type TwoArgHandler = TypeOfComplex.TwoArgComplexHandler<RealType, ComplexType>;
type ThreeArgHandler = TypeOfComplex.ThreeArgComplexHandler<RealType, ComplexType>;
type OneArgReturnBooleanHandler = TypeOfComplex.OneArgReturnBooleanComplexHandler<RealType, ComplexType>;
type OneArgReturnNumberHandler = TypeOfComplex.OneArgReturnNumberComplexHandler<RealType, ComplexType>;
type TestNumLikeHandler = TypeOfComplex.TestNumLikeComplexHandler<RealType, ComplexType>;
type ParseHandler = TypeOfComplex.ParseComplexHandler<RealType, ComplexType>;
type UnparseValueHandler = TypeOfComplex.UnparseValueComplexHandler<RealType>;
type UnparseHandler = TypeOfComplex.UnparseComplexHandler<RealType, ComplexType, number>;
type PrecedenceHandler = TypeOfComplex.PrecedenceComplexHandler<RealType, ComplexType, Evaluator, number>;
type UnparseMathMLHandler = TypeOfComplex.UnparseMathMLComplexHandler<RealType, ComplexType, Evaluator, number>;
type CompareHandler = TypeOfComplex.CompareComplexHandler<RealType, ComplexType>;
type MinMaxArrayHandler = TypeOfComplex.MinMaxArrayComplexHandler<RealType, ComplexType>;
type MinMaxArrayWithIndexHandler = TypeOfComplex.MinMaxArrayWithIndexComplexHandler<RealType, ComplexType>;

/**
 * # Complex
 *
 * Facade Complex class.
 *
 * `Complex.engine = 'decimal'` switches to using the `decimal.js` package (ComplexDecimal).
 *
 * `Complex.engine = 'number'` switches to using the native `number` type (ComplexNumber).
 *
 */
abstract class Complex implements ComplexInterfaceBase {
    /**
     * Private complex backend engine.
     */
    private static _engineBackend: TypeOfComplex.ComplexInterfaceStatic<any, any>;
    /**
     * Private complex backend engine descriptor.
     */
    private static _engine: RealTypeDescriptor;
    /**
     * Complex backend engine getter.
     */
    public static get engineBackend(): InterfaceStaticHandler {
        return this._engineBackend;
    }
    /**
     * Complex backend engine descriptor getter.
     */
    public static get engine(): RealTypeDescriptor {
        return this._engine;
    }
    /**
     * Complex backend engine switcher.
     */
    public static set engine(engine: RealTypeDescriptor) {
        this._engine = engine;
        switch (engine) {
            case 'number':
                this._engineBackend = ComplexNumber;
                break;
            case 'decimal':
                this._engineBackend = ComplexDecimal;
                break;
            default:
                throw new Error(`invalid complex backend engine: '${engine}'.`);
        }
        (TypeOfComplex.ComplexInterfaceStaticKeyTable as (keyof Complex)[]).forEach((prop) => {
            this[prop] = this._engineBackend[prop];
        });
        this.set(this.defaultSettings);
    }
    public static readonly LOGICAL: number;
    public static readonly REAL: number;
    public static readonly COMPLEX: number;
    /**
     * `Complex` facade default settings.
     */
    public static readonly defaultSettings: TypeOfComplex.ComplexConfig<TypeOfComplex.Rounding, TypeOfComplex.Modulo>;
    /**
     * `Complex` facade current settings.
     */
    public static readonly settings: TypeOfComplex.ComplexConfig<TypeOfComplex.Rounding, TypeOfComplex.Modulo>;
    public static readonly isInstanceOf: IsInstanceOfHandler;
    public static readonly set: SetHandler;
    public static readonly setNumberType: OneArgNoReturnHandler;
    public static readonly create: CreateHandler;
    public static readonly realSet: PartSetHandler;
    public static readonly imagSet: PartSetHandler;
    public static readonly realApply: PartApplyHandler;
    public static readonly imagApply: PartApplyHandler;
    public static readonly from: FromHandler;
    public static readonly real: MapHandler;
    public static readonly imag: MapHandler;
    public static readonly realIsFinite: OneArgReturnBooleanHandler;
    public static readonly imagIsFinite: OneArgReturnBooleanHandler;
    public static readonly realIsNaN: OneArgReturnBooleanHandler;
    public static readonly imagIsNaN: OneArgReturnBooleanHandler;
    public static readonly realIsInteger: OneArgReturnBooleanHandler;
    public static readonly imagIsInteger: OneArgReturnBooleanHandler;
    public static readonly realIsNegative: OneArgReturnBooleanHandler;
    public static readonly imagIsNegative: OneArgReturnBooleanHandler;
    public static readonly realIsZero: OneArgReturnBooleanHandler;
    public static readonly imagIsZero: OneArgReturnBooleanHandler;
    public static readonly realIsPositive: OneArgReturnBooleanHandler;
    public static readonly imagIsPositive: OneArgReturnBooleanHandler;
    public static readonly realToNumber: OneArgReturnNumberHandler;
    public static readonly imagToNumber: OneArgReturnNumberHandler;
    public static readonly realLessThan: TestNumLikeHandler;
    public static readonly imagLessThan: TestNumLikeHandler;
    public static readonly realLessThanOrEqualTo: TestNumLikeHandler;
    public static readonly imagLessThanOrEqualTo: TestNumLikeHandler;
    public static readonly realEquals: TestNumLikeHandler;
    public static readonly imagEquals: TestNumLikeHandler;
    public static readonly realGreaterThanOrEqualTo: TestNumLikeHandler;
    public static readonly imagGreaterThanOrEqualTo: TestNumLikeHandler;
    public static readonly realGreaterThan: TestNumLikeHandler;
    public static readonly imagGreaterThan: TestNumLikeHandler;
    public static readonly parse: ParseHandler;
    public static readonly unparseValue: UnparseValueHandler;
    public static readonly unparse: UnparseHandler;
    public static readonly unparseMathMLValue: UnparseValueHandler;
    public static readonly precedence: PrecedenceHandler;
    public static readonly unparseMathML: UnparseMathMLHandler;
    public static readonly copy: OneArgHandler;
    public static readonly toMaxPrecisionValue: OneArgValueHandler;
    public static readonly toMaxPrecision: OneArgHandler;
    public static readonly epsilon: NoArgHandler;
    public static readonly random: OneOptNumArgHandler;
    public static readonly eq: TwoArgHandler;
    public static readonly ne: TwoArgHandler;
    public static readonly cmp: CompareHandler;
    public static readonly minMaxArrayReal: MinMaxArrayHandler;
    public static readonly minMaxArrayRealWithIndex: MinMaxArrayWithIndexHandler;
    public static readonly minMaxArrayComplex: MinMaxArrayHandler;
    public static readonly minMaxArrayComplexWithIndex: MinMaxArrayWithIndexHandler;
    public static readonly min: TwoArgHandler;
    public static readonly minWise: TwoArgHandler;
    public static readonly max: TwoArgHandler;
    public static readonly maxWise: TwoArgHandler;
    public static readonly lt: TwoArgHandler;
    public static readonly le: TwoArgHandler;
    public static readonly gt: TwoArgHandler;
    public static readonly ge: TwoArgHandler;
    public static readonly false: NoArgHandler;
    public static readonly true: NoArgHandler;
    public static readonly toLogical: OneArgHandler;
    public static readonly logical: MapHandler;
    public static readonly and: TwoArgHandler;
    public static readonly or: TwoArgHandler;
    public static readonly xor: TwoArgHandler;
    public static readonly not: OneArgHandler;
    public static readonly zero: NoArgHandler;
    public static readonly one: NoArgHandler;
    public static readonly onediv2: NoArgHandler;
    public static readonly minusonediv2: NoArgHandler;
    public static readonly minusone: NoArgHandler;
    public static readonly pi: NoArgHandler;
    public static readonly pidiv2: NoArgHandler;
    public static readonly onei: NoArgHandler;
    public static readonly onediv2i: NoArgHandler;
    public static readonly minusonediv2i: NoArgHandler;
    public static readonly minusonei: NoArgHandler;
    public static readonly two: NoArgHandler;
    public static readonly sqrt2pi: NoArgHandler;
    public static readonly e: NoArgHandler;
    public static readonly NaN_0: NoArgHandler;
    public static readonly inf_0: NoArgHandler;
    public static readonly add: TwoArgHandler;
    public static readonly sub: TwoArgHandler;
    public static readonly neg: OneArgHandler;
    public static readonly mul: TwoArgHandler;
    public static readonly mulAndSumTo: ThreeArgHandler;
    public static readonly rdiv: TwoArgHandler;
    public static readonly ldiv: TwoArgHandler;
    public static readonly inv: OneArgHandler;
    public static readonly power: TwoArgHandler;
    public static readonly root: TwoArgHandler;
    public static readonly abs: MapHandler;
    public static readonly abs2: MapHandler;
    public static readonly hypot: TwoArgHandler;
    public static readonly arg: MapHandler;
    public static readonly conj: MapHandler;
    public static readonly mod: TwoArgHandler;
    public static readonly rem: TwoArgHandler;
    public static readonly fix: MapHandler;
    public static readonly ceil: MapHandler;
    public static readonly floor: MapHandler;
    public static readonly round: MapHandler;
    public static readonly sign: MapHandler;
    public static readonly sqrt: MapHandler;
    public static readonly exp: MapHandler;
    public static readonly log: MapHandler;
    public static readonly logb: TwoArgHandler;
    public static readonly log2: MapHandler;
    public static readonly log10: MapHandler;
    public static readonly deg2rad: MapHandler;
    public static readonly rad2deg: MapHandler;
    public static readonly sin: MapHandler;
    public static readonly sind: MapHandler;
    public static readonly cos: MapHandler;
    public static readonly cosd: MapHandler;
    public static readonly tan: MapHandler;
    public static readonly tand: MapHandler;
    public static readonly csc: MapHandler;
    public static readonly cscd: MapHandler;
    public static readonly sec: MapHandler;
    public static readonly secd: MapHandler;
    public static readonly cot: MapHandler;
    public static readonly cotd: MapHandler;
    public static readonly asin: MapHandler;
    public static readonly asind: MapHandler;
    public static readonly acos: MapHandler;
    public static readonly acosd: MapHandler;
    public static readonly atan: MapHandler;
    public static readonly atand: MapHandler;
    public static readonly acsc: MapHandler;
    public static readonly acscd: MapHandler;
    public static readonly asec: MapHandler;
    public static readonly asecd: MapHandler;
    public static readonly acot: MapHandler;
    public static readonly acotd: MapHandler;
    public static readonly sinh: MapHandler;
    public static readonly cosh: MapHandler;
    public static readonly tanh: MapHandler;
    public static readonly csch: MapHandler;
    public static readonly sech: MapHandler;
    public static readonly coth: MapHandler;
    public static readonly asinh: MapHandler;
    public static readonly acosh: MapHandler;
    public static readonly atanh: MapHandler;
    public static readonly acsch: MapHandler;
    public static readonly asech: MapHandler;
    public static readonly acoth: MapHandler;
    public static readonly gamma: MapHandler;
    public static readonly factorial: MapHandler;
    public static readonly applyFunction: PartApplyHandlerTable;
    public static readonly mapFunction: Record<string, MapHandler>;
    public static readonly twoArgFunction: Record<string, TwoArgHandler>;
}

/**
 * Initial engine selection.
 */
Complex.engine = 'decimal';

export type { Decimal, RealType, NumberObjectType, RealTypeDescriptor, ComplexType };
export { Complex };
export default { Complex };
