/// <reference types="jest" />
import path from 'node:path';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const realNumber = (value: unknown): number => {
    if (!Complex.isInstanceOf(value)) {
        throw new Error('expected a Complex scalar.');
    }
    return Complex.realToNumber(value as ComplexType);
};

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} should be defined.`, () => {
            expect(CharString).toBeDefined();
        });
    });

    describe('Construction and copying', () => {
        it('Should preserve string content and quote style.', () => {
            const value = new CharString('hello', "'");

            expect(value.str).toBe('hello');
            expect(value.quote).toBe("'");
            expect(CharString.isInstanceOf(value)).toBe(true);
            expect(CharString.isInstanceOf('hello')).toBe(false);
        });

        it('Should copy values without aliasing the original instance.', () => {
            const value = new CharString('alpha');
            const copy = CharString.copy(value);

            expect(copy).not.toBe(value);
            expect(copy.str).toBe('alpha');
            copy.str = 'beta';
            expect(value.str).toBe('alpha');
        });

        it('Should expose strings as MATLAB-style row character vectors.', () => {
            const value = new CharString('abcd', "'");

            expect(value.length).toBe(4);
            expect(value.dimension).toEqual([1, 4]);
            expect(value.vector()).toEqual(['a', 'b', 'c', 'd']);
            expect(value.toCharacterScalars().map((item) => item.str)).toEqual(['a', 'b', 'c', 'd']);
            expect(value.toCharacterScalars().every((item) => item.quote === "'")).toBe(true);
            expect(value.characterAt(2)?.str).toBe('c');
            expect(value.select([0, 2]).str).toBe('ac');

            value.str = 'xy';
            expect(value.length).toBe(2);
            expect(value.dimension).toEqual([1, 2]);
            expect(value.vector()).toEqual(['x', 'y']);
        });

        it('Should preserve JavaScript string-unit indexing for compatibility with previous character behavior.', () => {
            const value = new CharString('😀');

            expect(value.length).toBe('😀'.length);
            expect(value.vector()).toEqual('😀'.split(''));
        });

        it('Should join scalar character values preserving quote style.', () => {
            const value = CharString.fromCharacterScalars([new CharString('a', "'"), new CharString('b', "'")]);

            expect(value.str).toBe('ab');
            expect(value.quote).toBe("'");
        });
    });

    describe('Formatting and logical conversion', () => {
        it('Should render strings for source, display, escaped source, and MathML.', () => {
            const value = new CharString('x');

            expect(CharString.parse('x').str).toBe('x');
            expect(CharString.unparse(value)).toBe('x');
            expect(CharString.toString(value)).toBe('x');
            expect(value.toString()).toBe('x');
            expect(CharString.unparseEscaped(value)).toBe('"x"');
            expect(CharString.unparseMathML(value)).toBe('<mi><pre>x</pre></mi>');
            expect(CharString.unparseEscapedMathML(value)).toBe('<mi><pre>"x"</pre></mi>');
        });

        it('Should convert empty and non-empty strings to logical complex scalars.', () => {
            expect(realNumber(CharString.logical(new CharString('')))).toBe(0);
            expect(realNumber(CharString.logical(new CharString('x')))).toBe(1);
            expect(realNumber(new CharString('x').toLogical())).toBe(1);
        });
    });
});
