import path from 'node:path';
import { MathML } from './MathML';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} and its 'format' property should be defined.`, () => {
            expect(MathML).toBeDefined();
            expect(MathML.format).toBeDefined();
        });
    });

    describe('Operator formatting', () => {
        it('Should format common infix, prefix, postfix, and power operators.', () => {
            expect(MathML.format['+']('<mi>a</mi>', '<mi>b</mi>')).toBe('<mi>a</mi><mo form="infix" stretchy="true">+</mo><mi>b</mi>');
            expect(MathML.format['-_']('<mi>x</mi>')).toBe('<mo form="prefix" stretchy="true">-</mo><mi>x</mi>');
            expect(MathML.format['_++']('<mi>x</mi>')).toBe('<mi>x</mi><mo form="postfix" stretchy="true">++</mo>');
            expect(MathML.format['^']('<mi>x</mi>', '<mn>2</mn>')).toBe('<msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup>');
        });
    });

    describe('AST node formatting', () => {
        it('Should format identifiers, lists, ranges, and index expressions.', () => {
            expect(MathML.format.IDENT('alpha')).toBe('<mi>alpha</mi>');
            expect(MathML.format.LIST(['<mn>1</mn>', '<mn>2</mn>'])).toBe('<mtable><mtr><mtd><mn>1</mn></mtd></mtr><mtr><mtd><mn>2</mn></mtd></mtr></mtable>');
            expect(MathML.format.RANGE('<mn>1</mn>', '<mn>2</mn>', '<mn>5</mn>')).toBe('<mn>1</mn><mo>:</mo><mn>2</mn><mo>:</mo><mn>5</mn>');
            expect(MathML.format.IDX('<mi>A</mi>', '(', ['<mn>1</mn>', '<mn>2</mn>'], ')')).toBe(
                '<mi>A</mi><mrow><mo fence="true" stretchy="true">(</mo><mn>1</mn><mo>,</mo><mn>2</mn><mo fence="true" stretchy="true">)</mo></mrow>',
            );
        });

        it('Should wrap complete MathML documents.', () => {
            expect(MathML.format.math('<mi>x</mi>', 'block')).toBe('<math xmlns = "http://www.w3.org/1998/Math/MathML" display="block"><mi>x</mi></math>');
        });
    });
});
