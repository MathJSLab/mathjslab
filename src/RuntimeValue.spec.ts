/// <reference types="jest" />
import path from 'node:path';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { ClassMetaClass } from './ClassMeta';
import { MultiArray } from './MultiArray';
import { RuntimeValue } from './RuntimeValue';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];
import { parseClassDefinition as parseClass } from './ParserTestUtils';

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Runtime dimensions', () => {
        it('Should copy runtime values through the structural copy protocol.', () => {
            const scalar = Complex.one();
            const text = CharString.create('abc');
            const array = MultiArray.firstRow([scalar, text]);
            const copiedArray = RuntimeValue.copy(array);

            expect(RuntimeValue.copy(scalar)).not.toBe(scalar);
            expect(RuntimeValue.copy(text)).not.toBe(text);
            expect(copiedArray).not.toBe(array);
            expect((copiedArray as MultiArray).array[0][0]).not.toBe(scalar);
            expect((copiedArray as MultiArray).array[0][1]).not.toBe(text);
        });

        it('Should preserve values without a runtime copy protocol.', () => {
            const plain = { value: 1 };
            const definition = ClassDefinition.create(parseClass('classdef RuntimeValueCopySpec\nend'));

            expect(RuntimeValue.copy(plain)).toBe(plain);
            expect(RuntimeValue.copy(definition)).toBe(definition);
        });

        it('Should identify class instances without confusing class metadata.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef RuntimeValueObjectSpec', '  properties', '    x = 0;', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.zero());
            const meta = ClassMetaClass.create(definition);

            expect(RuntimeValue.isClassInstance(instance)).toBe(true);
            expect(RuntimeValue.classDefinitionOfInstance(instance)).toBe(definition);
            expect(RuntimeValue.isClassInstance(meta)).toBe(false);
            expect(RuntimeValue.classDefinitionOfInstance(meta)).toBeUndefined();
        });

        it('Should expose MATLAB-style dimensions for scalar, text, and array values.', () => {
            expect(RuntimeValue.dimensions(Complex.one())).toEqual([1, 1]);
            expect(RuntimeValue.elementCount(Complex.one())).toBe(1);

            expect(RuntimeValue.dimensions(CharString.create('abc'))).toEqual([1, 3]);
            expect(RuntimeValue.elementCount(CharString.create('abc'))).toBe(3);

            const array = new MultiArray([2, 3]);
            expect(RuntimeValue.dimensions(array)).toEqual([2, 3]);
            expect(RuntimeValue.elementCount(array)).toBe(6);
        });

        it('Should pad dimensions to the requested minimum rank.', () => {
            expect(RuntimeValue.dimensions(Complex.one(), 4)).toEqual([1, 1, 1, 1]);
            expect(RuntimeValue.dimensions(CharString.create('ab'), 4)).toEqual([1, 2, 1, 1]);
        });

        it('Should classify common runtime shapes structurally.', () => {
            expect(RuntimeValue.isScalar(Complex.one())).toBe(true);
            expect(RuntimeValue.isScalar(CharString.create('a'))).toBe(true);
            expect(RuntimeValue.isScalar(CharString.create('abc'))).toBe(false);
            expect(RuntimeValue.isEmpty(CharString.create(''))).toBe(true);
            expect(RuntimeValue.isVector(CharString.create('abc'))).toBe(true);
            expect(RuntimeValue.isRowVector(CharString.create('abc'))).toBe(true);
            expect(RuntimeValue.isColumnVector(CharString.create('abc'))).toBe(false);
            expect(RuntimeValue.isMatrix(CharString.create('abc'))).toBe(true);
            expect(RuntimeValue.isSquareMatrix(CharString.create('a'))).toBe(true);
            expect(RuntimeValue.isSquareMatrix(CharString.create('ab'))).toBe(false);
        });
    });
});
