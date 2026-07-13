/// <reference types="jest" />
import type { NodeClassDef } from './AST';
import { ClassDefinition } from './ClassDefinition';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

describe('ClassDefinition', () => {
    describe('Behavior', () => {
        it('Should collect properties, methods, and attributes.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef (Abstract) MetadataClass',
                        '  properties (Constant, Access = private, GetAccess = public, SetAccess = protected, Hidden, Transient, GetObservable, SetObservable, AbortSet)',
                        '    Value = 2;',
                        '  end',
                        '  methods (Static, Abstract, Hidden, Sealed)',
                        '    function y = make()',
                        '    end',
                        '  end',
                        '  events (ListenAccess = protected, NotifyAccess = private, Hidden)',
                        '    Changed',
                        '  end',
                        '  enumeration',
                        '    One',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );

            expect(definition.name).toBe('MetadataClass');
            expect(definition.isAbstract).toBe(true);
            expect(definition.properties[0].name).toBe('Value');
            expect(definition.properties[0].isConstant).toBe(true);
            expect(definition.properties[0].access).toBe('private');
            expect(definition.properties[0].getAccess).toBe('public');
            expect(definition.properties[0].setAccess).toBe('protected');
            expect(definition.properties[0].isHidden).toBe(true);
            expect(definition.properties[0].isTransient).toBe(true);
            expect(definition.properties[0].isGetObservable).toBe(true);
            expect(definition.properties[0].isSetObservable).toBe(true);
            expect(definition.properties[0].isAbortSet).toBe(true);
            expect(definition.staticMethods[0].name).toBe('make');
            expect(definition.staticMethods[0].isAbstract).toBe(true);
            expect(definition.staticMethods[0].isHidden).toBe(true);
            expect(definition.staticMethods[0].isSealed).toBe(true);
            expect(definition.events[0].listenAccess).toBe('protected');
            expect(definition.events[0].notifyAccess).toBe('private');
            expect(definition.events[0].isHidden).toBe(true);
            expect(definition.abstractMethodNames().has('make')).toBe(true);
            expect(definition.findEnumeration('One')?.classDefinition).toBe(definition);
        });

        it('Should resolve inherited members and subclasses.', () => {
            const base = ClassDefinition.create(
                parseClass(
                    ['classdef BaseSpec', '  properties', '    x = 1;', '  end', '  methods', '    function y = value(obj)', '      y = obj.x;', '    end', '  end', 'end'].join('\n'),
                ),
            );
            const child = ClassDefinition.create(
                parseClass(['classdef ChildSpec < BaseSpec', '  methods', '    function y = own(obj)', '      y = 2;', '    end', '  end', 'end'].join('\n')),
            );

            child.resolveSuperclasses(
                (name) => (name === 'BaseSpec' ? base : undefined),
                (message) => {
                    throw new Error(message);
                },
            );

            expect(child.isSubclassOf(base)).toBe(true);
            expect(child.findSuperclass('BaseSpec')).toBe(base);
            expect(child.findProperty('x')?.classDefinition).toBe(base);
            expect(child.findMethod('value')?.classDefinition).toBe(base);
            expect(child.findMethod('own')?.classDefinition).toBe(child);
        });

        it('Should reject sealed superclasses.', () => {
            const sealed = ClassDefinition.create(parseClass(['classdef (Sealed) SealedSpec', 'end'].join('\n')));
            const child = ClassDefinition.create(parseClass(['classdef IllegalSpec < SealedSpec', 'end'].join('\n')));

            expect(() =>
                child.resolveSuperclasses(
                    (name) => (name === 'SealedSpec' ? sealed : undefined),
                    (message) => {
                        throw new Error(message);
                    },
                ),
            ).toThrow('class IllegalSpec cannot inherit from sealed class SealedSpec.');
        });

        it('Should treat handle as a built-in superclass.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef HandleSpec < handle', 'end'].join('\n')));

            definition.resolveSuperclasses(
                () => undefined,
                (message) => {
                    throw new Error(message);
                },
            );

            expect(definition.isSubclassOfName('handle')).toBe(true);
            expect(definition.isHandleClass()).toBe(true);
        });

        it('Should track inherited abstract methods until compatible methods implement them.', () => {
            const base = ClassDefinition.create(parseClass(['classdef AbstractBaseSpec', '  methods (Abstract)', '    function y = value(obj)', '    end', '  end', 'end'].join('\n')));
            const pending = ClassDefinition.create(parseClass(['classdef PendingChildSpec < AbstractBaseSpec', 'end'].join('\n')));
            const implemented = ClassDefinition.create(
                parseClass(['classdef ImplementedChildSpec < AbstractBaseSpec', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const staticMismatch = ClassDefinition.create(
                parseClass(['classdef StaticMismatchSpec < AbstractBaseSpec', '  methods (Static)', '    function y = value()', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );

            const resolve = (name: string) => (name === 'AbstractBaseSpec' ? base : undefined);
            const raise = (message: string): never => {
                throw new Error(message);
            };
            pending.resolveSuperclasses(resolve, raise);
            implemented.resolveSuperclasses(resolve, raise);
            staticMismatch.resolveSuperclasses(resolve, raise);

            expect(pending.unresolvedAbstractMethods().map((method) => method.name)).toEqual(['value']);
            expect(pending.isEffectivelyAbstract()).toBe(true);
            expect(implemented.unresolvedAbstractMethods()).toEqual([]);
            expect(implemented.isEffectivelyAbstract()).toBe(false);
            expect(staticMismatch.unresolvedAbstractMethods().map((method) => method.name)).toEqual(['value']);
            expect(staticMismatch.isEffectivelyAbstract()).toBe(true);
        });
    });
});
