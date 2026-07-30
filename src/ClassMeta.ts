import type {
    ClassEnumerationDefinition as ClassEnumerationDefinitionBase,
    ClassEventDefinition as ClassEventDefinitionBase,
    ClassMethodDefinition as ClassMethodDefinitionBase,
    ClassPropertyDefinition as ClassPropertyDefinitionBase,
} from './ClassMember';
import { ClassDefinition } from './ClassDefinition';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { AST, type ClassAttributeTable, type NodeArgumentValidation, type NodeFunctionParameter, type NodeFunctionReturn, type NodeInput, type RuntimeExpressionValue } from './AST';
import type { RuntimeDisplay } from './RuntimeDisplay';

type ClassPropertyDefinition = ClassPropertyDefinitionBase<ClassDefinition>;
type ClassMethodDefinition = ClassMethodDefinitionBase<ClassDefinition>;
type ClassEventDefinition = ClassEventDefinitionBase<ClassDefinition>;
type ClassEnumerationDefinition = ClassEnumerationDefinitionBase<ClassDefinition>;
/** Member metadata variants that can be exposed as MATLAB-like meta objects. */
type ClassMetaMemberDefinition = ClassPropertyDefinition | ClassMethodDefinition | ClassEventDefinition | ClassEnumerationDefinition;
/** Supported meta-object kind names. */
type ClassMetaKind = 'meta.class' | 'meta.property' | 'meta.method' | 'meta.event' | 'meta.EnumerationMember';
/** Runtime values exposed by public MATLAB-like `meta.*` properties. */
type ClassMetaPropertyValue = RuntimeExpressionValue;
/**
 * Callback used by runtime-created meta objects to evaluate property defaults
 * lazily.
 */
type ClassPropertyDefaultProvider = (property: ClassPropertyDefinition) => RuntimeExpressionValue | undefined;
type ValidationMetadata = Pick<NodeArgumentValidation, 'name' | 'size' | 'class' | 'functions'> & {
    default?: ClassMetaPropertyValue | null;
    defaultValue?: ClassMetaPropertyValue | null;
};

/**
 * Convert strings to a column cell array of `CharString` values.
 *
 * @param values Strings to wrap.
 * @returns Cell column vector.
 */
const stringArray = (values: string[]): MultiArray => {
    const result = MultiArray.toColumnVector(values.map((value) => CharString.create(value)));
    result.isCell = true;
    return result;
};

/**
 * Convert meta objects to a column array.
 *
 * @param values Meta objects to wrap.
 * @returns Column vector of meta objects.
 */
const metaArray = (values: ClassMetaObject[]): MultiArray => {
    return MultiArray.toColumnVector(values);
};

/**
 * Convert a boolean to a logical complex scalar.
 *
 * @param value Boolean value.
 * @returns Logical scalar.
 */
const bool = (value: boolean): ReturnType<typeof Complex.true> => (value ? Complex.true() : Complex.false());

/**
 * Create an empty runtime string.
 *
 * @returns Empty `CharString`.
 */
const emptyString = (): CharString => CharString.create('');

/**
 * Return sorted attribute names as a cell column vector.
 *
 * @param table Attribute table.
 * @returns Cell column vector of attribute names.
 */
const attributeNames = (table: ClassAttributeTable): MultiArray => stringArray(Object.keys(table).sort());

/**
 * Extract a display name from identifier-like AST nodes.
 *
 * @param node AST node to inspect.
 * @returns Identifier or dotted name, if recognized.
 */
const nodeName = (node: unknown): string | undefined => {
    if (AST.isNodeIdentifier(node)) {
        return node.id;
    }
    if (AST.isNodeIndirectRef(node)) {
        return `${nodeName(node.obj)}.${String(node.field[0])}`;
    }
    return undefined;
};

/**
 * Convert a supported AST expression into compact display text for metadata.
 *
 * @param node AST node to render.
 * @returns Textual representation.
 */
const expressionText = (node: unknown): string => {
    if (AST.isNodeList(node)) {
        return node.list.map((item) => expressionText(item)).join(',');
    }
    if (!AST.isStrictNodeExpr(node)) {
        return '';
    }
    const name = nodeName(node);
    if (name) {
        return name;
    }
    if (CharString.isInstanceOf(node)) {
        return node.str;
    }
    if (Complex.isInstanceOf(node)) {
        return node.toString();
    }
    if (AST.isNodeIndexExpr(node)) {
        return `${expressionText(node.expr)}(${node.args.map((item) => expressionText(item)).join(',')})`;
    }
    return '';
};

