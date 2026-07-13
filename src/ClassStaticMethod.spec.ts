/// <reference types="jest" />
import type { NodeClassDef } from './AST';
import { ClassDefinition } from './ClassDefinition';
import { ClassStaticMethod } from './ClassStaticMethod';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

describe('ClassStaticMethod', () => {
    describe('Behavior', () => {
        it('Should bind a static method to a class definition.', () => {
            const definition = ClassDefinition.create(
                parseClass(['classdef StaticSpec', '  methods (Static)', '    function y = make()', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const method = definition.findMethod('make', (item) => item.isStatic)!;
            const staticMethod = ClassStaticMethod.bind(definition, method);

            expect(ClassStaticMethod.isInstanceOf(staticMethod)).toBe(true);
            expect(staticMethod.classDefinition).toBe(definition);
            expect(staticMethod.method).toBe(method);
            expect(ClassStaticMethod.copy(staticMethod)).not.toBe(staticMethod);
            expect(ClassStaticMethod.unparse(staticMethod, Interpreter.Create())).toBe('StaticSpec.make static method');
        });
    });
});
