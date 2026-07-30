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
 * `CharString` preserves the source quote style when the parser knows it. The
 * value is stored as a row character vector, while `str` remains the canonical
 * textual view. Truthiness follows MATLAB/Octave-like string behavior: empty
 * strings are false and non-empty strings are true.
 */
class CharString {
    /**
     * Character vector backing the textual value.
     */
    private characters: string[];

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
    public parent?: unknown;

    /**
     * `CharString` constructor.
     * @param str Runtime string value.
     * @param quote Source quote style to preserve when unparsing.
     */
    public constructor(str: string, quote: StringQuoteCharacter = doubleQuoteCharacter) {
        this.characters = str.split('');
        this.quote = quote;
    }

    /**
     * Textual scalar view of the character vector.
     *
     * This accessor preserves the long-standing public `str` contract while
     * letting the runtime store strings as character vectors internally.
     */
    public get str(): string {
        return this.characters.join('');
    }

    /**
     * Replace the textual value and rebuild the backing character vector.
     *
     * @param value New textual value.
     */
    public set str(value: string) {
        this.characters = value.split('');
    }

    /**
     * Number of characters in the vector.
     */
    public get length(): number {
        return this.characters.length;
    }

    /**
     * MATLAB/Octave-style row-vector dimensions for this character value.
     */
    public get dimension(): [number, number] {
        return [1, this.length];
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
     * Test whether a runtime text value represents a MATLAB/Octave char vector.
     *
     * Single-quoted literals and values produced with the single-quote style
     * are classified as `char`.
     */
    public static readonly isChar = (obj: unknown): obj is CharString => CharString.isInstanceOf(obj) && obj.quote === singleQuoteCharacter;

    /**
     * Test whether a runtime text value represents a MATLAB string scalar.
     *
     * Double-quoted literals and values produced with the double-quote style
     * are classified as `string`.
     */
    public static readonly isString = (obj: unknown): obj is CharString => CharString.isInstanceOf(obj) && obj.quote === doubleQuoteCharacter;

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
     * Return a copy of the backing character vector.
     *
     * @param value String wrapper.
     * @returns Character array.
     */
    public static readonly vector = (value: CharString): string[] => value.characters.slice();

    /**
     * Return a copy of this value's character vector.
     *
     * @returns Character array.
     */
    public vector(): string[] {
        return CharString.vector(this);
    }

    /**
     * Convert this value to scalar `CharString` elements, one per character.
     *
     * @param value String wrapper.
     * @returns Character scalar values preserving quote style.
     */
    public static readonly toCharacterScalars = (value: CharString): CharString[] => value.characters.map((character) => new CharString(character, value.quote));

    /**
     * Convert this value to scalar `CharString` elements.
     *
     * @returns Character scalar values preserving quote style.
     */
    public toCharacterScalars(): CharString[] {
        return CharString.toCharacterScalars(this);
    }

    /**
     * Build a string from scalar character values.
     *
     * @param values Scalar character values.
     * @param quote Quote style for the resulting value.
     * @returns A joined `CharString`.
     */
    public static readonly fromCharacterScalars = (values: CharString[], quote: StringQuoteCharacter = values[0]?.quote ?? doubleQuoteCharacter): CharString =>
        new CharString(values.map((value) => value.str).join(''), quote);

    /**
     * Convert a numeric character code to a scalar `CharString`.
     *
     * MATLAB's `char` conversion truncates nonintegers toward zero and clamps
     * values to the supported UTF-16 code-unit range.
     *
     * @param code Numeric Unicode code unit.
     * @param quote Quote style for the resulting scalar.
     * @returns Character scalar for the normalized code.
     */
    public static readonly fromNumericCode = (code: number, quote: StringQuoteCharacter = doubleQuoteCharacter): CharString => {
        const normalized = Math.max(0, Math.min(65535, Math.trunc(code)));
        return new CharString(String.fromCharCode(normalized), quote);
    };

    /**
     * Return the character at a zero-based position.
     *
     * @param index Zero-based character index.
     * @returns Scalar character value, or `undefined` when out of range.
     */
    public characterAt(index: number): CharString | undefined {
        const character = this.characters[index];
        return typeof character === 'undefined' ? undefined : new CharString(character, this.quote);
    }

    /**
     * Select characters by zero-based indices.
     *
     * @param indices Zero-based character indices.
     * @returns New `CharString` containing selected characters.
     */
    public select(indices: number[]): CharString {
        return new CharString(
            indices
                .map((index) => this.characters[index])
                .filter((character): character is string => typeof character !== 'undefined')
                .join(''),
            this.quote,
        );
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
     * `_parentPrecedence` is accepted for compatibility with other unparse
     * helpers; string rendering does not need precedence.
     *
     * @param value String value to render.
     * @param _parentPrecedence Parent operator precedence, unused.
     * @returns Raw string content.
     */
    public static readonly unparse = (value: CharString, _parentPrecedence = 0): string => value.str;

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
     * `_parentPrecedence` is accepted for compatibility with other MathML
     * helpers; string rendering does not need precedence.
     *
     * @param value String value to render.
     * @param _parentPrecedence Parent operator precedence, unused.
     * @returns MathML fragment.
     */
    public static readonly unparseMathML = (value: CharString, _parentPrecedence = 0): string => '<mi><pre>' + value.str + '</pre></mi>';

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