/**
 * Convert an unevaluated metadata default into a runtime value.
 *
 * Parser-created meta objects do not have an evaluator available. In that case,
 * expose a textual representation rather than leaking AST nodes through the
 * public `meta.property.DefaultValue` surface.
 *
 * @param value Parsed default expression.
 * @returns Runtime value suitable for meta-object properties.
 */
const defaultExpressionValue = (value: NodeInput): RuntimeExpressionValue => (AST.isRuntimeExpressionValue(value) ? value : CharString.create(expressionText(value)));

/**
 * Convert one argument validation declaration to a structure.
 *
 * @param validation Validation declaration.
 * @returns Metadata structure.
 */
const validationStruct = (validation: ValidationMetadata): Structure => {
    const defaultValue = validation.default ?? validation.defaultValue ?? null;
    return new Structure({
        Name: CharString.create(nodeName(validation.name) ?? ''),
        Size: stringArray(validation.size.map((item) => expressionText(item))),
        Class: validation.class ? CharString.create(expressionText(validation.class)) : emptyString(),
        Validators: stringArray(validation.functions.map((item) => expressionText(item))),
        HasDefault: bool(Boolean(defaultValue)),
        DefaultValue: defaultValue ?? MultiArray.emptyArray(),
    });
};

/**
 * Convert argument validation declarations to a cell column vector.
 *
 * @param validations Validation declarations.
 * @returns Cell column vector of validation metadata structures.
 */
const validationList = (validations: ValidationMetadata[]): MultiArray => {
    const result = MultiArray.toColumnVector(validations.map((validation) => validationStruct(validation)));
    result.isCell = true;
    return result;
};

/**
 * Select validation declarations from a method arguments block by attribute.
 *
 * @param method Method metadata.
 * @param attribute Block attribute to select, or `null` for input blocks.
 * @returns Matching validation declarations.
 */
const functionArgumentValidations = (method: ClassMethodDefinition, attribute: string | null): NodeArgumentValidation[] =>
    method.node.arguments.list.flatMap((block) => ((block.attribute?.id ?? null) === attribute ? block.validation : []));

/**
 * Extract declared parameter names from a function header list.
 *
 * @param nodes Parameter nodes to inspect.
 * @returns Parameter names in source order, excluding ignored targets.
 */
const parameterNames = (nodes: NodeFunctionParameter[]): string[] =>
    nodes.flatMap((node) => (AST.isNodeIdentifier(node) ? [node.id] : AST.isNodeDefaultedParameter(node) ? [node.left.id] : []));

/**
 * Extract declared return names from a function header list.
 *
 * @param nodes Return nodes to inspect.
 * @returns Return names in source order, excluding ignored targets.
 */
const returnNames = (nodes: NodeFunctionReturn[]): string[] => nodes.flatMap((node) => (AST.isNodeIdentifier(node) ? [node.id] : []));

/**
 * Base class for MATLAB-like class meta objects.
 */
abstract class ClassMetaObject {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_META = 7;
    /** Runtime type tag stored on all meta objects. */
    public readonly type = ClassMetaObject.CLASS_META;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent?: unknown;
    /** MATLAB-like meta object kind. */
    public abstract readonly kind: ClassMetaKind;

    /**
     * Test whether a value is a class meta object.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassMetaObject`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassMetaObject => obj instanceof ClassMetaObject;

    /**
     * Copy a meta object.
     *
     * Meta objects are immutable views, so copying preserves identity.
     *
     * @param meta Meta object to copy.
     * @returns The same meta object.
     */
    public static readonly copy = <T extends ClassMetaObject>(meta: T): T => meta;

    /**
     * Copy this meta object.
     *
     * @returns This meta object.
     */
    public copy(): this {
        return ClassMetaObject.copy(this);
    }

    /**
     * Read a MATLAB-like public meta property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public abstract getProperty(field: string): ClassMetaPropertyValue | undefined;

    /**
     * Return the display name used by unparse and diagnostics.
     *
     * @returns Display name.
     */
    public abstract displayName(): string;

    /**
     * Render a compact meta-object summary.
     *
     * @param meta Meta object to render.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Human-readable meta-object summary.
     */
    public static readonly unparse = (meta: ClassMetaObject, _interpreter: RuntimeDisplay): string => `${meta.kind} ${meta.displayName()}`;
}

/**
 * Meta object representing a class definition.
 */
