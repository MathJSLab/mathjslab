/// <reference types="jest" />
import path from 'node:path';
import type { NodeClassDef } from './AST';
import { CharString } from './CharString';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { Complex } from './Complex';
import { Interpreter } from './Interpreter';
import { MultiArray } from './MultiArray';
import { RuntimeEquality } from './RuntimeEquality';
import { Structure } from './Structure';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;
const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Runtime equality', () => {
        it('Should compare scalar text and numeric values with isequal semantics.', () => {
            expect(RuntimeEquality.valuesEqual(Complex.create(1), Complex.create(1))).toBe(true);
            expect(RuntimeEquality.valuesEqual(Complex.create(1), Complex.create(2))).toBe(false);
            expect(RuntimeEquality.valuesEqual(CharString.create('abc'), CharString.create('abc'))).toBe(true);
            expect(RuntimeEquality.valuesEqual(CharString.create('abc'), CharString.create('def'))).toBe(false);
        });

        it('Should compare arrays and structures recursively.', () => {
            const leftArray = MultiArray.firstRow([Complex.one(), CharString.create('x')]);
            const rightArray = MultiArray.firstRow([Complex.one(), CharString.create('x')]);
            const otherArray = MultiArray.firstRow([Complex.one(), CharString.create('y')]);

            expect(RuntimeEquality.valuesEqual(leftArray, rightArray)).toBe(true);
            expect(RuntimeEquality.valuesEqual(leftArray, otherArray)).toBe(false);
            expect(RuntimeEquality.valuesEqual(new Structure({ a: leftArray }), new Structure({ a: rightArray }))).toBe(true);
            expect(RuntimeEquality.valuesEqual(new Structure({ a: leftArray }), new Structure({ a: otherArray }))).toBe(false);
        });

        it('Should compare value classes by properties and handle classes by identity.', () => {
            const valueClass = ClassDefinition.create(parseClass(['classdef RuntimeEqualityValue', '  properties', '    x = 0;', '  end', 'end'].join('\n')));
            const leftValue = ClassInstance.instantiate(valueClass, () => Complex.zero());
            const rightValue = ClassInstance.instantiate(valueClass, () => Complex.zero());
            const otherValue = ClassInstance.instantiate(valueClass, () => Complex.zero());
            const handleClass = ClassDefinition.create(parseClass(['classdef RuntimeEqualityHandle < handle', 'end'].join('\n')));
            const handle = ClassInstance.instantiate(handleClass, () => Complex.zero());
            const otherHandle = ClassInstance.instantiate(handleClass, () => Complex.zero());
            ClassInstance.setProperty(leftValue, 'x', Complex.one());
            ClassInstance.setProperty(rightValue, 'x', Complex.one());
            ClassInstance.setProperty(otherValue, 'x', Complex.two());

            expect(RuntimeEquality.valuesEqual(leftValue, rightValue)).toBe(true);
            expect(RuntimeEquality.valuesEqual(leftValue, otherValue)).toBe(false);
            expect(RuntimeEquality.valuesEqual(handle, handle)).toBe(true);
            expect(RuntimeEquality.valuesEqual(handle, otherHandle)).toBe(false);
        });
    });
});
