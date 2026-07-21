/// <reference types="jest" />
import { AST } from './AST';
import { ClassDefinition } from './ClassDefinition';

import { parseClassDefinition as parseClass } from './ParserTestUtils';

describe('ClassDefinition', () => {
    describe('Behavior', () => {
        it('Should collect properties, methods, and attributes.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef (Abstract, Hidden, ConstructOnLoad, InferiorClasses = {?LowPrioritySpec, ?pkg.OtherLowSpec}, AllowedSubclasses = {?AllowedChildSpec}) MetadataClass',
                        '  properties (Constant, Access = private, GetAccess = public, SetAccess = protected, Hidden, Transient, NonCopyable, GetObservable, SetObservable, AbortSet, PartialMatchPriority = 3)',
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
            expect(definition.packageName).toBe('');
            expect(definition.simpleName).toBe('MetadataClass');
            expect(definition.isAbstract).toBe(true);
            expect(definition.isHidden).toBe(true);
            expect(definition.isConstructOnLoad).toBe(true);
            expect(definition.isHandleCompatible).toBe(false);
            expect(definition.inferiorClasses).toEqual(['LowPrioritySpec', 'pkg.OtherLowSpec']);
            expect(definition.allowedSubclasses).toEqual(['AllowedChildSpec']);
            expect(definition.isRestrictsSubclassing).toBe(true);
            expect(definition.properties[0].name).toBe('Value');
            expect(definition.properties[0].isConstant).toBe(true);
            expect(definition.properties[0].access).toBe('private');
            expect(definition.properties[0].getAccess).toBe('public');
            expect(definition.properties[0].setAccess).toBe('protected');
            expect(definition.properties[0].isHidden).toBe(true);
            expect(definition.properties[0].isTransient).toBe(true);
            expect(definition.properties[0].isNonCopyable).toBe(true);
            expect(definition.properties[0].isGetObservable).toBe(true);
            expect(definition.properties[0].isSetObservable).toBe(true);
            expect(definition.properties[0].isAbortSet).toBe(true);
            expect(definition.properties[0].partialMatchPriority).toBe(3);
            expect(definition.properties[0].getMethodName).toBeNull();
            expect(definition.properties[0].setMethodName).toBeNull();
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

        it('Should reject structurally invalid class section members instead of ignoring them.', () => {
            const invalidProperty = parseClass(['classdef InvalidPropertyMemberSpec', '  properties', '    Value', '  end', 'end'].join('\n'));
            invalidProperty.sections[0].members.list.push(AST.nodeReturn());
            const invalidMethod = parseClass(['classdef InvalidMethodMemberSpec', '  methods', '    function y = value(obj)', '    end', '  end', 'end'].join('\n'));
            invalidMethod.sections[0].members.list.push(AST.nodeReturn());
            const invalidEvent = parseClass(['classdef InvalidEventMemberSpec', '  events', '    Changed', '  end', 'end'].join('\n'));
            invalidEvent.sections[0].members.list.push(AST.nodeReturn());
            const invalidEnumeration = parseClass(['classdef InvalidEnumerationMemberSpec', '  enumeration', '    One', '  end', 'end'].join('\n'));
            invalidEnumeration.sections[0].members.list.push(AST.nodeReturn());

            expect(() => ClassDefinition.create(invalidProperty)).toThrow('internal AST error: properties member 2 has invalid node type.');
            expect(() => ClassDefinition.create(invalidMethod)).toThrow('internal AST error: methods member 2 has invalid node type.');
            expect(() => ClassDefinition.create(invalidEvent)).toThrow('internal AST error: events member 2 has invalid node type.');
            expect(() => ClassDefinition.create(invalidEnumeration)).toThrow('internal AST error: enumeration member 2 has invalid node type.');
        });

        it('Should collect negated and boolean class attributes as false.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef (Abstract = false, Sealed = false, Hidden = false, ConstructOnLoad = false, HandleCompatible = false) BooleanAttributeSpec',
                        '  properties (~Dependent, !Hidden, Constant = false, Transient = false, NonCopyable = false, GetObservable = false, SetObservable = false, AbortSet = false)',
                        '    Value',
                        '  end',
                        '  methods (Static = false, Abstract = false, Hidden = false, Sealed = false)',
                        '    function y = value(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        '  events (Hidden = false)',
                        '    Changed',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );

            expect(definition.isAbstract).toBe(false);
            expect(definition.isSealed).toBe(false);
            expect(definition.isHidden).toBe(false);
            expect(definition.isConstructOnLoad).toBe(false);
            expect(definition.isHandleCompatible).toBe(false);
            expect(definition.isRestrictsSubclassing).toBe(false);
            expect(definition.properties[0].isDependent).toBe(false);
            expect(definition.properties[0].isHidden).toBe(false);
            expect(definition.properties[0].isConstant).toBe(false);
            expect(definition.properties[0].isTransient).toBe(false);
            expect(definition.properties[0].isNonCopyable).toBe(false);
            expect(definition.properties[0].isGetObservable).toBe(false);
            expect(definition.properties[0].isSetObservable).toBe(false);
            expect(definition.properties[0].isAbortSet).toBe(false);
            expect(definition.properties[0].partialMatchPriority).toBe(1);
            expect(definition.methods[0].isStatic).toBe(false);
            expect(definition.methods[0].isAbstract).toBe(false);
            expect(definition.methods[0].isHidden).toBe(false);
            expect(definition.methods[0].isSealed).toBe(false);
            expect(definition.events[0].isHidden).toBe(false);
        });

        it('Should expose package and simple names for qualified class names.', () => {
            const definition = ClassDefinition.create(parseClass(['classdef pkg.sub.QualifiedDefinitionSpec', 'end'].join('\n')));

            expect(definition.name).toBe('pkg.sub.QualifiedDefinitionSpec');
            expect(definition.packageName).toBe('pkg.sub');
            expect(definition.simpleName).toBe('QualifiedDefinitionSpec');
        });

        it('Should collect class-qualified access attributes.', () => {
            const definition = ClassDefinition.create(
                parseClass(
                    [
                        'classdef FriendMetadataSpec',
                        '  properties (Access = {?FriendAccessorSpec, ?FriendAuditorSpec})',
                        '    Value = 2;',
                        '  end',
                        '  methods (Access = {?FriendAccessorSpec, ?FriendAuditorSpec})',
                        '    function y = read(obj)',
                        '      y = obj.Value;',
                        '    end',
                        '  end',
                        '  events (ListenAccess = {?FriendAccessorSpec, ?FriendAuditorSpec}, NotifyAccess = {?FriendAccessorSpec, ?FriendAuditorSpec})',
                        '    Changed',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );

            expect(definition.properties[0].access).toBe('{?FriendAccessorSpec,?FriendAuditorSpec}');
            expect(definition.methods[0].access).toBe('{?FriendAccessorSpec,?FriendAuditorSpec}');
            expect(definition.events[0].listenAccess).toBe('{?FriendAccessorSpec,?FriendAuditorSpec}');
            expect(definition.events[0].notifyAccess).toBe('{?FriendAccessorSpec,?FriendAuditorSpec}');
        });

        it('Should reject unsupported class and section attributes.', () => {
            const invalidClassAttribute = ClassDefinition.create(parseClass(['classdef (Imaginary) InvalidClassAttributeSpec', 'end'].join('\n')));
            const invalidPropertyAttribute = ClassDefinition.create(
                parseClass(['classdef InvalidPropertyAttributeSpec', '  properties (Static)', '    Value = 1;', '  end', 'end'].join('\n')),
            );
            const invalidMethodAttribute = ClassDefinition.create(
                parseClass(['classdef InvalidMethodAttributeSpec', '  methods (Dependent)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const invalidEventAttribute = ClassDefinition.create(
                parseClass(['classdef InvalidEventAttributeSpec', '  events (SetAccess = private)', '    Changed', '  end', 'end'].join('\n')),
            );
            const invalidEnumerationAttribute = ClassDefinition.create(
                parseClass(['classdef InvalidEnumerationAttributeSpec', '  enumeration (Access = private)', '    One', '  end', 'end'].join('\n')),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => invalidClassAttribute.resolveSuperclasses(() => undefined, raise)).toThrow('unsupported Imaginary attribute for class InvalidClassAttributeSpec.');
            expect(() => invalidPropertyAttribute.resolveSuperclasses(() => undefined, raise)).toThrow(
                'unsupported Static attribute for properties section of class InvalidPropertyAttributeSpec.',
            );
            expect(() => invalidMethodAttribute.resolveSuperclasses(() => undefined, raise)).toThrow(
                'unsupported Dependent attribute for methods section of class InvalidMethodAttributeSpec.',
            );
            expect(() => invalidEventAttribute.resolveSuperclasses(() => undefined, raise)).toThrow('unsupported SetAccess attribute for events section of class InvalidEventAttributeSpec.');
            expect(() => invalidEnumerationAttribute.resolveSuperclasses(() => undefined, raise)).toThrow(
                'unsupported Access attribute for enumeration section of class InvalidEnumerationAttributeSpec.',
            );
        });

        it('Should reject duplicate class and section attributes.', () => {
            const duplicateClassAttribute = ClassDefinition.create(parseClass(['classdef (Hidden, Hidden) DuplicateClassAttributeSpec', 'end'].join('\n')));
            const duplicatePropertyAttribute = ClassDefinition.create(
                parseClass(['classdef DuplicatePropertyAttributeSpec', '  properties (Access = public, Access = private)', '    Value = 1;', '  end', 'end'].join('\n')),
            );
            const duplicateMethodAttribute = ClassDefinition.create(
                parseClass(['classdef DuplicateMethodAttributeSpec', '  methods (Static, Static)', '    function y = value()', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const duplicateEventAttribute = ClassDefinition.create(
                parseClass(['classdef DuplicateEventAttributeSpec', '  events (ListenAccess = public, ListenAccess = private)', '    Changed', '  end', 'end'].join('\n')),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => duplicateClassAttribute.resolveSuperclasses(() => undefined, raise)).toThrow('duplicate Hidden attribute for class DuplicateClassAttributeSpec.');
            expect(() => duplicatePropertyAttribute.resolveSuperclasses(() => undefined, raise)).toThrow(
                'duplicate Access attribute for properties section of class DuplicatePropertyAttributeSpec.',
            );
            expect(() => duplicateMethodAttribute.resolveSuperclasses(() => undefined, raise)).toThrow(
                'duplicate Static attribute for methods section of class DuplicateMethodAttributeSpec.',
            );
            expect(() => duplicateEventAttribute.resolveSuperclasses(() => undefined, raise)).toThrow(
                'duplicate ListenAccess attribute for events section of class DuplicateEventAttributeSpec.',
            );
        });

        it('Should reject non-boolean values for boolean class and section attributes.', () => {
            const invalidClassBoolean = ClassDefinition.create(parseClass(['classdef (Abstract = 1) InvalidClassBooleanSpec', 'end'].join('\n')));
            const invalidPropertyBoolean = ClassDefinition.create(
                parseClass(['classdef InvalidPropertyBooleanSpec', '  properties (Constant = 1)', '    Value = 1;', '  end', 'end'].join('\n')),
            );
            const invalidMethodBoolean = ClassDefinition.create(
                parseClass(['classdef InvalidMethodBooleanSpec', '  methods (Static = 1)', '    function y = value()', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const invalidEventBoolean = ClassDefinition.create(parseClass(['classdef InvalidEventBooleanSpec', '  events (Hidden = 1)', '    Changed', '  end', 'end'].join('\n')));
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => invalidClassBoolean.resolveSuperclasses(() => undefined, raise)).toThrow('invalid boolean Abstract attribute for class InvalidClassBooleanSpec.');
            expect(() => invalidPropertyBoolean.resolveSuperclasses(() => undefined, raise)).toThrow(
                'invalid boolean Constant attribute for properties section of class InvalidPropertyBooleanSpec.',
            );
            expect(() => invalidMethodBoolean.resolveSuperclasses(() => undefined, raise)).toThrow('invalid boolean Static attribute for methods section of class InvalidMethodBooleanSpec.');
            expect(() => invalidEventBoolean.resolveSuperclasses(() => undefined, raise)).toThrow('invalid boolean Hidden attribute for events section of class InvalidEventBooleanSpec.');
        });

        it('Should reject invalid class-name-list attribute values.', () => {
            const invalidInferiorClasses = ClassDefinition.create(parseClass(['classdef (InferiorClasses = 1) InvalidInferiorClassesSpec', 'end'].join('\n')));
            const missingAllowedSubclasses = ClassDefinition.create(parseClass(['classdef (AllowedSubclasses) MissingAllowedSubclassesSpec', 'end'].join('\n')));
            const invalidPartialMatchPriority = ClassDefinition.create(
                parseClass(['classdef InvalidPartialMatchPrioritySpec', '  properties (PartialMatchPriority = 0)', '    Value', '  end', 'end'].join('\n')),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => invalidInferiorClasses.resolveSuperclasses(() => undefined, raise)).toThrow(
                'invalid class-name list InferiorClasses attribute for class InvalidInferiorClassesSpec.',
            );
            expect(() => missingAllowedSubclasses.resolveSuperclasses(() => undefined, raise)).toThrow(
                'invalid class-name list AllowedSubclasses attribute for class MissingAllowedSubclassesSpec.',
            );
            expect(() => invalidPartialMatchPriority.resolveSuperclasses(() => undefined, raise)).toThrow(
                'invalid positive integer PartialMatchPriority attribute for properties section of class InvalidPartialMatchPrioritySpec.',
            );
        });

        it('Should reject invalid access attribute values.', () => {
            const invalidAccess = ClassDefinition.create(
                parseClass(['classdef InvalidAccessSpec', '  methods (Access = 1)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const invalidGetAccess = ClassDefinition.create(parseClass(['classdef InvalidGetAccessSpec', '  properties (GetAccess = friend)', '    Value = 1;', '  end', 'end'].join('\n')));
            const invalidListenAccess = ClassDefinition.create(
                parseClass(['classdef InvalidListenAccessSpec', '  events (ListenAccess = {public, ?FriendSpec})', '    Changed', '  end', 'end'].join('\n')),
            );
            const missingAccessValue = ClassDefinition.create(
                parseClass(['classdef MissingAccessValueSpec', '  methods (Access)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const missingSetAccessValue = ClassDefinition.create(parseClass(['classdef MissingSetAccessValueSpec', '  properties (SetAccess)', '    Value = 1;', '  end', 'end'].join('\n')));
            const missingNotifyAccessValue = ClassDefinition.create(
                parseClass(['classdef MissingNotifyAccessValueSpec', '  events (NotifyAccess)', '    Changed', '  end', 'end'].join('\n')),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => invalidAccess.resolveSuperclasses(() => undefined, raise)).toThrow('invalid Access attribute for methods section of class InvalidAccessSpec.');
            expect(() => invalidGetAccess.resolveSuperclasses(() => undefined, raise)).toThrow('invalid GetAccess attribute for properties section of class InvalidGetAccessSpec.');
            expect(() => invalidListenAccess.resolveSuperclasses(() => undefined, raise)).toThrow('invalid ListenAccess attribute for events section of class InvalidListenAccessSpec.');
            expect(() => missingAccessValue.resolveSuperclasses(() => undefined, raise)).toThrow('invalid Access attribute for methods section of class MissingAccessValueSpec.');
            expect(() => missingSetAccessValue.resolveSuperclasses(() => undefined, raise)).toThrow('invalid SetAccess attribute for properties section of class MissingSetAccessValueSpec.');
            expect(() => missingNotifyAccessValue.resolveSuperclasses(() => undefined, raise)).toThrow(
                'invalid NotifyAccess attribute for events section of class MissingNotifyAccessValueSpec.',
            );
        });

        it('Should reject incompatible class attribute combinations.', () => {
            const abstractSealed = ClassDefinition.create(parseClass(['classdef (Abstract, Sealed) AbstractSealedSpec', 'end'].join('\n')));
            const abstractSealedMethods = ClassDefinition.create(
                parseClass(['classdef AbstractSealedMethodSpec', '  methods (Abstract, Sealed)', '    function y = value(obj)', '    end', '  end', 'end'].join('\n')),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => abstractSealed.resolveSuperclasses(() => undefined, raise)).toThrow('class AbstractSealedSpec cannot be both abstract and sealed.');
            expect(() => abstractSealedMethods.resolveSuperclasses(() => undefined, raise)).toThrow('methods section of class AbstractSealedMethodSpec cannot be both abstract and sealed.');
        });

        it('Should reject incompatible property attribute combinations.', () => {
            const dependentDefault = ClassDefinition.create(parseClass(['classdef DependentDefaultSpec', '  properties (Dependent)', '    Value = 1;', '  end', 'end'].join('\n')));
            const dependentConstant = ClassDefinition.create(parseClass(['classdef DependentConstantSpec', '  properties (Dependent, Constant)', '    Value', '  end', 'end'].join('\n')));
            const constantWithoutDefault = ClassDefinition.create(parseClass(['classdef ConstantWithoutDefaultSpec', '  properties (Constant)', '    Value', '  end', 'end'].join('\n')));
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => dependentDefault.resolveSuperclasses(() => undefined, raise)).toThrow("dependent property 'Value' in class DependentDefaultSpec cannot define a default value.");
            expect(() => dependentConstant.resolveSuperclasses(() => undefined, raise)).toThrow("property 'Value' in class DependentConstantSpec cannot be both dependent and constant.");
            expect(() => constantWithoutDefault.resolveSuperclasses(() => undefined, raise)).toThrow(
                "constant property 'Value' in class ConstantWithoutDefaultSpec must define a default value.",
            );
        });

        it('Should reject abstract method bodies.', () => {
            const abstractBody = ClassDefinition.create(
                parseClass(['classdef AbstractBodySpec', '  methods (Abstract)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => abstractBody.resolveSuperclasses(() => undefined, raise)).toThrow("abstract method 'value' in class AbstractBodySpec cannot define a method body.");
        });

        it('Should reject static and abstract constructors.', () => {
            const staticConstructor = ClassDefinition.create(
                parseClass(['classdef StaticConstructorSpec', '  methods (Static)', '    function obj = StaticConstructorSpec()', '    end', '  end', 'end'].join('\n')),
            );
            const abstractConstructor = ClassDefinition.create(
                parseClass(['classdef AbstractConstructorSpec', '  methods (Abstract)', '    function obj = AbstractConstructorSpec()', '    end', '  end', 'end'].join('\n')),
            );
            const packageStaticConstructor = ClassDefinition.create(
                parseClass(['classdef pkg.StaticConstructorSpec', '  methods (Static)', '    function obj = StaticConstructorSpec()', '    end', '  end', 'end'].join('\n')),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => staticConstructor.resolveSuperclasses(() => undefined, raise)).toThrow('constructor for class StaticConstructorSpec cannot be static.');
            expect(() => abstractConstructor.resolveSuperclasses(() => undefined, raise)).toThrow('constructor for class AbstractConstructorSpec cannot be abstract.');
            expect(() => packageStaticConstructor.resolveSuperclasses(() => undefined, raise)).toThrow('constructor for class pkg.StaticConstructorSpec cannot be static.');
        });

        it('Should reject constructors without exactly one output.', () => {
            const noOutputConstructor = ClassDefinition.create(
                parseClass(['classdef NoOutputConstructorSpec', '  methods', '    function NoOutputConstructorSpec()', '    end', '  end', 'end'].join('\n')),
            );
            const multiOutputConstructor = ClassDefinition.create(
                parseClass(['classdef MultiOutputConstructorSpec', '  methods', '    function [obj, extra] = MultiOutputConstructorSpec()', '    end', '  end', 'end'].join('\n')),
            );
            const ignoredOutputConstructor = ClassDefinition.create(
                parseClass(['classdef IgnoredOutputConstructorSpec', '  methods', '    function ~ = IgnoredOutputConstructorSpec()', '    end', '  end', 'end'].join('\n')),
            );
            const packageNoOutputConstructor = ClassDefinition.create(
                parseClass(['classdef pkg.NoOutputConstructorSpec', '  methods', '    function NoOutputConstructorSpec()', '    end', '  end', 'end'].join('\n')),
            );
            const invalidConstructorHeader = ClassDefinition.create(
                parseClass(['classdef InvalidConstructorHeaderSpec', '  methods', '    function obj = InvalidConstructorHeaderSpec()', '    end', '  end', 'end'].join('\n')),
            );
            invalidConstructorHeader.methods[0].node.return.list.push(AST.nodeReturn());
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => noOutputConstructor.resolveSuperclasses(() => undefined, raise)).toThrow('constructor for class NoOutputConstructorSpec must declare exactly one output.');
            expect(() => multiOutputConstructor.resolveSuperclasses(() => undefined, raise)).toThrow('constructor for class MultiOutputConstructorSpec must declare exactly one output.');
            expect(() => ignoredOutputConstructor.resolveSuperclasses(() => undefined, raise)).toThrow('constructor for class IgnoredOutputConstructorSpec must declare exactly one output.');
            expect(() => packageNoOutputConstructor.resolveSuperclasses(() => undefined, raise)).toThrow(
                'constructor for class pkg.NoOutputConstructorSpec must declare exactly one output.',
            );
            expect(() => invalidConstructorHeader.resolveSuperclasses(() => undefined, raise)).toThrow(
                "internal AST error: method 'InvalidConstructorHeaderSpec' return 2 has invalid node type.",
            );
        });

        it('Should reject invalid property accessor methods.', () => {
            const missingProperty = ClassDefinition.create(
                parseClass(['classdef MissingAccessorPropertySpec', '  methods', '    function y = get.Missing(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const staticGetter = ClassDefinition.create(
                parseClass(
                    [
                        'classdef StaticAccessorSpec',
                        '  properties',
                        '    Value',
                        '  end',
                        '  methods (Static)',
                        '    function y = get.Value(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const badGetterSignature = ClassDefinition.create(
                parseClass(
                    [
                        'classdef BadGetterSignatureSpec',
                        '  properties',
                        '    Value',
                        '  end',
                        '  methods',
                        '    function y = get.Value(obj, extra)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const badSetterSignature = ClassDefinition.create(
                parseClass(['classdef BadSetterSignatureSpec', '  properties', '    Value', '  end', '  methods', '    function obj = set.Value(obj)', '    end', '  end', 'end'].join('\n')),
            );
            const invalidGetterHeader = ClassDefinition.create(
                parseClass(
                    [
                        'classdef InvalidGetterHeaderSpec',
                        '  properties',
                        '    Value',
                        '  end',
                        '  methods',
                        '    function y = get.Value(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            invalidGetterHeader.methods[0].node.parameter.list.push(AST.nodeReturn());
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => missingProperty.resolveSuperclasses(() => undefined, raise)).toThrow(
                "get accessor 'get.Missing' in class MissingAccessorPropertySpec does not match a class property.",
            );
            expect(() => staticGetter.resolveSuperclasses(() => undefined, raise)).toThrow("get accessor 'get.Value' in class StaticAccessorSpec cannot be static.");
            expect(() => badGetterSignature.resolveSuperclasses(() => undefined, raise)).toThrow(
                "get accessor 'get.Value' in class BadGetterSignatureSpec must declare one input and one output.",
            );
            expect(() => badSetterSignature.resolveSuperclasses(() => undefined, raise)).toThrow(
                "set accessor 'set.Value' in class BadSetterSignatureSpec must declare two inputs and one output.",
            );
            expect(() => invalidGetterHeader.resolveSuperclasses(() => undefined, raise)).toThrow("internal AST error: method 'get.Value' parameter 2 has invalid node type.");
        });

        it('Should validate explicit property GetMethod and SetMethod attributes.', () => {
            const explicitAccessors = ClassDefinition.create(
                parseClass(
                    [
                        'classdef ExplicitAccessorSpec',
                        '  properties (GetMethod = readValue, SetMethod = "writeValue")',
                        '    Value',
                        '  end',
                        '  methods',
                        '    function y = readValue(obj)',
                        '      y = 1;',
                        '    end',
                        '    function obj = writeValue(obj, value)',
                        '      obj.Value = value;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const missingGetter = ClassDefinition.create(parseClass(['classdef MissingGetMethodSpec', '  properties (GetMethod = readValue)', '    Value', '  end', 'end'].join('\n')));
            const invalidSetter = ClassDefinition.create(parseClass(['classdef InvalidSetMethodSpec', '  properties (SetMethod = 1)', '    Value', '  end', 'end'].join('\n')));
            const badSetterSignature = ClassDefinition.create(
                parseClass(
                    [
                        'classdef BadSetMethodSignatureSpec',
                        '  properties (SetMethod = writeValue)',
                        '    Value',
                        '  end',
                        '  methods',
                        '    function obj = writeValue(obj)',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(explicitAccessors.properties[0].getMethodName).toBe('readValue');
            expect(explicitAccessors.properties[0].setMethodName).toBe('writeValue');
            expect(() => explicitAccessors.resolveSuperclasses(() => undefined, raise)).not.toThrow();
            expect(() => missingGetter.resolveSuperclasses(() => undefined, raise)).toThrow(
                "GetMethod method 'readValue' for property 'Value' in class MissingGetMethodSpec is not defined.",
            );
            expect(() => invalidSetter.resolveSuperclasses(() => undefined, raise)).toThrow("invalid SetMethod attribute for property 'Value' in class InvalidSetMethodSpec.");
            expect(() => badSetterSignature.resolveSuperclasses(() => undefined, raise)).toThrow(
                "SetMethod method 'writeValue' for property 'Value' in class BadSetMethodSignatureSpec must declare two inputs and one output.",
            );
        });

        it('Should reject duplicate direct class members.', () => {
            const duplicateProperty = ClassDefinition.create(parseClass(['classdef DuplicatePropertySpec', '  properties', '    Value = 1;', '    Value = 2;', '  end', 'end'].join('\n')));
            const duplicateMethod = ClassDefinition.create(
                parseClass(
                    [
                        'classdef DuplicateMethodSpec',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 1;',
                        '    end',
                        '    function y = value(obj)',
                        '      y = 2;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const duplicateEvent = ClassDefinition.create(parseClass(['classdef DuplicateEventSpec', '  events', '    Changed', '    Changed', '  end', 'end'].join('\n')));
            const duplicateEnumeration = ClassDefinition.create(parseClass(['classdef DuplicateEnumerationSpec', '  enumeration', '    One', '    One', '  end', 'end'].join('\n')));
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => duplicateProperty.resolveSuperclasses(() => undefined, raise)).toThrow("duplicate property 'Value' in class DuplicatePropertySpec.");
            expect(() => duplicateMethod.resolveSuperclasses(() => undefined, raise)).toThrow("duplicate method 'value' in class DuplicateMethodSpec.");
            expect(() => duplicateEvent.resolveSuperclasses(() => undefined, raise)).toThrow("duplicate event 'Changed' in class DuplicateEventSpec.");
            expect(() => duplicateEnumeration.resolveSuperclasses(() => undefined, raise)).toThrow("duplicate enumeration member 'One' in class DuplicateEnumerationSpec.");
        });

        it('Should reject cross-kind direct class member name conflicts.', () => {
            const propertyMethodConflict = ClassDefinition.create(
                parseClass(
                    [
                        'classdef PropertyMethodConflictSpec',
                        '  properties',
                        '    Value = 1;',
                        '  end',
                        '  methods',
                        '    function y = Value(obj)',
                        '      y = 2;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const propertyEventConflict = ClassDefinition.create(
                parseClass(['classdef PropertyEventConflictSpec', '  properties', '    Changed', '  end', '  events', '    Changed', '  end', 'end'].join('\n')),
            );
            const propertyEnumerationConflict = ClassDefinition.create(
                parseClass(['classdef PropertyEnumerationConflictSpec', '  properties', '    One = 1;', '  end', '  enumeration', '    One', '  end', 'end'].join('\n')),
            );
            const accessorAllowed = ClassDefinition.create(
                parseClass(
                    [
                        'classdef AccessorConflictExceptionSpec',
                        '  properties',
                        '    Value = 1;',
                        '  end',
                        '  methods',
                        '    function y = get.Value(obj)',
                        '      y = obj.Value;',
                        '    end',
                        '    function obj = set.Value(obj, value)',
                        '      obj.Value = value;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => propertyMethodConflict.resolveSuperclasses(() => undefined, raise)).toThrow("class PropertyMethodConflictSpec has conflicting property and method named 'Value'.");
            expect(() => propertyEventConflict.resolveSuperclasses(() => undefined, raise)).toThrow("class PropertyEventConflictSpec has conflicting property and event named 'Changed'.");
            expect(() => propertyEnumerationConflict.resolveSuperclasses(() => undefined, raise)).toThrow(
                "class PropertyEnumerationConflictSpec has conflicting property and enumeration member named 'One'.",
            );
            expect(() => accessorAllowed.resolveSuperclasses(() => undefined, raise)).not.toThrow();
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

        it('Should deduplicate effective inherited member lists by superclass precedence.', () => {
            const left = ClassDefinition.create(
                parseClass(
                    [
                        'classdef LeftDuplicateSpec',
                        '  properties',
                        '    Value = 1;',
                        '  end',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        '  events',
                        '    Changed',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const right = ClassDefinition.create(
                parseClass(
                    [
                        'classdef RightDuplicateSpec',
                        '  properties',
                        '    Value = 2;',
                        '  end',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 2;',
                        '    end',
                        '  end',
                        '  events',
                        '    Changed',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const child = ClassDefinition.create(parseClass(['classdef DuplicateChildSpec < LeftDuplicateSpec & RightDuplicateSpec', 'end'].join('\n')));

            child.resolveSuperclasses(
                (name) => ({ LeftDuplicateSpec: left, RightDuplicateSpec: right })[name],
                (message) => {
                    throw new Error(message);
                },
            );

            expect(child.findProperty('Value')?.classDefinition).toBe(left);
            expect(child.findMethod('value')?.classDefinition).toBe(left);
            expect(child.findEvent('Changed')?.classDefinition).toBe(left);
            expect(child.allProperties().filter((property) => property.name === 'Value')).toHaveLength(1);
            expect(child.allMethods().filter((method) => method.name === 'value')).toHaveLength(1);
            expect(child.allEvents().filter((event) => event.name === 'Changed')).toHaveLength(1);
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

        it('Should enforce direct AllowedSubclasses inheritance restrictions.', () => {
            const base = ClassDefinition.create(parseClass(['classdef (AllowedSubclasses = {?AllowedSubclassSpec}) RestrictedBaseSpec', 'end'].join('\n')));
            const allowed = ClassDefinition.create(parseClass(['classdef AllowedSubclassSpec < RestrictedBaseSpec', 'end'].join('\n')));
            const illegal = ClassDefinition.create(parseClass(['classdef IllegalSubclassSpec < RestrictedBaseSpec', 'end'].join('\n')));
            const resolve = (name: string) => (name === 'RestrictedBaseSpec' ? base : undefined);
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => allowed.resolveSuperclasses(resolve, raise)).not.toThrow();
            expect(allowed.findSuperclass('RestrictedBaseSpec')).toBe(base);
            expect(() => illegal.resolveSuperclasses(resolve, raise)).toThrow(
                'class IllegalSubclassSpec cannot inherit from class RestrictedBaseSpec: subclass is not listed in AllowedSubclasses.',
            );
        });

        it('Should reject circular inheritance chains.', () => {
            const self = ClassDefinition.create(parseClass(['classdef SelfInheritanceSpec < SelfInheritanceSpec', 'end'].join('\n')));
            const first = ClassDefinition.create(parseClass(['classdef CircularFirstSpec < CircularSecondSpec', 'end'].join('\n')));
            const second = ClassDefinition.create(parseClass(['classdef CircularSecondSpec < CircularFirstSpec', 'end'].join('\n')));
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => self.resolveSuperclasses((name) => (name === 'SelfInheritanceSpec' ? self : undefined), raise)).toThrow('class SelfInheritanceSpec cannot inherit from itself.');

            expect(() => second.resolveSuperclasses((name) => (name === 'CircularFirstSpec' ? first : undefined), raise)).toThrow(
                'circular class inheritance detected: CircularSecondSpec -> CircularFirstSpec -> CircularSecondSpec.',
            );
        });

        it('Should reject overrides of inherited sealed methods.', () => {
            const base = ClassDefinition.create(
                parseClass(
                    [
                        'classdef SealedMethodBaseSpec',
                        '  methods (Sealed)',
                        '    function y = value(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        '  methods (Static, Sealed)',
                        '    function y = make()',
                        '      y = 2;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const leftBase = ClassDefinition.create(
                parseClass(['classdef LeftNonsealedMethodBaseSpec', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            );
            const rightBase = ClassDefinition.create(
                parseClass(['classdef RightSealedMethodBaseSpec', '  methods (Sealed)', '    function y = value(obj)', '      y = 2;', '    end', '  end', 'end'].join('\n')),
            );
            const instanceOverride = ClassDefinition.create(
                parseClass(['classdef IllegalInstanceOverrideSpec < SealedMethodBaseSpec', '  methods', '    function y = value(obj)', '      y = 3;', '    end', '  end', 'end'].join('\n')),
            );
            const staticOverride = ClassDefinition.create(
                parseClass(
                    ['classdef IllegalStaticOverrideSpec < SealedMethodBaseSpec', '  methods (Static)', '    function y = make()', '      y = 4;', '    end', '  end', 'end'].join('\n'),
                ),
            );
            const laterSealedOverride = ClassDefinition.create(
                parseClass(
                    [
                        'classdef IllegalLaterSealedOverrideSpec < LeftNonsealedMethodBaseSpec & RightSealedMethodBaseSpec',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 3;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            );
            const resolve = (name: string) => ({ SealedMethodBaseSpec: base, LeftNonsealedMethodBaseSpec: leftBase, RightSealedMethodBaseSpec: rightBase })[name];
            const raise = (message: string): never => {
                throw new Error(message);
            };

            expect(() => instanceOverride.resolveSuperclasses(resolve, raise)).toThrow(
                "method 'value' in class IllegalInstanceOverrideSpec cannot override sealed method from class SealedMethodBaseSpec.",
            );
            expect(() => staticOverride.resolveSuperclasses(resolve, raise)).toThrow(
                "method 'make' in class IllegalStaticOverrideSpec cannot override sealed method from class SealedMethodBaseSpec.",
            );
            expect(() => laterSealedOverride.resolveSuperclasses(resolve, raise)).toThrow(
                "method 'value' in class IllegalLaterSealedOverrideSpec cannot override sealed method from class RightSealedMethodBaseSpec.",
            );
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

        it('Should treat MATLAB SetGet mixins as built-in handle superclasses.', () => {
            const setGet = ClassDefinition.create(parseClass(['classdef SetGetSpec < matlab.mixin.SetGet', 'end'].join('\n')));
            const exactNames = ClassDefinition.create(parseClass(['classdef ExactSetGetSpec < matlab.mixin.SetGetExactNames', 'end'].join('\n')));
            const raise = (message: string): never => {
                throw new Error(message);
            };

            setGet.resolveSuperclasses(() => undefined, raise);
            exactNames.resolveSuperclasses(() => undefined, raise);

            expect(setGet.isHandleClass()).toBe(true);
            expect(setGet.isSetGetClass()).toBe(true);
            expect(setGet.isSetGetExactNamesClass()).toBe(false);
            expect(exactNames.isHandleClass()).toBe(true);
            expect(exactNames.isSetGetClass()).toBe(true);
            expect(exactNames.isSetGetExactNamesClass()).toBe(true);
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

        it('Should track inherited abstract properties until concrete properties implement them.', () => {
            const base = ClassDefinition.create(parseClass(['classdef AbstractPropertyBaseSpec', '  properties (Abstract)', '    Value', '  end', 'end'].join('\n')));
            const pending = ClassDefinition.create(parseClass(['classdef PendingPropertyChildSpec < AbstractPropertyBaseSpec', 'end'].join('\n')));
            const implemented = ClassDefinition.create(
                parseClass(['classdef ImplementedPropertyChildSpec < AbstractPropertyBaseSpec', '  properties', '    Value = 1;', '  end', 'end'].join('\n')),
            );

            const resolve = (name: string) => (name === 'AbstractPropertyBaseSpec' ? base : undefined);
            const raise = (message: string): never => {
                throw new Error(message);
            };
            pending.resolveSuperclasses(resolve, raise);
            implemented.resolveSuperclasses(resolve, raise);

            expect(base.properties[0].isAbstract).toBe(true);
            expect(pending.unresolvedAbstractProperties().map((property) => property.name)).toEqual(['Value']);
            expect(pending.isEffectivelyAbstract()).toBe(true);
            expect(implemented.unresolvedAbstractProperties()).toEqual([]);
            expect(implemented.isEffectivelyAbstract()).toBe(false);
        });
    });
});