class ClassMetaClass extends ClassMetaObject {
    /** MATLAB-like meta object kind. */
    public readonly kind = 'meta.class';

    /**
     * Create a class meta object.
     *
     * @param definition Class metadata.
     * @param propertyDefaultProvider Optional callback used to expose evaluated
     * property defaults from runtime-created meta objects.
     */
    private constructor(
        public readonly definition: ClassDefinition,
        private readonly propertyDefaultProvider?: ClassPropertyDefaultProvider,
    ) {
        super();
    }

    /**
     * Test whether a value is a class meta object.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassMetaClass`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassMetaClass => obj instanceof ClassMetaClass;

    /**
     * Create a class meta object.
     *
     * @param definition Class metadata.
     * @param propertyDefaultProvider Optional callback used to expose evaluated
     * property defaults from runtime-created meta objects.
     * @returns Class meta object.
     */
    public static readonly create = (definition: ClassDefinition, propertyDefaultProvider?: ClassPropertyDefaultProvider): ClassMetaClass =>
        new ClassMetaClass(definition, propertyDefaultProvider);

    /**
     * Return the class name.
     *
     * @returns Class name.
     */
    public displayName(): string {
        return this.definition.name;
    }

    /**
     * Read a supported `meta.class` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): ClassMetaPropertyValue | undefined {
        switch (field) {
            case 'Name':
                return CharString.create(this.definition.name);
            case 'Description':
            case 'DetailedDescription':
                return emptyString();
            case 'SuperclassList':
                return metaArray(this.definition.superclassDefinitions.map((definition) => ClassMetaClass.create(definition, this.propertyDefaultProvider)));
            case 'SuperClasses':
                return stringArray(this.definition.superclasses);
            case 'PropertyList':
                return metaArray(this.definition.allProperties().map((property) => ClassMetaProperty.create(property, this.propertyDefaultProvider)));
            case 'MethodList':
                return metaArray(this.definition.allMethods().map((method) => ClassMetaMethod.create(method, this.propertyDefaultProvider)));
            case 'EventList':
                return metaArray(this.definition.allEvents().map((event) => ClassMetaEvent.create(event, this.propertyDefaultProvider)));
            case 'EnumerationMemberList':
                return metaArray(this.definition.allEnumerations().map((enumeration) => ClassMetaEnumerationMember.create(enumeration, this.propertyDefaultProvider)));
            case 'Abstract':
                return bool(this.definition.isEffectivelyAbstract());
            case 'Sealed':
                return bool(this.definition.isSealed);
            case 'Hidden':
                return bool(this.definition.isHidden);
            case 'ConstructOnLoad':
                return bool(this.definition.isConstructOnLoad);
            case 'HandleCompatible':
                return bool(this.definition.isHandleClass() || this.definition.isHandleCompatible);
            case 'InferiorClasses':
                return stringArray(this.definition.inferiorClasses);
            case 'AllowedSubclasses':
                return stringArray(this.definition.allowedSubclasses);
            case 'ContainingPackage':
                return CharString.create(this.definition.packageName);
            case 'RestrictsSubclassing':
                return bool(this.definition.isRestrictsSubclassing);
            case 'AttributeNames':
                return attributeNames(this.definition.attributes);
            default:
                return undefined;
        }
    }
}

/**
 * Base class for meta objects that wrap class members.
 */
abstract class ClassMetaMember extends ClassMetaObject {
    /**
     * Create a member meta object.
     *
     * @param member Member metadata.
     * @param propertyDefaultProvider Optional callback propagated back through
     * `DefiningClass`.
     */
    protected constructor(
        public readonly member: ClassMetaMemberDefinition,
        private readonly propertyDefaultProvider?: ClassPropertyDefaultProvider,
    ) {
        super();
    }

    /**
     * Return a qualified member display name.
     *
     * @returns Qualified member name.
     */
    public displayName(): string {
        return `${this.member.classDefinition.name}.${this.member.name}`;
    }

    /**
     * Read fields shared by property, method, event, and enumeration meta
     * objects.
     *
     * @param field Property name.
     * @returns Property value, if supported by all member meta objects.
     */
    protected commonProperty(field: string): ClassMetaPropertyValue | undefined {
        switch (field) {
            case 'Name':
                return CharString.create(this.member.name);
            case 'DefiningClass':
                return ClassMetaClass.create(this.member.classDefinition, this.propertyDefaultProvider);
            case 'Hidden':
                return bool('isHidden' in this.member && this.member.isHidden);
            case 'Description':
            case 'DetailedDescription':
                return emptyString();
            case 'AttributeNames':
                return attributeNames(this.member.attributes);
            default:
                return undefined;
        }
    }
}

/**
 * Meta object representing a class property.
 */
class ClassMetaProperty extends ClassMetaMember {
    /** MATLAB-like meta object kind. */
    public readonly kind = 'meta.property';

