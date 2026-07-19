/// <reference types="jest" />
import type { NodeClassDef } from './AST';
import { Complex } from './Complex';
import { ClassBoundMethod } from './ClassBoundMethod';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

describe('ClassBoundMethod', () => {
    describe('Behavior', () => {
        it('Should bind an instance method to an instance.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef BoundSpec', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')));
            const instance = ClassInstance.instantiate(definition, () => Complex.create(0));
            const method = definition.findMethod('value', (item) => !item.isStatic)!;
            const bound = ClassBoundMethod.bind(instance, method);

            expect(ClassBoundMethod.isInstanceOf(bound)).toBe(true);
            expect(bound.instance).toBe(instance);
            expect(bound.method).toBe(method);
            expect(ClassBoundMethod.copy(bound)).not.toBe(bound);
            expect(ClassBoundMethod.unparse(bound, Interpreter.Create())).toBe('BoundSpec.value method');
        });
    });
});
