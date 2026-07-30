/// <reference types="jest" />
import { AST } from './AST';
import { Complex } from './Complex';
import { ClassDefinition } from './ClassDefinition';
import { ClassEnumerationValue } from './ClassEnumerationValue';
import { Interpreter } from './Interpreter';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

describe('ClassEnumerationValue', () => {
    describe('Behavior', () => {
        it('Should create and copy enumeration values.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef EnumSpec', '  enumeration', '    One(1)', '  end', 'end'].join('\n')));
            const enumeration = definition.findEnumeration('One')!;
            const value = ClassEnumerationValue.create(definition, enumeration, [Complex.create(1)]);
            const copy = ClassEnumerationValue.copy(value);

            expect(ClassEnumerationValue.isInstanceOf(value)).toBe(true);
            expect(value.classDefinition).toBe(definition);
            expect(value.enumeration).toBe(enumeration);
            expect(value.args.length).toBe(1);
            expect(AST.isRuntimeExpressionValue(value.args[0])).toBe(true);
            expect(copy).not.toBe(value);
            expect(copy.args).not.toBe(value.args);
            expect(ClassEnumerationValue.unparse(value, Interpreter.Create())).toBe('EnumSpec.One');
        });
    });
});