    /**
     * Create a property meta object.
     *
     * @param property Property metadata.
     * @param defaultProvider Optional callback used to evaluate the property's
     * default expression lazily.
     */
    private constructor(
        public readonly property: ClassPropertyDefinition,
        private readonly defaultProvider?: ClassPropertyDefaultProvider,
    ) {
        super(property, defaultProvider);
    }

    /**
     * Create a property meta object.
     *
     * @param property Property metadata.
     * @param defaultProvider Optional callback used to evaluate the property's
     * default expression lazily.
     * @returns Property meta object.
     */
    public static readonly create = (property: ClassPropertyDefinition, defaultProvider?: ClassPropertyDefaultProvider): ClassMetaProperty =>
        new ClassMetaProperty(property, defaultProvider);

    /**
     * Return the default value exposed through metadata.
     *
     * Runtime-created meta objects evaluate defaults lazily; parser-created
     * meta objects without a provider expose compact expression text.
     *
     * @returns Evaluated/default expression value, or `null` when absent.
     */
    private defaultValue(): ClassMetaPropertyValue | null {
        if (!this.property.defaultValue) {
            return null;
        }
        return this.defaultProvider?.(this.property) ?? defaultExpressionValue(this.property.defaultValue);
    }

    /**
     * Read a supported `meta.property` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): ClassMetaPropertyValue | undefined {
        const common = this.commonProperty(field);
        if (typeof common !== 'undefined') {
            return common;
        }
        switch (field) {
            case 'GetAccess':
                return CharString.create(this.property.getAccess);
            case 'SetAccess':
                return CharString.create(this.property.setAccess);
            case 'Access':
                return CharString.create(this.property.access);
            case 'Constant':
                return bool(this.property.isConstant);
            case 'Dependent':
                return bool(this.property.isDependent);
            case 'Abstract':
                return bool(this.property.isAbstract);
            case 'Transient':
                return bool(this.property.isTransient);
            case 'GetObservable':
                return bool(this.property.isGetObservable);
            case 'SetObservable':
                return bool(this.property.isSetObservable);
            case 'AbortSet':
                return bool(this.property.isAbortSet);
            case 'HasDefault':
                return bool(Boolean(this.property.defaultValue));
            case 'DefaultValue':
                return this.defaultValue() ?? MultiArray.emptyArray();
            case 'Validation':
                return validationList(
                    this.property.size.length > 0 || this.property.class || this.property.functions.length > 0 || this.property.defaultValue
                        ? [
                              {
                                  name: this.property.node.name,
                                  size: this.property.size,
                                  class: this.property.class,
                                  functions: this.property.functions,
                                  defaultValue: this.defaultValue(),
                              },
                          ]
                        : [],
                );
            case 'GetMethod':
                return this.property.getMethodName ? CharString.create(this.property.getMethodName) : MultiArray.emptyArray();
            case 'SetMethod':
                return this.property.setMethodName ? CharString.create(this.property.setMethodName) : MultiArray.emptyArray();
            case 'NonCopyable':
                return bool(this.property.isNonCopyable);
            case 'PartialMatchPriority':
                return Complex.create(this.property.partialMatchPriority);
            default:
                return undefined;
        }
    }
}

/**
 * Meta object representing a class method.
 */
class ClassMetaMethod extends ClassMetaMember {
    /** MATLAB-like meta object kind. */
    public readonly kind = 'meta.method';

    /**
     * Create a method meta object.
     *
     * @param method Method metadata.
     * @param propertyDefaultProvider Optional callback propagated through
     * `DefiningClass`.
     */
    private constructor(
        public readonly method: ClassMethodDefinition,
        propertyDefaultProvider?: ClassPropertyDefaultProvider,
    ) {
        super(method, propertyDefaultProvider);
    }

    /**
     * Create a method meta object.
     *
     * @param method Method metadata.
     * @param propertyDefaultProvider Optional callback propagated through
     * `DefiningClass`.
     * @returns Method meta object.
     */
    public static readonly create = (method: ClassMethodDefinition, propertyDefaultProvider?: ClassPropertyDefaultProvider): ClassMetaMethod =>
        new ClassMetaMethod(method, propertyDefaultProvider);

