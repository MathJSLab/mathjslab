import { Complex } from './Complex';

/**
 * Single quote string character type.
 */
type SingleQuoteCharacter = "'";

/**
 * Single quote string character literal.
 */
const singleQuoteCharacter: SingleQuoteCharacter = "'" satisfies string;

/**
 * Double quote string character type.
 */
type DoubleQuoteCharacter = '"';

/**
 * Double quote string character literal.
 */
const doubleQuoteCharacter: DoubleQuoteCharacter = '"' satisfies string;

/**
 * String quote character type.
 */
type StringQuoteCharacter = SingleQuoteCharacter | DoubleQuoteCharacter;

/**
 * Type number for `CharString` node.
 */
const stringClass = 3;

class CharString {
    /**
     * String value property.
     */
    public str: string;

    /**
     * Type of string quote (single or double).
     */
    public quote: StringQuoteCharacter;

    /**
     * String class type number.
     */
    public static readonly STRING = stringClass;

    /**
     * String class type property.
     */
    public type = CharString.STRING;

    /**
     * Parent node.
     */
    public parent: any;

    /**
     * `CharString` constructor.
     * @param str
     * @param quote
     */
    public constructor(str: string, quote: StringQuoteCharacter = doubleQuoteCharacter) {
        this.str = str;
        this.quote = quote;
    }

    /**
     * Creates a `CharString` instance.
     * @param str String value.
     * @param quote Quote character.
     * @returns
     */
    public static readonly create = (str: string, quote: StringQuoteCharacter = '"') => new CharString(str, quote);

    /**
     * Test if value is a instance of `CharString`.
     * @param value Value to test.
     * @returns `true` if `value` is instance of `CharString`. `false` otherwise.
     */
    public static readonly isInstanceOf = (value: unknown): boolean => value instanceof CharString;

    /**
     * Creates a copy of `CharString` `value`.
     * @param value `CharString` to copy.
     * @returns A copy of `value`.
     */
    public static readonly copy = (value: CharString): CharString => new CharString(value.str, value.quote);

    /**
     * Creates a copy of `CharString` instance.
     * @returns A copy of `this` `CharString`.
     */
    public copy(): CharString {
        return new CharString(this.str, this.quote);
    }

    /**
     *
     * @param str
     * @returns
     */
    public static readonly parse = (str: string): CharString => new CharString(str);

    /**
     *
     * @param value
     * @param parentPrecedence
     * @returns
     */
    public static readonly unparse = (value: CharString, parentPrecedence = 0): string => value.str;

    /**
     *
     * @param value
     * @returns
     */
    public static readonly unparseEscaped = (value: CharString): string => {
        let result = JSON.stringify(value.str);
        result = result
            .substring(1, result.length - 2)
            .replace(/\\\\/, '\\')
            .replace(/\\\"/, '""');
        return '"' + result + '"';
    };

    /**
     *
     * @param value
     * @param parentPrecedence
     * @returns
     */
    public static readonly unparseMathML = (value: CharString, parentPrecedence = 0): string => '<mi><pre>' + value.str + '</pre></mi>';

    /**
     *
     * @param value
     * @returns
     */
    public static readonly unparseEscapedMathML = (value: CharString): string => {
        let result = JSON.stringify(value.str);
        result = result
            .substring(1, result.length - 2)
            .replace(/\\\\/, '\\')
            .replace(/\\\"/, '""');
        return '<mi><pre>"' + result + '"</pre></mi>';
    };

    /**
     *
     * @returns
     */
    public unparse(): string {
        return this.str;
    }

    /**
     *
     * @returns
     */
    public unparseEscaped(): string {
        return CharString.unparseEscaped(this);
    }

    /**
     *
     * @param value
     * @returns
     */
    public static readonly logical = (value: CharString): Complex => (value.str ? Complex.true() : Complex.false());

    /**
     *
     * @param value
     * @returns
     */
    public static readonly toLogical = (value: CharString): Complex => CharString.logical(value);

    /**
     *
     * @returns
     */
    public toLogical(): Complex {
        return CharString.logical(this);
    }
}

export type { SingleQuoteCharacter, DoubleQuoteCharacter, StringQuoteCharacter };
export { singleQuoteCharacter, doubleQuoteCharacter, stringClass, CharString };
export default { singleQuoteCharacter, doubleQuoteCharacter, stringClass, CharString };
