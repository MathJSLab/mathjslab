/// <reference types="jest" />
import { ClassDefinition } from './ClassDefinition';
import { ClassEmptyMethod } from './ClassEmptyMethod';
import { Interpreter } from './Interpreter';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

describe('ClassEmptyMethod', () => {
    describe('Behavior', () => {
        it('Should bind the built-in empty method to a class definition.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef EmptySpec', 'end'].join('\n')));
            const emptyMethod = ClassEmptyMethod.bind(definition);

            expect(ClassEmptyMethod.isInstanceOf(emptyMethod)).toBe(true);
            expect(emptyMethod.classDefinition).toBe(definition);
            expect(ClassEmptyMethod.copy(emptyMethod)).not.toBe(emptyMethod);
            expect(ClassEmptyMethod.unparse(emptyMethod, Interpreter.Create())).toBe('EmptySpec.empty static method');
        });
    });
});
