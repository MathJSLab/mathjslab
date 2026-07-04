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

/**
 * Runtime string value used by the AST and interpreter.
 *
 * `CharString` preserves the source quote style when the parser knows it, but
 * semantic operations treat `str` as the canonical value. Truthiness follows
 * MATLAB/Octave-like string behavior: empty strings are false and non-empty
 * strings are true.
 */
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
     * @param str Runtime string value.
     * @param quote Source quote style to preserve when unparsing.
     */
    public constructor(str: string, quote: StringQuoteCharacter = doubleQuoteCharacter) {
        this.str = str;
        this.quote = quote;
    }

    /**
     * Creates a `CharString` instance.
     * @param str String value.
     * @param quote Quote character.
     * @returns A new `CharString` instance.
     */
    public static readonly create = (str: string, quote: StringQuoteCharacter = '"') => new CharString(str, quote);

    /**
     * Test if an object is a instance of `CharString`.
     * @param value Object to test.
     * @returns `true` if `obj` is an instance of `CharString`. `false` otherwise.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is CharString => obj instanceof CharString;

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
     * Parse a raw string token into a `CharString`.
     *
     * The current parser already supplies the decoded string content, so this
     * helper simply wraps it with the default double-quote style.
     *
     * @param str Decoded string content.
     * @returns Parsed `CharString`.
     */
    public static readonly parse = (str: string): CharString => new CharString(str);

    /**
     * Render the string as source text without adding quotes.
     *
     * `parentPrecedence` is accepted for compatibility with other unparse
     * helpers; string rendering does not need precedence.
     *
     * @param value String value to render.
     * @param parentPrecedence Parent operator precedence, unused.
     * @returns Raw string content.
     */
    public static readonly unparse = (value: CharString, parentPrecedence = 0): string => value.str;

    /**
     * Convert a `CharString` to its runtime string value.
     *
     * @param value String wrapper.
     * @returns Raw string content.
     */
    public static readonly toString = (value: CharString): string => value.str;

    /**
     * Convert this instance to its runtime string value.
     *
     * @returns Raw string content.
     */
    public toString(): string {
        return this.str;
    }

    /**
     * Render the string as a double-quoted escaped source literal.
     *
     * The escaping mirrors MATLAB/Octave double-quote conventions used by the
     * rest of the unparsing pipeline.
     *
     * @param value String wrapper.
     * @returns Escaped source literal.
     */
    public static readonly unparseEscaped = (value: CharString): string => {
        let result = JSON.stringify(value.str);
        result = result
            .substring(1, result.length - 1)
            .replace(/\\\\/, '\\')
            .replace(/\\\"/, '""');
        return '"' + result + '"';
    };

    /**
     * Render the string as MathML.
     *
     * `parentPrecedence` is accepted for compatibility with other MathML
     * helpers; string rendering does not need precedence.
     *
     * @param value String value to render.
     * @param parentPrecedence Parent operator precedence, unused.
     * @returns MathML fragment.
     */
    public static readonly unparseMathML = (value: CharString, parentPrecedence = 0): string => '<mi><pre>' + value.str + '</pre></mi>';

    /**
     * Render the string as an escaped MathML literal.
     *
     * @param value String value to render.
     * @returns MathML fragment containing a quoted escaped string.
     */
    public static readonly unparseEscapedMathML = (value: CharString): string => {
        let result = JSON.stringify(value.str);
        result = result
            .substring(1, result.length - 1)
            .replace(/\\\\/, '\\')
            .replace(/\\\"/, '""');
        return '<mi><pre>"' + result + '"</pre></mi>';
    };

    /**
     * Convert a string to a logical complex scalar.
     *
     * @param value String wrapper.
     * @returns `true` for non-empty strings, `false` for empty strings.
     */
    public static readonly logical = (value: CharString): Complex => (value.str ? Complex.true() : Complex.false());

    /**
     * Alias for `logical` used by the common element interface.
     *
     * @param value String wrapper.
     * @returns Logical complex scalar.
     */
    public static readonly toLogical = (value: CharString): Complex => CharString.logical(value);

    /**
     * Convert this instance to a logical complex scalar.
     *
     * @returns Logical complex scalar.
     */
    public toLogical(): Complex {
        return CharString.logical(this);
    }
}

export type { SingleQuoteCharacter, DoubleQuoteCharacter, StringQuoteCharacter };
export { singleQuoteCharacter, doubleQuoteCharacter, stringClass, CharString };
export default { singleQuoteCharacter, doubleQuoteCharacter, stringClass, CharString };
