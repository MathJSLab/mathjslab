/// <reference types="jest" />
import type { NodeClassDef } from './AST';
import { ClassDefinition } from './ClassDefinition';
import { ClassEmptyMethod } from './ClassEmptyMethod';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

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
