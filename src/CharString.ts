import { ComplexDecimal } from './ComplexDecimal';

type StringQuote = '"' | "'";

class CharString {
    public str: string;
    public quote: StringQuote;
    public static readonly STRING = 3;
    public readonly type = CharString.STRING;
    public parent: any;
    constructor(str: string, quote: StringQuote = '"') {
        this.str = str;
        this.quote = quote;
    }
    public static create(str: string, quote: string = '"'): CharString {
        return new CharString(str, quote as StringQuote);
    }
    public static copy(str: CharString): CharString {
        return new CharString(str.str, str.quote);
    }
    public copy(): CharString {
        return new CharString(this.str, this.quote);
    }
    public static parse(str: string): CharString {
        return new CharString(str);
    }
    public static unparse(value: CharString, parentPrecedence = 0): string {
        return value.str;
    }
    public static unparseEscaped(value: CharString): string {
        let result = JSON.stringify(value.str);
        result = result
            .substring(1, result.length - 2)
            .replace(/\\\\/, '\\')
            .replace(/\\\"/, '""');
        return '"' + result + '"';
    }
    public static unparseMathML(value: CharString, parentPrecedence = 0): string {
        return '<mn><pre>' + value.str + '</pre></mn>';
    }
    public static unparseEscapedMathML(value: CharString): string {
        let result = JSON.stringify(value.str);
        result = result
            .substring(1, result.length - 2)
            .replace(/\\\\/, '\\')
            .replace(/\\\"/, '""');
        return '<mn><pre>"' + result + '"</pre></mn>';
    }
    public unparse(): string {
        return this.str;
    }
    public unparseEscaped(): string {
        return CharString.unparseEscaped(this);
    }
    public static toLogical(value: CharString): ComplexDecimal {
        return value.str ? ComplexDecimal.true() : ComplexDecimal.false();
    }
    public toLogical(): ComplexDecimal {
        return this.str ? ComplexDecimal.true() : ComplexDecimal.false();
    }
}
export type { StringQuote };
export { CharString };
export default CharString;
