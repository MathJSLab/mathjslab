/// <reference types="jest" />
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { ClassDefinition } from './ClassDefinition';
import { ClassMetaClass, ClassMetaEnumerationMember, ClassMetaEvent, ClassMetaMethod, ClassMetaProperty } from './ClassMeta';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

const realNumber = (value: unknown): number => {
    if (!Complex.isInstanceOf(value)) {
        throw new Error('expected a Complex scalar.');
    }
    return Complex.realToNumber(value as ComplexType);
};

const identifierName = (value: unknown): string => {
    if (!AST.isNodeIdentifier(value)) {
        throw new Error('expected an identifier node.');
    }
    return value.id;
};

describe('ClassMeta', () => {
    describe('Behavior', () => {
        it('Should expose meta.class metadata.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef (Sealed, Hidden, ConstructOnLoad, HandleCompatible, InferiorClasses = {?LowPriorityMetaSpec, ?pkg.OtherLowMetaSpec}, AllowedSubclasses = {?AllowedMetaChildSpec}) MetaSpec',
                        '  properties (Constant, NonCopyable, PartialMatchPriority = 4)',
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
            expect(MultiArray.linearize(meta.getProperty('AttributeNames') as MultiArray).map((item) => (item as CharString).str)).toEqual([
                'AllowedSubclasses',
                'ConstructOnLoad',
                'HandleCompatible',
                'Hidden',
                'InferiorClasses',
                'Sealed',
            ]);
            expect(realNumber(meta.getProperty('Sealed'))).toBe(1);
            expect(realNumber(meta.getProperty('Hidden'))).toBe(1);
            expect(realNumber(meta.getProperty('ConstructOnLoad'))).toBe(1);
            expect(realNumber(meta.getProperty('HandleCompatible'))).toBe(1);
            expect(realNumber(meta.getProperty('RestrictsSubclassing'))).toBe(1);
            expect(realNumber(meta.getProperty('Abstract'))).toBe(0);
            expect(meta.getProperty('ContainingPackage')).toEqual(CharString.create(''));
            expect(MultiArray.linearize(meta.getProperty('InferiorClasses') as MultiArray).map((item) => (item as CharString).str)).toEqual(['LowPriorityMetaSpec', 'pkg.OtherLowMetaSpec']);
            expect(MultiArray.linearize(meta.getProperty('AllowedSubclasses') as MultiArray).map((item) => (item as CharString).str)).toEqual(['AllowedMetaChildSpec']);
            expect(MultiArray.linearize(meta.getProperty('PropertyList') as MultiArray)[0]).toBeInstanceOf(ClassMetaProperty);
            expect(MultiArray.linearize(meta.getProperty('MethodList') as MultiArray)[0]).toBeInstanceOf(ClassMetaMethod);
            expect(realNumber((MultiArray.linearize(meta.getProperty('PropertyList') as MultiArray)[0] as ClassMetaProperty).getProperty('NonCopyable'))).toBe(1);
            expect(realNumber((MultiArray.linearize(meta.getProperty('PropertyList') as MultiArray)[0] as ClassMetaProperty).getProperty('PartialMatchPriority'))).toBe(4);
        });

        it('Should expose the containing package for qualified class names.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef pkg.sub.QualifiedMetaSpec', 'end'].join('\n')));
            const meta = ClassMetaClass.create(definition);

            expect(meta.getProperty('Name')).toEqual(CharString.create('pkg.sub.QualifiedMetaSpec'));
            expect(meta.getProperty('ContainingPackage')).toEqual(CharString.create('pkg.sub'));
        });

        it('Should expose false class-level boolean attributes in meta.class.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef (Hidden = false, ConstructOnLoad = false) FalseClassMetaSpec', 'end'].join('\n')));
            const meta = ClassMetaClass.create(definition);

            expect(realNumber(meta.getProperty('Hidden'))).toBe(0);
            expect(realNumber(meta.getProperty('ConstructOnLoad'))).toBe(0);
            expect(realNumber(meta.getProperty('RestrictsSubclassing'))).toBe(0);
        });

        it('Should expose explicit RestrictsSubclassing in meta.class.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef (RestrictsSubclassing) ExplicitRestrictsSubclassingSpec', 'end'].join('\n')));
            const meta = ClassMetaClass.create(definition);

            expect(definition.isRestrictsSubclassing).toBe(true);
            expect(realNumber(meta.getProperty('RestrictsSubclassing'))).toBe(1);
        });

        it('Should expose meta.member metadata.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef MemberMetaSpec',
                        '  properties (Access = private, Dependent, GetMethod = readValue, SetMethod = "writeValue")',
                        '    x',
                        '  end',
                        '  methods',
                        '    function y = readValue(obj)',
                        '      y = 1;',
                        '    end',
                        '    function obj = writeValue(obj, value)',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const property = ClassMetaProperty.create(definition.properties[0]);

            expect(property.getProperty('Name')).toEqual(CharString.create('x'));
            expect(property.getProperty('GetAccess')).toEqual(CharString.create('private'));
            expect(property.getProperty('SetAccess')).toEqual(CharString.create('private'));
            expect(property.getProperty('Access')).toEqual(CharString.create('private'));
            expect(property.getProperty('GetMethod')).toEqual(CharString.create('readValue'));
            expect(property.getProperty('SetMethod')).toEqual(CharString.create('writeValue'));
            expect(realNumber(property.getProperty('Dependent'))).toBe(1);
            expect(realNumber(property.getProperty('NonCopyable'))).toBe(0);
            expect(realNumber(property.getProperty('PartialMatchPriority'))).toBe(1);
            expect(realNumber(property.getProperty('HasDefault'))).toBe(0);
            expect(property.getProperty('DefiningClass')).toBeInstanceOf(ClassMetaClass);
        });

        it('Should expose property validation metadata.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef PropertyValidationSpec', '  properties', '    x (1,1) double {mustBePositive} = 1', '  end', 'end'].join('\n')));
            const property = ClassMetaProperty.create(definition.properties[0]);
            const validation = MultiArray.linearize(property.getProperty('Validation') as MultiArray)[0] as Structure;

            expect(definition.properties[0].size.map(realNumber)).toEqual([1, 1]);
            expect(identifierName(definition.properties[0].class)).toBe('double');
            expect(definition.properties[0].functions.map(identifierName)).toEqual(['mustBePositive']);
            expect((validation.field.Name as CharString).str).toBe('x');
            expect(MultiArray.linearize(validation.field.Size as MultiArray).map((item) => (item as CharString).str)).toEqual(['1', '1']);
            expect((validation.field.Class as CharString).str).toBe('double');
            expect(MultiArray.linearize(validation.field.Validators as MultiArray).map((item) => (item as CharString).str)).toEqual(['mustBePositive']);
            expect(realNumber(validation.field.HasDefault)).toBe(1);
            expect(realNumber(validation.field.DefaultValue)).toBe(1);
        });

        it('Should expose method, event, and enumeration metadata.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef RichMetaSpec',
                        '  methods (Static, Sealed)',
                        '    function [y,z] = make(x, scale = 2)',
                        '      arguments',
                        '        x (1,1) double = 1',
                        '      end',
                        '      y = x;',
                        '      z = scale;',
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
            expect(realNumber(method.getProperty('Static'))).toBe(1);
            expect(realNumber(method.getProperty('Sealed'))).toBe(1);
            expect(MultiArray.linearize(method.getProperty('InputNames') as MultiArray).map((item) => (item as CharString).str)).toEqual(['x', 'scale']);
            expect(MultiArray.linearize(method.getProperty('OutputNames') as MultiArray).map((item) => (item as CharString).str)).toEqual(['y', 'z']);
            expect((inputValidation.field.Name as CharString).str).toBe('x');
            expect(realNumber(inputValidation.field.HasDefault)).toBe(1);
            expect(realNumber(inputValidation.field.DefaultValue)).toBe(1);
            expect(event.getProperty('ListenAccess')).toEqual(CharString.create('private'));
            expect(event.getProperty('NotifyAccess')).toEqual(CharString.create('protected'));
            expect(MultiArray.linearize(enumeration.getProperty('ConstructorArguments') as MultiArray).map((item) => (item as CharString).str)).toEqual(['1']);
        });
    });
});
