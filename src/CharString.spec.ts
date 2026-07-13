/// <reference types="jest" />
import path from 'node:path';
import { CharString } from './CharString';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

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
            expect((CharString.logical(new CharString('')) as any).re.toString()).toBe('0');
            expect((CharString.logical(new CharString('x')) as any).re.toString()).toBe('1');
            expect((new CharString('x').toLogical() as any).re.toString()).toBe('1');
        });
    });
});
