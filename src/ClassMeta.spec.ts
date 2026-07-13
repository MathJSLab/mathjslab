/// <reference types="jest" />
import type { NodeClassDef } from './AST';
import { CharString, Complex, MultiArray, Structure } from './AST';
import { ClassDefinition } from './ClassDefinition';
import { ClassMetaClass, ClassMetaEnumerationMember, ClassMetaEvent, ClassMetaMethod, ClassMetaProperty } from './ClassMeta';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

describe('ClassMeta', () => {
    describe('Behavior', () => {
        it('Should expose meta.class metadata.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef (Sealed) MetaSpec',
                        '  properties (Constant)',
                        '    x = 1;',
                        '  end',
                        '  methods (Static)',
                        '    function y = make()',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const meta = ClassMetaClass.create(definition);

            expect(meta.getProperty('Name')).toEqual(CharString.create('MetaSpec'));
            expect(meta.getProperty('Description')).toEqual(CharString.create(''));
            expect(MultiArray.linearize(meta.getProperty('AttributeNames') as MultiArray).map((item) => (item as CharString).str)).toEqual(['Sealed']);
            expect(Complex.realToNumber(meta.getProperty('Sealed') as any)).toBe(1);
            expect(Complex.realToNumber(meta.getProperty('Abstract') as any)).toBe(0);
            expect(MultiArray.linearize(meta.getProperty('PropertyList') as MultiArray)[0]).toBeInstanceOf(ClassMetaProperty);
            expect(MultiArray.linearize(meta.getProperty('MethodList') as MultiArray)[0]).toBeInstanceOf(ClassMetaMethod);
        });

        it('Should expose meta.member metadata.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef MemberMetaSpec', '  properties (Access = private, Dependent)', '    x', '  end', 'end'].join('\n')));
            const property = ClassMetaProperty.create(definition.properties[0]);

            expect(property.getProperty('Name')).toEqual(CharString.create('x'));
            expect(property.getProperty('GetAccess')).toEqual(CharString.create('private'));
            expect(property.getProperty('SetAccess')).toEqual(CharString.create('private'));
            expect(property.getProperty('Access')).toEqual(CharString.create('private'));
            expect(Complex.realToNumber(property.getProperty('Dependent') as any)).toBe(1);
            expect(Complex.realToNumber(property.getProperty('HasDefault') as any)).toBe(0);
            expect(property.getProperty('DefiningClass')).toBeInstanceOf(ClassMetaClass);
        });

        it('Should expose method, event, and enumeration metadata.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef RichMetaSpec',
                        '  methods (Static, Sealed)',
                        '    function [y,z] = make(x)',
                        '      arguments',
                        '        x (1,1) double = 1',
                        '      end',
                        '      y = x;',
                        '      z = x;',
                        '    end',
                        '  end',
                        '  events (ListenAccess = private, NotifyAccess = protected)',
                        '    Changed',
                        '  end',
                        '  enumeration',
                        '    One(1)',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );

            const method = ClassMetaMethod.create(definition.methods[0]);
            const event = ClassMetaEvent.create(definition.events[0]);
            const enumeration = ClassMetaEnumerationMember.create(definition.enumerations[0]);
            const inputValidation = MultiArray.linearize(method.getProperty('InputValidation') as MultiArray)[0] as Structure;

            expect(method.getProperty('Access')).toEqual(CharString.create('public'));
            expect(Complex.realToNumber(method.getProperty('Static') as any)).toBe(1);
            expect(Complex.realToNumber(method.getProperty('Sealed') as any)).toBe(1);
            expect(MultiArray.linearize(method.getProperty('InputNames') as MultiArray).map((item) => (item as CharString).str)).toEqual(['x']);
            expect(MultiArray.linearize(method.getProperty('OutputNames') as MultiArray).map((item) => (item as CharString).str)).toEqual(['y', 'z']);
            expect((inputValidation.field.Name as CharString).str).toBe('x');
            expect(Complex.realToNumber(inputValidation.field.HasDefault as any)).toBe(1);
            expect(event.getProperty('ListenAccess')).toEqual(CharString.create('private'));
            expect(event.getProperty('NotifyAccess')).toEqual(CharString.create('protected'));
            expect(MultiArray.linearize(enumeration.getProperty('ConstructorArguments') as MultiArray).map((item) => (item as CharString).str)).toEqual(['1']);
        });
    });
});