    /**
     * Read a supported `meta.method` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): ClassMetaPropertyValue | undefined {
        const common = this.commonProperty(field);
        if (typeof common !== 'undefined') {
            return common;
        }
        switch (field) {
            case 'Access':
                return CharString.create(this.method.access);
            case 'Static':
                return bool(this.method.isStatic);
            case 'Abstract':
                return bool(this.method.isAbstract);
            case 'Sealed':
                return bool(this.method.isSealed);
            case 'InputNames':
                return stringArray(parameterNames(this.method.node.parameter.list));
            case 'OutputNames':
                return stringArray(returnNames(this.method.node.return.list));
            case 'InputValidation':
                return validationList(functionArgumentValidations(this.method, null));
            case 'OutputValidation':
                return validationList(functionArgumentValidations(this.method, 'Output'));
            case 'RepeatingInputValidation':
                return validationList(functionArgumentValidations(this.method, 'Repeating'));
            default:
                return undefined;
        }
    }
}

/**
 * Meta object representing a class event.
 */
class ClassMetaEvent extends ClassMetaMember {
    /** MATLAB-like meta object kind. */
    public readonly kind = 'meta.event';

    /**
     * Create an event meta object.
     *
     * @param event Event metadata.
     * @param propertyDefaultProvider Optional callback propagated through
     * `DefiningClass`.
     */
    private constructor(
        public readonly event: ClassEventDefinition,
        propertyDefaultProvider?: ClassPropertyDefaultProvider,
    ) {
        super(event, propertyDefaultProvider);
    }

    /**
     * Create an event meta object.
     *
     * @param event Event metadata.
     * @param propertyDefaultProvider Optional callback propagated through
     * `DefiningClass`.
     * @returns Event meta object.
     */
    public static readonly create = (event: ClassEventDefinition, propertyDefaultProvider?: ClassPropertyDefaultProvider): ClassMetaEvent =>
        new ClassMetaEvent(event, propertyDefaultProvider);

    /**
     * Read a supported `meta.event` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): ClassMetaPropertyValue | undefined {
        const common = this.commonProperty(field);
        if (typeof common !== 'undefined') {
            return common;
        }
        switch (field) {
            case 'ListenAccess':
                return CharString.create(this.event.listenAccess);
            case 'NotifyAccess':
                return CharString.create(this.event.notifyAccess);
            case 'Access':
                return CharString.create(this.event.access);
            default:
                return undefined;
        }
    }
}

/**
 * Meta object representing an enumeration member.
 */
class ClassMetaEnumerationMember extends ClassMetaMember {
    /** MATLAB-like meta object kind. */
    public readonly kind = 'meta.EnumerationMember';

    /**
     * Create an enumeration-member meta object.
     *
     * @param enumeration Enumeration metadata.
     * @param propertyDefaultProvider Optional callback propagated through
     * `DefiningClass`.
     */
    private constructor(
        public readonly enumeration: ClassEnumerationDefinition,
        propertyDefaultProvider?: ClassPropertyDefaultProvider,
    ) {
        super(enumeration, propertyDefaultProvider);
    }

    /**
     * Create an enumeration-member meta object.
     *
     * @param enumeration Enumeration metadata.
     * @param propertyDefaultProvider Optional callback propagated through
     * `DefiningClass`.
     * @returns Enumeration-member meta object.
     */
    public static readonly create = (enumeration: ClassEnumerationDefinition, propertyDefaultProvider?: ClassPropertyDefaultProvider): ClassMetaEnumerationMember =>
        new ClassMetaEnumerationMember(enumeration, propertyDefaultProvider);

    /**
     * Read a supported `meta.EnumerationMember` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): ClassMetaPropertyValue | undefined {
        const common = this.commonProperty(field);
        if (typeof common !== 'undefined') {
            return common;
        }
        switch (field) {
            case 'ConstructorArguments':
                return this.enumeration.args.length === 0 ? MultiArray.emptyArray() : stringArray(this.enumeration.args.map((arg) => expressionText(arg)));
            default:
                return undefined;
        }
    }
}

export { ClassMetaObject, ClassMetaClass, ClassMetaMember, ClassMetaProperty, ClassMetaMethod, ClassMetaEvent, ClassMetaEnumerationMember };
export type { ClassMetaKind, ClassMetaPropertyValue };
export default { ClassMetaObject, ClassMetaClass, ClassMetaMember, ClassMetaProperty, ClassMetaMethod, ClassMetaEvent, ClassMetaEnumerationMember };
