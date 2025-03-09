import { Decimal } from 'decimal.js';
import { Evaluator } from './Evaluator';

type Rounding = Decimal.Rounding;

type Modulo = Decimal.Modulo;

type ComplexDecimalConfig = {
    /**
     * The maximum number of significant digits of the result of an operation.
     * Values equal to or greater than 336 is used to produce correct rounding of
     * trigonometric, hyperbolic and exponential functions.
     */
    precision?: number;
    /**
     * Number of significant digits to reduce precision before compare operations and
     * unparse.
     */
    precisionCompare?: number;
    /**
     * The default rounding mode used when rounding the result of an operation to
     * precision significant digits.
     */
    rounding?: Rounding;
    /**
     * The positive exponent value at and above which unparse returns exponential
     * notation.
     */
    toExpPos?: number;
    /**
     * The negative exponent limit, i.e. the exponent value below which underflow
     * to zero occurs.
     */
    minE?: number;
    /**
     * The positive exponent limit, i.e. the exponent value above which overflow
     * to Infinity occurs.
     */
    maxE?: number;
    /**
     * The negative exponent value at and below which unparse returns exponential
     * notation.
     */
    toExpNeg?: number;
    /**
     * The modulo mode used when calculating the modulus: a mod n.
     */
    modulo?: Decimal.Modulo;
    /**
     * The value that determines whether cryptographically-secure
     * pseudo-random number generation is used.
     */
    crypto?: boolean;
};

/**
 * Binary operations name type.
 */
type TBinaryOperationName =
    | 'add'
    | 'sub'
    | 'mul'
    | 'rdiv'
    | 'ldiv'
    | 'power'
    | 'lt'
    | 'le'
    | 'eq'
    | 'ge'
    | 'gt'
    | 'ne'
    | 'and'
    | 'or'
    | 'xor'
    | 'mod'
    | 'rem'
    | 'minWise'
    | 'maxWise';

/**
 * Unary operations name type.
 */
type TUnaryOperationLeftName = 'copy' | 'neg' | 'not';

const ComplexDecimalConfig: ComplexDecimalConfig = {
    precision: 336,
    precisionCompare: 7,
    rounding: Decimal.ROUND_HALF_DOWN,
    toExpPos: 20,
    toExpNeg: -7,
    minE: -9e15,
    maxE: 9e15,
    modulo: Decimal.ROUND_DOWN,
    crypto: false,
};

const defaultComplexDecimalConfig = Object.assign({}, ComplexDecimalConfig);

/**
 * # ComplexDecimal
 *
 * An arbitrary precision complex number library.
 *
 * ## References
 * * https://mathworld.wolfram.com/ComplexNumber.html
 */
class ComplexDecimal {
    public static readonly defaultConfiguration = defaultComplexDecimalConfig;

    public static get settings() {
        return ComplexDecimalConfig;
    }

    /**
     *
     * @param config
     */
    public static set(config: ComplexDecimalConfig): void {
        const decimalConfig = ['precision', 'rounding', 'toExpPos', 'toExpNeg', 'minE', 'maxE', 'modulo', 'crypto'];
        const decimal: Decimal.Config = {};
        decimalConfig.forEach((param) => {
            if (typeof (config as any)[param] !== 'undefined') {
                (ComplexDecimalConfig as any)[param] = (decimal as any)[param] = (config as any)[param];
            }
        });
        if (typeof config.precisionCompare !== 'undefined') {
            ComplexDecimalConfig.precisionCompare = config.precisionCompare;
        }
        if (Object.keys(decimal).length > 0) {
            Decimal.set(decimal);
        }
    }

    /**
     * Functions with one argument (mappers)
     */
    public static mapFunction: Record<string, Function> = {
        real: ComplexDecimal.real,
        imag: ComplexDecimal.imag,
        logical: ComplexDecimal.logical,
        abs: ComplexDecimal.abs,
        arg: ComplexDecimal.arg,
        conj: ComplexDecimal.conj,
        fix: ComplexDecimal.fix,
        ceil: ComplexDecimal.ceil,
        floor: ComplexDecimal.floor,
        round: ComplexDecimal.round,
        sign: ComplexDecimal.sign,
        sqrt: ComplexDecimal.sqrt,
        exp: ComplexDecimal.exp,
        log: ComplexDecimal.log,
        log2: ComplexDecimal.log2,
        log10: ComplexDecimal.log10,
        deg2rad: ComplexDecimal.deg2rad,
        rad2deg: ComplexDecimal.rad2deg,
        sin: ComplexDecimal.sin,
        sind: ComplexDecimal.sind,
        cos: ComplexDecimal.cos,
        cosd: ComplexDecimal.cosd,
        tan: ComplexDecimal.tan,
        tand: ComplexDecimal.tand,
        csc: ComplexDecimal.csc,
        cscd: ComplexDecimal.cscd,
        sec: ComplexDecimal.sec,
        secd: ComplexDecimal.secd,
        cot: ComplexDecimal.cot,
        cotd: ComplexDecimal.cotd,
        asin: ComplexDecimal.asin,
        asind: ComplexDecimal.asind,
        acos: ComplexDecimal.acos,
        acosd: ComplexDecimal.acosd,
        atan: ComplexDecimal.atan,
        atand: ComplexDecimal.atand,
        acsc: ComplexDecimal.acsc,
        acscd: ComplexDecimal.acscd,
        asec: ComplexDecimal.asec,
        asecd: ComplexDecimal.asecd,
        acot: ComplexDecimal.acot,
        acotd: ComplexDecimal.acotd,
        sinh: ComplexDecimal.sinh,
        cosh: ComplexDecimal.cosh,
        tanh: ComplexDecimal.tanh,
        csch: ComplexDecimal.csch,
        sech: ComplexDecimal.sech,
        coth: ComplexDecimal.coth,
        asinh: ComplexDecimal.asinh,
        acosh: ComplexDecimal.acosh,
        atanh: ComplexDecimal.atanh,
        acsch: ComplexDecimal.acsch,
        asech: ComplexDecimal.asech,
        acoth: ComplexDecimal.acoth,
        gamma: ComplexDecimal.gamma,
        factorial: ComplexDecimal.factorial,
    };

    /**
     * Functions with two arguments.
     */
    public static twoArgFunction: Record<string, Function> = {
        root: ComplexDecimal.root,
        hypot: ComplexDecimal.hypot,
        power: ComplexDecimal.power,
        logb: ComplexDecimal.logb,
    };

    /**
     * Most restricted number class.
     */
    public static readonly LOGICAL = 0;
    public static readonly REAL = 1;
    public static readonly COMPLEX = 2;

    /**
     * Real, imaginary and type properties.
     */
    public re: Decimal;
    public im: Decimal;
    public type: number;
    public parent: any;

    public static setNumberType(value: ComplexDecimal): void {
        if (value.im.isZero()) {
            if (!((value.re.isZero() || value.re.eq(1)) && value.type === ComplexDecimal.LOGICAL)) {
                value.type = ComplexDecimal.REAL;
            }
        } else {
            value.type = ComplexDecimal.COMPLEX;
        }
    }

    /**
     * ComplexDecimal constructor
     * @param re Real part (optional).
     * @param im Imaginary part (optional).
     * @param type Class 'complex' | 'logical' (optional).
     */
    public constructor(re?: number | string | Decimal, im?: number | string | Decimal, type?: number) {
        this.re = re ? new Decimal(re) : new Decimal(0);
        this.im = im ? new Decimal(im) : new Decimal(0);
        this.type = type ?? ComplexDecimal.COMPLEX;
        if (this.im.isZero()) {
            if (!((this.re.isZero() || this.re.eq(1)) && this.type === ComplexDecimal.LOGICAL)) {
                this.type = ComplexDecimal.REAL;
            }
        } else {
            this.type = ComplexDecimal.COMPLEX;
        }
    }

    /**
     * Real part of complex number.
     * @param z value.
     * @returns Real part of z
     */
    public static real(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(z.re);
    }

    /**
     * Imaginary part of complex number.
     * @param z value.
     * @returns Imaginary part of z
     */
    public static imag(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(z.im);
    }

    /**
     * Create new ComplexDecimal.
     * @param re Real part (optional).
     * @param im Imaginary part (optional).
     * @param type Class 'complex' | 'logical' (optional).
     * @returns new ComplexDecimal(re, im, type).
     */
    public static newThis(re?: number | string | Decimal, im?: number | string | Decimal, type?: number): ComplexDecimal {
        return new ComplexDecimal(re, im, type);
    }

    /**
     * Parse string returning its ComplexDecimal value.
     * @param value String to parse.
     * @returns ComplexDecimal parsed value.
     */
    public static parse(value: string): ComplexDecimal {
        const num = value[0] === '0' && (value[1] === 'x' || value[1] === 'X') ? value.replace('_', '') : value.replace(/[dD]/, 'e'); // Replace underline because bug in decimal constructor when creating hexadecimal with underlines.
        if (num[num.length - 1] === 'i' || num[num.length - 1] === 'I' || num[num.length - 1] === 'j' || num[num.length - 1] === 'J') {
            return new ComplexDecimal(0, num.substring(0, num.length - 1));
        } else {
            return new ComplexDecimal(num, 0);
        }
    }

    /**
     * Unparse real or imaginary part.
     * @param value Decimal value
     * @returns String of unparsed value
     */
    private static unparseDecimal(value: Decimal): string {
        if (value.isFinite()) {
            const value_unparsed = value.valueOf().split('e');
            if (value_unparsed.length == 1) {
                return value_unparsed[0].slice(0, Decimal.toExpPos);
            } else {
                return value_unparsed[0].slice(0, Decimal.toExpPos) + 'e' + Number(value_unparsed[1]);
            }
        } else {
            return value.isNaN() ? 'NaN' : (value.isNeg() ? '-' : '') + '&infin;';
        }
    }

    /**
     * Unparse ComplexDecimal value. Show true/false if logical value,
     * otherwise show real and imaginary parts enclosed by parenthesis. If
     * some part is zero the null part is ommited (and parenthesis is ommited
     * too).
     * @param value Value to unparse.
     * @returns String of unparsed value.
     */
    public static unparse(value: ComplexDecimal, parentPrecedence = 0): string {
        if (value.type !== ComplexDecimal.LOGICAL) {
            const value_prec = ComplexDecimal.toMaxPrecision(value);
            if (!value_prec.re.isZero() && !value_prec.im.isZero()) {
                return (
                    '(' +
                    ComplexDecimal.unparseDecimal(value_prec.re) +
                    (value_prec.im.gt(0) ? '+' : '') +
                    (!value_prec.im.eq(1) ? (!value_prec.im.eq(-1) ? ComplexDecimal.unparseDecimal(value_prec.im) : '-') : '') +
                    'i)'
                );
            } else if (!value_prec.re.isZero()) {
                return ComplexDecimal.unparseDecimal(value_prec.re);
            } else if (!value_prec.im.isZero()) {
                return (!value_prec.im.eq(1) ? (!value_prec.im.eq(-1) ? ComplexDecimal.unparseDecimal(value_prec.im) : '-') : '') + 'i';
            } else if (!value_prec.re.isNeg() && !value_prec.im.isNeg()) {
                return '0';
            } else if (value_prec.re.isNeg() && value_prec.im.isNeg()) {
                return '-0';
            } else if (value_prec.re.isNeg() && !value_prec.im.isNeg()) {
                return '(-0+0i)';
            } else {
                return '(0-0i)';
            }
        } else {
            if (value.re.isZero()) {
                return 'false';
            } else {
                return 'true';
            }
        }
    }

    public unparse(): string {
        return ComplexDecimal.unparse(this);
    }

    /**
     * Unparse real or imaginary part.
     * @param value Decimal value
     * @returns string of value unparsed
     */
    private static unparseDecimalMathML(value: Decimal): string {
        if (value.isFinite()) {
            const value_unparsed = value.valueOf().split('e');
            if (value_unparsed.length == 1) {
                return '<mn>' + value_unparsed[0].slice(0, Decimal.toExpPos) + '</mn>';
            } else {
                return (
                    '<mn>' +
                    value_unparsed[0].slice(0, Decimal.toExpPos) +
                    '</mn><mo>&sdot;</mo><msup><mrow><mn>10</mn></mrow><mrow><mn>' +
                    Number(value_unparsed[1]) +
                    '</mn></mrow></msup>'
                );
            }
        } else {
            return value.isNaN() ? '<mi><b>NaN</b></mi>' : (value.isNeg() ? '<mo>-</mo>' : '') + '<mi>&infin;</mi>';
        }
    }
    public static precedence(value: ComplexDecimal, evaluator: Evaluator) {
        if (value.type !== ComplexDecimal.LOGICAL) {
            const value_prec = ComplexDecimal.toMaxPrecision(value);
            if (!value_prec.re.isZero() && !value_prec.im.isZero()) {
                return evaluator.precedenceTable['+'];
            } else if (!value_prec.re.isZero()) {
                return value_prec.re.isNeg() ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'];
            } else if (!value_prec.im.isZero()) {
                return value_prec.im.isNeg() ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'];
            } else if (!value_prec.re.isNeg() && !value_prec.im.isNeg()) {
                return evaluator.precedenceTable['()'];
            } else if (value_prec.re.isNeg() && value_prec.im.isNeg()) {
                return evaluator.precedenceTable['-_'];
            } else {
                return evaluator.precedenceTable['+'];
            }
        } else {
            return evaluator.precedenceTable['()'];
        }
    }
    /**
     * Unparse ComplexDecimal value as MathML language. Show true/false if
     * logical value, otherwise show real and imaginary parts enclosed by
     * parenthesis. If some part is zero the null part is ommited (and
     * parenthesis is ommited too).
     * @param value value to unparse.
     * @returns string of unparsed value.
     */
    public static unparseMathML(value: ComplexDecimal, evaluator: Evaluator, parentPrecedence = 0): string {
        if (value.type !== ComplexDecimal.LOGICAL) {
            const value_prec = ComplexDecimal.toMaxPrecision(value);
            if (!value_prec.re.isZero() && !value_prec.im.isZero()) {
                const unparsed =
                    ComplexDecimal.unparseDecimalMathML(value_prec.re) +
                    (value_prec.im.gt(0) ? '<mo>+</mo>' : '') +
                    (!value_prec.im.eq(1) ? (!value_prec.im.eq(-1) ? ComplexDecimal.unparseDecimalMathML(value_prec.im) : '<mo>-</mo>') : '') +
                    '<mi>i</mi>';
                if (parentPrecedence > evaluator.precedenceTable['+']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (!value_prec.re.isZero()) {
                const unparsed = ComplexDecimal.unparseDecimalMathML(value_prec.re);
                if (parentPrecedence > (value_prec.re.isNeg() ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'])) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (!value_prec.im.isZero()) {
                const unparsed = (!value_prec.im.eq(1) ? (!value_prec.im.eq(-1) ? ComplexDecimal.unparseDecimalMathML(value_prec.im) : '<mo>-</mo>') : '') + '<mi>i</mi>';
                if (parentPrecedence > (value_prec.im.isNeg() ? evaluator.precedenceTable['-_'] : evaluator.precedenceTable['()'])) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (!value_prec.re.isNeg() && !value_prec.im.isNeg()) {
                const unparsed = '<mn>0</mn>';
                if (parentPrecedence > evaluator.precedenceTable['()']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (value_prec.re.isNeg() && value_prec.im.isNeg()) {
                const unparsed = '<mn>-0</mn>';
                if (parentPrecedence > evaluator.precedenceTable['-_']) {
                    return `<mo fence="true" stretchy="true">(</mo>${unparsed}<mo fence="true" stretchy="true">)</mo>`;
                } else {
                    return unparsed;
                }
            } else if (value_prec.re.isNeg() && !value_prec.im.isNeg()) {
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
            if (value.re.isZero()) {
                return '<mi>false</mi>';
            } else {
                return '<mi>true</mi>';
            }
        }
    }

    /**
     * Creates a copy of the value.
     * @param value ComplexDecimal value
     * @returns copy of value
     */
    public static copy(value: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(value.re, value.im, value.type);
    }

    public copy(): ComplexDecimal {
        return new ComplexDecimal(this.re, this.im, this.type);
    }

    /**
     * Reduce precision of real or imaginary part.
     * @param value Full precision value.
     * @returns Reduced precision value.
     */
    private static toMaxPrecisionDecimal(value: Decimal): Decimal {
        return value.toSignificantDigits(Decimal.precision - ComplexDecimalConfig.precisionCompare!).toDecimalPlaces(Decimal.precision - ComplexDecimalConfig.precisionCompare!);
    }

    /**
     * Reduce precision.
     * @param value Full precision value.
     * @returns Reduced precision value.
     */
    public static toMaxPrecision(value: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(
            value.re.toSignificantDigits(Decimal.precision - ComplexDecimalConfig.precisionCompare!).toDecimalPlaces(Decimal.precision - ComplexDecimalConfig.precisionCompare!),
            value.im.toSignificantDigits(Decimal.precision - ComplexDecimalConfig.precisionCompare!).toDecimalPlaces(Decimal.precision - ComplexDecimalConfig.precisionCompare!),
        );
    }

    /**
     * Get the minimal diference of two consecutive numbers for real or
     * imaginary part, the floating-point relative accuracy.
     * @returns Minimal diference of two consecutive numbers.
     */
    private static epsilonDecimal(): Decimal {
        return Decimal.pow(10, -Decimal.precision + ComplexDecimalConfig.precisionCompare!);
    }

    /**
     * Get the minimal diference of two consecutive numbers, the
     * floating-point relative accuracy.
     * @returns Minimal diference of two consecutive numbers.
     */
    public static epsilon(): ComplexDecimal {
        return new ComplexDecimal(ComplexDecimal.epsilonDecimal());
    }

    public static random(): ComplexDecimal {
        return new ComplexDecimal(Decimal.random());
    }

    /**
     * Test for equality.
     * @param left Value.
     * @param right Value.
     * @returns Returns ComplexDecimal.true() if left and right are equals.
     */
    public static eq(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        const left_prec = ComplexDecimal.toMaxPrecision(left);
        const right_prec = ComplexDecimal.toMaxPrecision(right);
        return left_prec.re.eq(right_prec.re) && left_prec.im.eq(right_prec.im) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Test for inequality.
     * @param left Value.
     * @param right Value.
     * @returns Returns ComplexDecimal.true() if left and right are different.
     */
    public static ne(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        const left_prec = ComplexDecimal.toMaxPrecision(left);
        const right_prec = ComplexDecimal.toMaxPrecision(right);
        return left_prec.re.eq(right_prec.re) && left_prec.im.eq(right_prec.im) ? ComplexDecimal.false() : ComplexDecimal.true();
    }

    /**
     * Comparison made in polar lexicographical ordering. It's ordered by
     * absolute value, or by polar angle in (-pi,pi] when absolute values are
     * equal.
     * @param cmp Type of comparison.
     * @param left Value.
     * @param right Value.
     * @returns Result of comparison as ComplexDecimal.true() or ComplexDecimal.false().
     */
    private static cmp(cmp: 'lt' | 'lte' | 'gt' | 'gte', left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        const left_prec = ComplexDecimal.toMaxPrecision(left);
        const right_prec = ComplexDecimal.toMaxPrecision(right);
        if (left_prec.im.isZero() && right_prec.im.isZero()) {
            return left_prec.re[cmp](right_prec.re) ? ComplexDecimal.true() : ComplexDecimal.false();
        }
        const left_abs = ComplexDecimal.toMaxPrecisionDecimal(ComplexDecimal.abs(left).re);
        const right_abs = ComplexDecimal.toMaxPrecisionDecimal(ComplexDecimal.abs(right).re);
        if (left_abs.eq(right_abs)) {
            return ComplexDecimal.toMaxPrecisionDecimal(ComplexDecimal.arg(left).re)[cmp](ComplexDecimal.toMaxPrecisionDecimal(ComplexDecimal.arg(right).re))
                ? ComplexDecimal.true()
                : ComplexDecimal.false();
        } else {
            return left_abs[cmp](right_abs) ? ComplexDecimal.true() : ComplexDecimal.false();
        }
    }

    /**
     * Gets the maximum or minimum of an array of ComplexDecimal using real comparison.
     * @param cmp 'lt' for minimum or 'gt' for maximum.
     * @param args ComplexDecimal values.
     * @returns Minimum or maximum of ComplexDecimal values.
     */
    public static minMaxArrayReal(cmp: 'lt' | 'gt', ...args: ComplexDecimal[]): ComplexDecimal {
        return args.reduce((previous: ComplexDecimal, current: ComplexDecimal): ComplexDecimal => (previous.re[cmp](current.re) ? previous : current), args[0]);
    }

    public static minMaxArrayRealWithIndex(cmp: 'lt' | 'gt', ...args: ComplexDecimal[]): [ComplexDecimal, number] {
        let index: number = 0;
        const result = args.reduceRight(
            (previous: ComplexDecimal, current: ComplexDecimal, i: number): ComplexDecimal => {
                if (previous.re[cmp](current.re)) {
                    return previous;
                } else {
                    index = i;
                    return current;
                }
            },
            args[args.length - 1],
        );
        return [result, index];
    }

    /**
     * Gets the maximum or minimum of an array of ComplexDecimal using complex
     * comparison. The arguments are in polar lexicographical ordering
     * (ordered by absolute value, or by polar angle in (-pi,pi] when absolute
     * values are equal).
     * @param cmp 'lt' for minimum or 'gt' for maximum.
     * @param args ComplexDecimal values.
     * @returns Minimum or maximum of ComplexDecimal values.
     */
    public static minMaxArrayComplex(cmp: 'lt' | 'gt', ...args: ComplexDecimal[]): ComplexDecimal {
        return args.reduce((previous: ComplexDecimal, current: ComplexDecimal): ComplexDecimal => {
            const previous_abs = ComplexDecimal.abs(previous).re;
            const current_abs = ComplexDecimal.abs(current).re;
            if (previous_abs.eq(current_abs)) {
                return ComplexDecimal.arg(previous).re[cmp](ComplexDecimal.arg(current).re) ? previous : current;
            } else {
                return previous_abs[cmp](current_abs) ? previous : current;
            }
        }, args[0]);
    }

    public static minMaxArrayComplexWithIndex(cmp: 'lt' | 'gt', ...args: ComplexDecimal[]): [ComplexDecimal, number] {
        let index: number = 0;
        const result = args.reduceRight(
            (previous: ComplexDecimal, current: ComplexDecimal, i: number): ComplexDecimal => {
                const previous_abs = ComplexDecimal.abs(previous).re;
                const current_abs = ComplexDecimal.abs(current).re;
                if (previous_abs.eq(current_abs)) {
                    if (ComplexDecimal.arg(previous).re[cmp](ComplexDecimal.arg(current).re)) {
                        return previous;
                    } else {
                        index = i;
                        return current;
                    }
                } else {
                    if (previous_abs[cmp](current_abs)) {
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
    }

    /**
     * Returns the minimum of arguments. The arguments are in polar
     * lexicographical ordering (ordered by absolute value, or by polar angle
     * in (-pi,pi] when absolute values are equal).
     * @param left Value to compare.
     * @param right Value to compare.
     * @returns Minimum of left and right
     */
    public static min(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        if (left.im.isZero() && right.im.isZero()) {
            return left.re.lt(right.re) ? left : right;
        } else {
            const left_abs = ComplexDecimal.abs(left).re;
            const right_abs = ComplexDecimal.abs(right).re;
            if (left_abs.eq(right_abs)) {
                return ComplexDecimal.arg(left).re.lt(ComplexDecimal.arg(right).re) ? left : right;
            } else {
                return left_abs.lt(right_abs) ? left : right;
            }
        }
    }

    public static minWise(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        if (left.type <= ComplexDecimal.REAL && left.type <= ComplexDecimal.REAL) {
            return left.re.lt(right.re) ? left : right;
        } else {
            const left_abs = ComplexDecimal.abs(left).re;
            const right_abs = ComplexDecimal.abs(right).re;
            if (left_abs.eq(right_abs)) {
                return ComplexDecimal.arg(left).re.lt(ComplexDecimal.arg(right).re) ? left : right;
            } else {
                return left_abs.lt(right_abs) ? left : right;
            }
        }
    }

    /**
     * Returns the maximum of arguments. The arguments are in polar
     * lexicographical ordering (ordered by absolute value, or by polar angle
     * in (-pi,pi] when absolute values are equal).
     * @param left Value to compare.
     * @param right Value to compare.
     * @returns Maximum of left and right
     */
    public static max(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        if (left.im.isZero() && right.im.isZero()) {
            return left.re.gte(right.re) ? left : right;
        } else {
            const left_abs = ComplexDecimal.abs(left).re;
            const right_abs = ComplexDecimal.abs(right).re;
            if (left_abs.eq(right_abs)) {
                return ComplexDecimal.arg(left).re.gte(ComplexDecimal.arg(right).re) ? left : right;
            } else {
                return left_abs.gte(right_abs) ? left : right;
            }
        }
    }

    public static maxWise(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        if (left.type <= ComplexDecimal.REAL && left.type <= ComplexDecimal.REAL) {
            return left.re.gte(right.re) ? left : right;
        } else {
            const left_abs = ComplexDecimal.abs(left).re;
            const right_abs = ComplexDecimal.abs(right).re;
            if (left_abs.eq(right_abs)) {
                return ComplexDecimal.arg(left).re.gte(ComplexDecimal.arg(right).re) ? left : right;
            } else {
                return left_abs.gte(right_abs) ? left : right;
            }
        }
    }

    /**
     * Less than comparison (lexicographical ordering).
     * @param left Value.
     * @param right Value.
     * @returns Result of comparison left<right as ComplexDecimal.true() or ComplexDecimal.false().
     */
    public static lt(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.cmp('lt', left, right);
    }

    /**
     * Less than or equal comparison (lexicographical ordering).
     * @param left Value.
     * @param right Value.
     * @returns Result of comparison left<=right as ComplexDecimal.true() or ComplexDecimal.false().
     */
    public static le(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.cmp('lte', left, right);
    }

    /**
     * Greater than comparison (lexicographical ordering).
     * @param left Value.
     * @param right Value.
     * @returns Result of comparison left>right as ComplexDecimal.true() or ComplexDecimal.false().
     */
    public static gt(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.cmp('gt', left, right);
    }

    /**
     * Greater than or equal comparison (lexicographical ordering).
     * @param left Value.
     * @param right Value.
     * @returns Result of comparison left>=right as ComplexDecimal.true() or ComplexDecimal.false().
     */
    public static ge(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.cmp('gte', left, right);
    }

    /**
     * ComplexDecimal logical false.
     * @returns new ComplexDecimal(0, 0, 'logical')
     */
    public static false(): ComplexDecimal {
        return new ComplexDecimal(0, 0, ComplexDecimal.LOGICAL);
    }

    /**
     * ComplexDecimal logical true.
     * @returns new ComplexDecimal(1, 0, 'logical')
     */
    public static true(): ComplexDecimal {
        return new ComplexDecimal(1, 0, ComplexDecimal.LOGICAL);
    }

    public static toLogical(value: ComplexDecimal): ComplexDecimal {
        const prec = ComplexDecimal.toMaxPrecision(value);
        return prec.re.isZero() && prec.im.isZero() ? new ComplexDecimal(0, 0, ComplexDecimal.LOGICAL) : new ComplexDecimal(1, 0, ComplexDecimal.LOGICAL);
    }

    public toLogical(): ComplexDecimal {
        const prec = ComplexDecimal.toMaxPrecision(this);
        return prec.re.isZero() && prec.im.isZero() ? new ComplexDecimal(0, 0, ComplexDecimal.LOGICAL) : new ComplexDecimal(1, 0, ComplexDecimal.LOGICAL);
    }

    /**
     * Convert numeric values to logicals.
     * @param value ComplexDecimal decimal value.
     * @returns ComplexDecimal logical value.
     */
    public static logical(value: ComplexDecimal): ComplexDecimal {
        const value_prec = ComplexDecimal.toMaxPrecision(value);
        return new ComplexDecimal(value_prec.re.isZero() && value_prec.im.isZero() ? 0 : 1, 0, ComplexDecimal.LOGICAL);
    }

    /**
     * Logical **AND**.
     * @param left Value.
     * @param right Value.
     * @returns left AND right.
     */
    public static and(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        const left_prec = ComplexDecimal.toMaxPrecision(left);
        const right_prec = ComplexDecimal.toMaxPrecision(right);
        return (left_prec.re.isZero() && left_prec.im.isZero()) || (right_prec.re.isZero() && right_prec.im.isZero()) ? ComplexDecimal.false() : ComplexDecimal.true();
    }

    /**
     * Logical **OR**.
     * @param left Value.
     * @param right Value.
     * @returns left OR right.
     */
    public static or(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        const left_prec = ComplexDecimal.toMaxPrecision(left);
        const right_prec = ComplexDecimal.toMaxPrecision(right);
        return left_prec.re.isZero() && left_prec.im.isZero() && right_prec.re.isZero() && right_prec.im.isZero() ? ComplexDecimal.false() : ComplexDecimal.true();
    }

    /**
     * Logical **XOR**.
     * @param left Value.
     * @param right Value.
     * @returns left XOR right.
     */
    public static xor(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        const left_prec = ComplexDecimal.toMaxPrecision(left);
        const right_prec = ComplexDecimal.toMaxPrecision(right);
        return (left_prec.re.isZero() && left_prec.im.isZero() && !(right_prec.re.isZero() && right_prec.im.isZero())) ||
            (!(left_prec.re.isZero() && left_prec.im.isZero()) && right_prec.re.isZero() && right_prec.im.isZero())
            ? ComplexDecimal.true()
            : ComplexDecimal.false();
    }

    /**
     * Logical **NOT**.
     * @param right Value.
     * @returns NOT right.
     */
    public static not(right: ComplexDecimal): ComplexDecimal {
        const right_prec = ComplexDecimal.toMaxPrecision(right);
        return right_prec.re.isZero() && right_prec.im.isZero() ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * 0
     * @returns 0 as ComplexDecimal.
     */
    public static zero(): ComplexDecimal {
        return new ComplexDecimal(0, 0);
    }

    /**
     * 1
     * @returns 1 as ComplexDecimal.
     */
    public static one(): ComplexDecimal {
        return new ComplexDecimal(1, 0);
    }

    /**
     * 1/2
     * @returns 1/2 as ComplexDecimal.
     */
    public static onediv2(): ComplexDecimal {
        return new ComplexDecimal(1 / 2, 0);
    }

    /**
     * -1/2
     * @returns -1/2 as ComplexDecimal.
     */
    public static minusonediv2(): ComplexDecimal {
        return new ComplexDecimal(-1 / 2, 0);
    }

    /**
     * -1
     * @returns -1 as ComplexDecimal.
     */
    public static minusone(): ComplexDecimal {
        return new ComplexDecimal(-1, 0);
    }

    /**
     * pi
     * @returns pi as ComplexDecimal.
     */
    public static pi(): ComplexDecimal {
        return new ComplexDecimal(Decimal.acos(-1), 0);
    }

    /**
     * pi/2
     * @returns pi/2 as ComplexDecimal.
     */
    public static pidiv2(): ComplexDecimal {
        return new ComplexDecimal(Decimal.div(Decimal.acos(-1), 2), 0);
    }

    /**
     * i
     * @returns i as ComplexDecimal.
     */
    public static onei(): ComplexDecimal {
        return new ComplexDecimal(0, 1);
    }

    /**
     * i/2
     * @returns i/2 as ComplexDecimal.
     */
    public static onediv2i(): ComplexDecimal {
        return new ComplexDecimal(0, 1 / 2);
    }

    /**
     * -i/2
     * @returns -i/2 as ComplexDecimal.
     */
    public static minusonediv2i(): ComplexDecimal {
        return new ComplexDecimal(0, -1 / 2);
    }

    /**
     * -i
     * @returns -i as ComplexDecimal.
     */
    public static minusonei(): ComplexDecimal {
        return new ComplexDecimal(0, -1);
    }

    /**
     * 2
     * @returns 2 as ComplexDecimal.
     */
    public static two(): ComplexDecimal {
        return new ComplexDecimal(2, 0);
    }

    /**
     * sqrt(2*pi)
     * @returns sqrt(2*pi) as ComplexDecimal.
     */
    public static sqrt2pi(): ComplexDecimal {
        return new ComplexDecimal(Decimal.sqrt(Decimal.mul(2, Decimal.acos(-1))), 0);
    }

    /**
     * e (Napier number).
     * @returns e as ComplexDecimal.
     */
    public static e(): ComplexDecimal {
        return new ComplexDecimal(Decimal.exp(1), 0);
    }

    /**
     * NaN
     * @returns NaN as ComplexDecimal.
     */
    public static NaN_0(): ComplexDecimal {
        return new ComplexDecimal(NaN, 0);
    }

    /**
     * Inf
     * @returns Inf as ComplexDecimal.
     */
    public static inf_0(): ComplexDecimal {
        return new ComplexDecimal(Infinity, 0);
    }

    /**
     * Addition of ComplexDecimal numbers.
     * @param left Value.
     * @param right Value.
     * @returns left + right
     */
    public static add(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.add(left.re, right.re), Decimal.add(left.im, right.im));
    }

    /**
     * Subtraction of ComplexDecimal numbers.
     * @param left Value
     * @param right Value
     * @returns left - right
     */
    public static sub(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.sub(left.re, right.re), Decimal.sub(left.im, right.im));
    }

    /**
     * Negates the ComplexDecimal number.
     * @param z Value.
     * @returns -z
     */
    public static neg(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(z.re.neg(), z.im.neg());
    }

    /**
     * Multiplication of ComplexDecimal numbers.
     * @param left Value.
     * @param right Value.
     * @returns left * right
     */
    public static mul(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        if (left.im.isZero() && right.im.isZero()) {
            return new ComplexDecimal(Decimal.mul(left.re, right.re), new Decimal(0));
        } else {
            return new ComplexDecimal(
                Decimal.sub(Decimal.mul(left.re, right.re), Decimal.mul(left.im, right.im)),
                Decimal.add(Decimal.mul(left.re, right.im), Decimal.mul(left.im, right.re)),
            );
        }
    }

    /**
     * Right Division.
     * @param left Dividend.
     * @param right Divisor.
     * @returns left / right.
     */
    public static rdiv(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        const denom = Decimal.add(Decimal.mul(right.re, right.re), Decimal.mul(right.im, right.im));
        if (denom.isFinite()) {
            if (denom.isZero()) {
                return new ComplexDecimal(Decimal.mul(left.re, Infinity), left.im.isZero() ? new Decimal(0) : Decimal.mul(left.im, Infinity));
            } else {
                return new ComplexDecimal(
                    Decimal.div(Decimal.add(Decimal.mul(left.re, right.re), Decimal.mul(left.im, right.im)), denom),
                    Decimal.div(Decimal.sub(Decimal.mul(left.im, right.re), Decimal.mul(left.re, right.im)), denom),
                );
            }
        } else {
            if (denom.isNaN()) {
                if ((right.re.isFinite() || right.re.isNaN()) && (right.im.isFinite() || right.im.isNaN())) {
                    return new ComplexDecimal(NaN, 0);
                } else {
                    return ComplexDecimal.zero();
                }
            } else if (left.re.isFinite() && left.im.isFinite()) {
                return ComplexDecimal.zero();
            } else {
                return new ComplexDecimal(NaN, 0);
            }
        }
    }

    /**
     * Left division. For ComplexDecimal the left division is the same of right division.
     * @param left Dividend.
     * @param right Divisor.
     * @returns left \ right.
     */
    public static ldiv = ComplexDecimal.rdiv;

    /**
     * Inverse.
     * @param x Denominator
     * @returns 1/x
     */
    public static inv(x: ComplexDecimal): ComplexDecimal {
        const denom = Decimal.add(Decimal.mul(x.re, x.re), Decimal.mul(x.im, x.im));
        if (denom.isFinite()) {
            if (denom.isZero()) {
                return new ComplexDecimal(Infinity, 0);
            } else {
                return new ComplexDecimal(Decimal.div(x.re, denom), Decimal.div(x.im, denom).neg());
            }
        } else {
            if (denom.isNaN()) {
                if ((x.re.isFinite() || x.re.isNaN()) && (x.im.isFinite() || x.im.isNaN())) {
                    return new ComplexDecimal(NaN, 0);
                } else {
                    return ComplexDecimal.zero();
                }
            } else {
                return ComplexDecimal.zero();
            }
        }
    }

    /**
     * Power of ComplexDecimal numbers.
     * @param left Base.
     * @param right Exponent.
     * @returns left^right
     */
    public static power(left: ComplexDecimal, right: ComplexDecimal): ComplexDecimal {
        if (left.im.isZero() && right.im.isZero() && left.re.gte(0)) {
            return new ComplexDecimal(Decimal.pow(left.re, right.re), new Decimal(0));
        } else {
            const arg_left = Decimal.atan2(left.im.isZero() ? 0 : left.im, left.re.isZero() ? 0 : left.re);
            const mod2_left = Decimal.add(Decimal.mul(left.re, left.re), Decimal.mul(left.im, left.im));
            const mul = Decimal.mul(Decimal.pow(mod2_left, Decimal.div(right.re, 2)), Decimal.exp(Decimal.mul(Decimal.mul(-1, right.im), arg_left)));
            const trig = Decimal.add(Decimal.mul(right.re, arg_left), Decimal.mul(Decimal.div(right.im, 2), Decimal.ln(mod2_left)));
            return new ComplexDecimal(
                Decimal.mul(mul, Decimal.cos(trig)),
                left.im.isZero() && right.im.isZero() && (right.re.gte(1) || right.re.lte(-1)) ? 0 : Decimal.mul(mul, Decimal.sin(trig)),
            );
        }
    }

    /**
     * Root of ComplexDecimal numbers.
     * @param x Radicand.
     * @param n Index.
     * @returns nth root of x.
     */
    public static root(x: ComplexDecimal, n: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.power(x, ComplexDecimal.inv(n));
    }

    /**
     * Absolute value and complex magnitude.
     * @param z value
     * @returns Absolute value of z
     */
    public static abs(z: ComplexDecimal): ComplexDecimal {
        return z.im.isZero() ? new ComplexDecimal(Decimal.abs(z.re)) : new ComplexDecimal(Decimal.sqrt(Decimal.add(Decimal.mul(z.re, z.re), Decimal.mul(z.im, z.im))));
    }

    /**
     * Square root of sum of squares (hypotenuse)
     * @param x vertex.
     * @param y vertex.
     * @returns hypotenuse of the two orthogonal vertex x and y.
     */
    public static hypot(x: ComplexDecimal, y: ComplexDecimal): ComplexDecimal {
        const abs_x = Decimal.sqrt(Decimal.add(Decimal.mul(x.re, x.re), Decimal.mul(x.im, x.im)));
        const abs_y = Decimal.sqrt(Decimal.add(Decimal.mul(y.re, y.re), Decimal.mul(y.im, y.im)));
        return new ComplexDecimal(Decimal.sqrt(Decimal.add(Decimal.mul(abs_x, abs_x), Decimal.mul(abs_y, abs_y))));
    }

    /**
     * Phase angle.
     * @param z value.
     * @returns Phase angle of z.
     */
    public static arg(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.atan2(z.im.isZero() ? 0 : z.im, z.re) /*test if imaginary part is 0 to change -0 to 0*/, 0);
    }

    /**
     * Complex conjugate
     * @param z value.
     * @returns Complex conjugate of z
     */
    public static conj(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(new Decimal(z.re), z.im.neg());
    }

    /**
     * Remainder after division (modulo operation). By convention
     * mod(a,0) = a.
     * @param x Dividend.
     * @param y Divisor.
     * @returns Remainder after division.
     */
    public static mod(x: ComplexDecimal, y: ComplexDecimal): ComplexDecimal {
        if (!(x.im.isZero() && y.im.isZero())) {
            throw new Error('mod: not defined for complex numbers');
        }
        if (y.re.isZero()) {
            return x;
        } else {
            return new ComplexDecimal(Decimal.mod(x.re, y.re));
        }
    }

    /**
     * Remainder after division. By convention rem(a,0) = NaN.
     * @param x Dividend.
     * @param y Divisor.
     * @returns Remainder after division.
     */
    public static rem(x: ComplexDecimal, y: ComplexDecimal): ComplexDecimal {
        if (!(x.im.isZero() && y.im.isZero())) {
            throw new Error('rem: not defined for complex numbers');
        }
        return new ComplexDecimal(Decimal.mod(x.re, y.re));
    }

    /**
     * Round toward zero. This operation effectively truncates the number to
     * integer by removing the decimal portion.
     * @param z Value.
     * @returns Integer portion of z.
     */
    public static fix(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.trunc(z.re), Decimal.trunc(z.im));
    }

    /**
     * Round toward positive infinity.
     * @param z Value
     * @returns Smallest integer greater than or equal to z.
     */
    public static ceil(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.ceil(z.re), Decimal.ceil(z.im));
    }

    /**
     * Round toward negative infinity.
     * @param z Value
     * @returns Largest integer less than or equal to z.
     */
    public static floor(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.floor(z.re), Decimal.floor(z.im));
    }

    /**
     * Round to nearest integer.
     * @param z Value.
     * @returns Nearest integer of z.
     */
    public static round(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.round(z.re), Decimal.round(z.im));
    }

    /**
     * Sign function (signum function).
     * @param z Value.
     * @returns
     * * 1 if the corresponding element of z is greater than 0.
     * * 0 if the corresponding element of z equals 0.
     * * -1 if the corresponding element of z is less than 0.
     * * z/abs(z) if z is complex.
     */
    public static sign(z: ComplexDecimal): ComplexDecimal {
        if (z.re.isZero()) {
            if (z.im.isZero()) {
                return ComplexDecimal.zero();
            } else {
                return new ComplexDecimal(0, Decimal.div(z.im, Decimal.sqrt(Decimal.add(Decimal.mul(z.re, z.re), Decimal.mul(z.im, z.im)))));
            }
        } else {
            if (z.im.isZero()) {
                return new ComplexDecimal(Decimal.div(z.re, Decimal.sqrt(Decimal.add(Decimal.mul(z.re, z.re), Decimal.mul(z.im, z.im)))), 0);
            } else {
                return new ComplexDecimal(
                    Decimal.div(z.re, Decimal.sqrt(Decimal.add(Decimal.mul(z.re, z.re), Decimal.mul(z.im, z.im)))),
                    Decimal.div(z.im, Decimal.sqrt(Decimal.add(Decimal.mul(z.re, z.re), Decimal.mul(z.im, z.im)))),
                );
            }
        }
    }

    /**
     * Square root.
     * @param z Value.
     * @returns Square root of z.
     */
    public static sqrt(z: ComplexDecimal): ComplexDecimal {
        const mod_z = Decimal.sqrt(Decimal.add(Decimal.mul(z.re, z.re), Decimal.mul(z.im, z.im)));
        const arg_z = Decimal.atan2(z.im.isZero() ? 0 : z.im, z.re);
        return new ComplexDecimal(Decimal.mul(Decimal.sqrt(mod_z), Decimal.cos(Decimal.div(arg_z, 2))), Decimal.mul(Decimal.sqrt(mod_z), Decimal.sin(Decimal.div(arg_z, 2))));
    }

    /**
     * Exponential
     * @param z Value.
     * @returns Exponential of z.
     */
    public static exp(z: ComplexDecimal): ComplexDecimal {
        // E^x (exponential)
        return new ComplexDecimal(Decimal.mul(Decimal.exp(z.re), Decimal.cos(z.im)), Decimal.mul(Decimal.exp(z.re), Decimal.sin(z.im)));
    }

    /**
     * Natural logarithm.
     * @param z Value.
     * @returns Natural logarithm of z.
     */
    public static log(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.ln(Decimal.sqrt(Decimal.add(Decimal.mul(z.re, z.re), Decimal.mul(z.im, z.im)))), Decimal.atan2(z.im.isZero() ? 0 : z.im, z.re));
    }

    /**
     * Compute the log using a specified base.
     * @param b Base.
     * @param l Value.
     * @returns Logarith base b of l.
     */
    public static logb(b: ComplexDecimal, l: ComplexDecimal): ComplexDecimal {
        const mod_b = Decimal.sqrt(Decimal.add(Decimal.mul(b.re, b.re), Decimal.mul(b.im, b.im)));
        if (mod_b.isZero()) {
            return ComplexDecimal.zero();
        } else {
            const arg_b = Decimal.atan2(b.im.isZero() ? 0 : b.im, b.re);
            const mod_l = Decimal.sqrt(Decimal.add(Decimal.mul(l.re, l.re), Decimal.mul(l.im, l.im)));
            const arg_l = Decimal.atan2(l.im.isZero() ? 0 : l.im, l.re);
            const denom = Decimal.add(Decimal.mul(Decimal.ln(mod_b), Decimal.ln(mod_b)), Decimal.mul(arg_b, arg_b));
            return new ComplexDecimal(
                Decimal.div(Decimal.add(Decimal.mul(Decimal.ln(mod_l), Decimal.ln(mod_b)), Decimal.mul(arg_l, arg_b)), denom),
                Decimal.div(Decimal.sub(Decimal.mul(arg_l, Decimal.ln(mod_b)), Decimal.mul(Decimal.ln(mod_l), arg_b)), denom),
            );
        }
    }

    /**
     * Base 2 logarithm
     * @param z Value
     * @returns logarithm base 2 of z.
     */
    public static log2(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.logb(new ComplexDecimal(2), z);
    }

    /**
     * Common logarithm (base 10)
     * @param z Value
     * @returns logarithm base 10 of z.
     */
    public static log10(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.logb(new ComplexDecimal(10), z);
    }

    /**
     * Convert angle from degrees to radians.
     * @param z Angle in degrees.
     * @returns Angle in radians.
     */
    public static deg2rad(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.mul(Decimal.div(Decimal.acos(-1), 180), z.re), Decimal.mul(Decimal.div(Decimal.acos(-1), 180), z.im));
    }

    /**
     * Convert angle from radians to degrees.
     * @param z Angle in radians.
     * @returns Angle in degrees.
     */
    public static rad2deg(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.mul(Decimal.div(180, Decimal.acos(-1)), z.re), Decimal.mul(Decimal.div(180, Decimal.acos(-1)), z.im));
    }

    /**
     * Trignometric sine.
     * @param z Argument in radians.
     * @returns Sine of z.
     */
    public static sin(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.mul(Decimal.sin(z.re), Decimal.cosh(z.im)), Decimal.mul(Decimal.cos(z.re), Decimal.sinh(z.im)));
    }

    /**
     * Trignometric sine in degrees.
     * @param z Argument in degrees.
     * @returns Sine of z
     */
    public static sind(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.sin(ComplexDecimal.deg2rad(z));
    }

    /**
     * Trignometric cosine.
     * @param z Argument in radians.
     * @returns Cosine of z.
     */
    public static cos(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.mul(Decimal.cos(z.re), Decimal.cosh(z.im)), Decimal.mul(Decimal.sin(z.re), Decimal.sinh(z.im)).neg());
    }

    /**
     * Trignometric cosine in degrees.
     * @param z Argument in degrees.
     * @returns Cosine of z
     */
    public static cosd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.cos(ComplexDecimal.deg2rad(z));
    }

    /**
     * Trigonometric tangent. Implemented as: tan(z) = sin(z)/cos(z)
     * @param z Argument in radians.
     * @returns Tangent of z.
     */
    public static tan(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.sin(z), ComplexDecimal.cos(z));
    }

    /**
     * Trigonometric tangent in degrees.
     * @param z Argument in degrees.
     * @returns Tangent of z.
     */
    public static tand(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.tan(ComplexDecimal.deg2rad(z));
    }

    /**
     * Trigonometric cosecant. Implemented as csc(z)=1/sin(z)
     * @param z Argument in radians.
     * @returns Cosecant of z.
     */
    public static csc(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.one(), ComplexDecimal.sin(z));
    }

    /**
     * Trigonometric cosecant in degrees.
     * @param z Argument in degrees.
     * @returns Cosecant of z.
     */
    public static cscd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.csc(ComplexDecimal.deg2rad(z));
    }

    /**
     * Trigonometric secant. Implemented as: sec(z) = 1/cos(z)
     * @param z Argument in radians.
     * @returns Secant of z.
     */
    public static sec(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.one(), ComplexDecimal.cos(z));
    }

    /**
     * Trigonometric secant in degrees.
     * @param z Argument in degrees.
     * @returns Secant of z.
     */
    public static secd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.sec(ComplexDecimal.deg2rad(z));
    }

    /**
     * Trigonometric cotangent. Implemented as: cot(z) = cos(z)/sin(z)
     * @param z Argument in radians.
     * @returns Cotangent of z.
     */
    public static cot(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.cos(z), ComplexDecimal.sin(z));
    }

    /**
     * Trigonometric cotangent in degrees.
     * @param z Argument in degrees.
     * @returns Cotangent of z.
     */
    public static cotd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.cot(ComplexDecimal.deg2rad(z));
    }

    /**
     * Inverse (arc) sine. Implemented as: asin(z) = I*ln(sqrt(1-z^2)-I*z)
     * @param z Argument (unitless).
     * @returns Inverse sine of z in radians.
     */
    public static asin(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.mul(
            ComplexDecimal.onei(),
            ComplexDecimal.log(
                ComplexDecimal.sub(
                    ComplexDecimal.sqrt(ComplexDecimal.sub(ComplexDecimal.one(), ComplexDecimal.power(z, ComplexDecimal.two()))),
                    ComplexDecimal.mul(ComplexDecimal.onei(), z),
                ),
            ),
        );
    }

    /**
     * Inverse (arc) sine in degrees.
     * @param z Argument (unitless).
     * @returns Inverse sine of z in degrees.
     */
    public static asind(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rad2deg(ComplexDecimal.asin(z));
    }

    /**
     * Inverse (arc) cosine. Implemented as: acos(z) = pi/2-asin(z)
     * @param z Argument (unitless).
     * @returns Inverse cosine of z in radians.
     */
    public static acos(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.sub(ComplexDecimal.pidiv2(), ComplexDecimal.asin(z));
    }

    /**
     * Inverse (arc) cosine in degrees.
     * @param z Argument (unitless).
     * @returns Inverse cosine of z in degrees.
     */
    public static acosd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rad2deg(ComplexDecimal.acos(z));
    }

    /**
     * Inverse (arc) tangent. Implemented as: atan(z) = -I/2*ln((I-z)/(I+z))
     * @param z Argument (unitless).
     * @returns Inverse tangent of z in radians.
     */
    public static atan(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.mul(
            ComplexDecimal.minusonediv2i(),
            ComplexDecimal.log(ComplexDecimal.rdiv(ComplexDecimal.sub(ComplexDecimal.onei(), z), ComplexDecimal.add(ComplexDecimal.onei(), z))),
        );
    }

    /**
     * Inverse (arc) tangent in degrees.
     * @param z Argument (unitless).
     * @returns Inverse tangent of z in degrees.
     */
    public static atand(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rad2deg(ComplexDecimal.atan(z));
    }

    /**
     * Inverse (arc) cosecant. Implemented as: acsc(z) = asin(1/z)
     * @param z Argument (unitless).
     * @returns Inverse cosecant of z in radians.
     */
    public static acsc(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.asin(ComplexDecimal.rdiv(ComplexDecimal.one(), z));
    }

    /**
     * Inverse (arc) cosecant in degrees.
     * @param z Argument (unitless).
     * @returns Inverse cosecant of z in degrees.
     */
    public static acscd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rad2deg(ComplexDecimal.acsc(z));
    }

    /**
     * Inverse (arc) secant. Implemented as: asec(z) = acos(1/z)
     * @param z Argument (unitless).
     * @returns Inverse secant of z in radians.
     */
    public static asec(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.acos(ComplexDecimal.rdiv(ComplexDecimal.one(), z));
    }

    /**
     * Inverse (arc) secant in degrees.
     * @param z Argument (unitless).
     * @returns Inverse secant of z in degrees.
     */
    public static asecd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rad2deg(ComplexDecimal.asec(z));
    }

    /**
     * Inverse (arc) cotangent. Implemented as: acot(z) = atan(1/z)
     * @param z Argument (unitless).
     * @returns Inverse cotangent of z in radians.
     */
    public static acot(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.atan(ComplexDecimal.rdiv(ComplexDecimal.one(), z));
    }

    /**
     * Inverse (arc) cotangent in degrees.
     * @param z Argument (unitless).
     * @returns Inverse cotangent of z in degrees.
     */
    public static acotd(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rad2deg(ComplexDecimal.acot(z));
    }

    /**
     * Hyperbolic sine.
     * @param z Argument.
     * @returns Hyperbolic sine of z.
     */
    public static sinh(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.mul(Decimal.sinh(z.re), Decimal.cos(z.im)), Decimal.mul(Decimal.cosh(z.re), Decimal.sin(z.im)));
    }

    /**
     * Hyperbolic cosine.
     * @param z Argument.
     * @returns Hyperbolic cosine of z.
     */
    public static cosh(z: ComplexDecimal): ComplexDecimal {
        return new ComplexDecimal(Decimal.mul(Decimal.cosh(z.re), Decimal.cos(z.im)), Decimal.mul(Decimal.sinh(z.re), Decimal.sin(z.im)));
    }

    /**
     * Hyperbolic tangent. Implemented as: tanh(z) = sinh(z)/cosh(z)
     * @param z Argument.
     * @returns Hyperbolic tangent of z.
     */
    public static tanh(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.sinh(z), ComplexDecimal.cosh(z));
    }

    /**
     * Hyperbolic cosecant. Implemented as: csch(z) = 1/sinh(z)
     * @param z Argument.
     * @returns Hyperbolic cosecant of z.
     */
    public static csch(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.one(), ComplexDecimal.sinh(z));
    }

    /**
     * Hyperbolic secant. Implemented as: sech(z) = 1/cosh(z)
     * @param z Argument.
     * @returns Hyperbolic secant of z.
     */
    public static sech(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.one(), ComplexDecimal.cosh(z));
    }

    /**
     * Hyperbolic cotangent. Implemented as: coth(z) = cosh(z)/sinh(z)
     * @param z Argument.
     * @returns Hyperbolic cotangent of z.
     */
    public static coth(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.cosh(z), ComplexDecimal.sinh(z));
    }

    /**
     * Inverse (area) hyperbolic sine. Implemented as: asinh(z) = ln(sqrt(1+z^2)+z)
     * @param z Argument.
     * @returns Inverse hyperbolic sine of z.
     */
    public static asinh(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.log(ComplexDecimal.add(ComplexDecimal.sqrt(ComplexDecimal.add(ComplexDecimal.one(), ComplexDecimal.power(z, ComplexDecimal.two()))), z));
    }

    /**
     * Inverse (area) hyperbolic cosine. Implemented as: acosh(z) = ln(sqrt(-1+z^2)+z)
     * @param z Argument.
     * @returns Inverse hyperbolic cosine of z.
     */
    public static acosh(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.log(ComplexDecimal.add(ComplexDecimal.sqrt(ComplexDecimal.add(ComplexDecimal.minusone(), ComplexDecimal.power(z, ComplexDecimal.two()))), z));
    }

    /**
     * Inverse (area) hyperbolic tangent. Implemented as: atanh(z) = 1/2*ln((1+z)/(1-z))
     * @param z Argument.
     * @returns Inverse hyperbolic tangent of z.
     */
    public static atanh(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.mul(
            ComplexDecimal.onediv2(),
            ComplexDecimal.log(ComplexDecimal.rdiv(ComplexDecimal.add(ComplexDecimal.one(), z), ComplexDecimal.sub(ComplexDecimal.one(), z))),
        );
    }

    /**
     * Inverse (area) hyperbolic cosecant. Implemented as: acsch(z) = asinh(1/z)
     * @param z Argument.
     * @returns Inverse hyperbolic cosecant of z.
     */
    public static acsch(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.one(), ComplexDecimal.asinh(z));
    }

    /**
     * Inverse (area) hyperbolic secant. Implemented as: asech(z) = acosh(1/z)
     * @param z Argument.
     * @returns Inverse hyperbolic secant of z.
     */
    public static asech(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.one(), ComplexDecimal.acosh(z));
    }

    /**
     * Inverse (area) hyperbolic cotangent. Implemented as: acoth(z) = atanh(1/z)
     * @param z Argument.
     * @returns Inverse hyperbolic cotangent of z.
     */
    public static acoth(z: ComplexDecimal): ComplexDecimal {
        return ComplexDecimal.rdiv(ComplexDecimal.one(), ComplexDecimal.atanh(z));
    }

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
    public static gamma(z: ComplexDecimal): ComplexDecimal {
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
        if (z.re.lt(0.5)) {
            // Euler's reflection formula.
            return ComplexDecimal.rdiv(
                ComplexDecimal.pi(),
                ComplexDecimal.mul(ComplexDecimal.sin(ComplexDecimal.mul(ComplexDecimal.pi(), z)), ComplexDecimal.gamma(ComplexDecimal.sub(ComplexDecimal.one(), z))),
            );
        } else {
            z = ComplexDecimal.sub(z, ComplexDecimal.one());
            let x = new ComplexDecimal(p[0]);
            const t = ComplexDecimal.add(z, new ComplexDecimal(p.length - 1.5));
            for (let i = 1; i < p.length; i++) {
                x = ComplexDecimal.add(x, ComplexDecimal.rdiv(new ComplexDecimal(p[i]), ComplexDecimal.add(z, new ComplexDecimal(i))));
            }
            return ComplexDecimal.mul(
                ComplexDecimal.mul(ComplexDecimal.sqrt2pi(), ComplexDecimal.power(t, ComplexDecimal.add(z, new ComplexDecimal(0.5)))),
                ComplexDecimal.mul(ComplexDecimal.exp(ComplexDecimal.neg(t)), x),
            );
        }
    }

    /**
     * Factorial.
     * @param x Argument.
     * @returns Factorial of x.
     */
    public static factorial(x: ComplexDecimal) {
        if (!(x.re.gte(0) && x.re.trunc().eq(x.re) && x.im.isZero())) {
            throw new Error('factorial: all N must be real non-negative integers');
        }
        const result = ComplexDecimal.gamma(ComplexDecimal.add(new ComplexDecimal(x.re.round()), ComplexDecimal.one()));
        result.re = result.re.trunc();
        return result;
    }
}

/**
 * Initial setup.
 */
ComplexDecimal.set(defaultComplexDecimalConfig);
export type { Rounding, Modulo, ComplexDecimalConfig, TBinaryOperationName, TUnaryOperationLeftName };
export { ComplexDecimal };
export default ComplexDecimal;
