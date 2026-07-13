import type { ClassEnumerationDefinition, ClassEventDefinition, ClassMethodDefinition, ClassPropertyDefinition } from './ClassMember';
import { ClassDefinition } from './ClassDefinition';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import type { ClassAttributeTable, NodeArgumentValidation, NodeExpr, NodeIdentifier, NodeInput } from './AST';
import type { Interpreter } from './Interpreter';

/** Member metadata variants that can be exposed as MATLAB-like meta objects. */
type ClassMetaMemberDefinition = ClassPropertyDefinition | ClassMethodDefinition | ClassEventDefinition | ClassEnumerationDefinition;
/** Supported meta-object kind names. */
type ClassMetaKind = 'meta.class' | 'meta.property' | 'meta.method' | 'meta.event' | 'meta.EnumerationMember';

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
const nodeName = (node: NodeInput): string | undefined => {
    if ((node as NodeIdentifier).type === 'IDENT') {
        return (node as NodeIdentifier).id;
    }
    if (node.type === '.') {
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
const expressionText = (node: NodeInput): string => {
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
    if (node.type === 'LIST') {
        return node.list.map((item: NodeInput) => expressionText(item)).join(',');
    }
    if (node.type === 'IDX') {
        return `${expressionText(node.expr)}(${node.args.map((item: NodeExpr) => expressionText(item)).join(',')})`;
    }
    return '';
};

/**
 * Extract argument validation names into a cell column vector.
 *
 * @param validations Validation declarations.
 * @returns Cell column vector of validation names.
 */
const argumentValidationNames = (validations: NodeArgumentValidation[]): MultiArray =>
    stringArray(validations.map((validation) => nodeName(validation.name)).filter((name): name is string => Boolean(name)));

/**
 * Convert one argument validation declaration to a structure.
 *
 * @param validation Validation declaration.
 * @returns Metadata structure.
 */
const validationStruct = (validation: NodeArgumentValidation): Structure =>
    new Structure({
        Name: CharString.create(nodeName(validation.name) ?? ''),
        Size: stringArray(validation.size.map((item) => expressionText(item as NodeExpr))),
        Class: validation.class ? CharString.create(expressionText(validation.class as NodeExpr)) : emptyString(),
        Validators: stringArray(validation.functions.map((item) => expressionText(item as NodeExpr))),
        HasDefault: bool(Boolean(validation.default)),
        DefaultValue: validation.default ?? MultiArray.emptyArray(),
    });

/**
 * Convert argument validation declarations to a cell column vector.
 *
 * @param validations Validation declarations.
 * @returns Cell column vector of validation metadata structures.
 */
const validationList = (validations: NodeArgumentValidation[]): MultiArray => {
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
 * Extract identifier names from a list of AST nodes.
 *
 * @param nodes AST nodes to inspect.
 * @returns Identifier names in source order.
 */
const identifierNames = (nodes: NodeInput[]): string[] => nodes.filter((node): node is NodeIdentifier => node.type === 'IDENT').map((node) => node.id);

/**
 * Base class for MATLAB-like class meta objects.
 */
abstract class ClassMetaObject {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_META = 7;
    /** Runtime type tag stored on all meta objects. */
    public readonly type = ClassMetaObject.CLASS_META;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent: any;
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
    public abstract getProperty(field: string): NodeInput | undefined;

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
    public static readonly unparse = (meta: ClassMetaObject, _interpreter: Interpreter): string => `${meta.kind} ${meta.displayName()}`;
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
     */
    private constructor(public readonly definition: ClassDefinition) {
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
     * @returns Class meta object.
     */
    public static readonly create = (definition: ClassDefinition): ClassMetaClass => new ClassMetaClass(definition);

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
    public getProperty(field: string): NodeInput | undefined {
        switch (field) {
            case 'Name':
                return CharString.create(this.definition.name);
            case 'Description':
            case 'DetailedDescription':
                return emptyString();
            case 'SuperclassList':
                return metaArray(this.definition.superclassDefinitions.map((definition) => ClassMetaClass.create(definition)));
            case 'SuperClasses':
                return stringArray(this.definition.superclasses);
            case 'PropertyList':
                return metaArray(this.definition.allProperties().map((property) => ClassMetaProperty.create(property)));
            case 'MethodList':
                return metaArray(this.definition.allMethods().map((method) => ClassMetaMethod.create(method)));
            case 'EventList':
                return metaArray(this.definition.allEvents().map((event) => ClassMetaEvent.create(event)));
            case 'EnumerationMemberList':
                return metaArray(this.definition.allEnumerations().map((enumeration) => ClassMetaEnumerationMember.create(enumeration)));
            case 'Abstract':
                return bool(this.definition.isEffectivelyAbstract());
            case 'Sealed':
                return bool(this.definition.isSealed);
            case 'ConstructOnLoad':
                return bool(false);
            case 'HandleCompatible':
                return bool(this.definition.isHandleClass());
            case 'InferiorClasses':
                return stringArray([]);
            case 'ContainingPackage':
                return emptyString();
            case 'RestrictsSubclassing':
                return bool(this.definition.isSealed);
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
     */
    protected constructor(public readonly member: ClassMetaMemberDefinition) {
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
    protected commonProperty(field: string): NodeInput | undefined {
        switch (field) {
            case 'Name':
                return CharString.create(this.member.name);
            case 'DefiningClass':
                return ClassMetaClass.create(this.member.classDefinition);
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
     */
    private constructor(public readonly property: ClassPropertyDefinition) {
        super(property);
    }

    /**
     * Create a property meta object.
     *
     * @param property Property metadata.
     * @returns Property meta object.
     */
    public static readonly create = (property: ClassPropertyDefinition): ClassMetaProperty => new ClassMetaProperty(property);

    /**
     * Read a supported `meta.property` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): NodeInput | undefined {
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
                return this.property.defaultValue ?? MultiArray.emptyArray();
            case 'Validation':
                return validationList([]);
            case 'GetMethod':
            case 'SetMethod':
                return MultiArray.emptyArray();
            case 'NonCopyable':
                return bool(false);
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
     */
    private constructor(public readonly method: ClassMethodDefinition) {
        super(method);
    }

    /**
     * Create a method meta object.
     *
     * @param method Method metadata.
     * @returns Method meta object.
     */
    public static readonly create = (method: ClassMethodDefinition): ClassMetaMethod => new ClassMetaMethod(method);

    /**
     * Read a supported `meta.method` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): NodeInput | undefined {
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
                return stringArray(identifierNames(this.method.node.parameter.list));
            case 'OutputNames':
                return stringArray(identifierNames(this.method.node.return.list));
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
     */
    private constructor(public readonly event: ClassEventDefinition) {
        super(event);
    }

    /**
     * Create an event meta object.
     *
     * @param event Event metadata.
     * @returns Event meta object.
     */
    public static readonly create = (event: ClassEventDefinition): ClassMetaEvent => new ClassMetaEvent(event);

    /**
     * Read a supported `meta.event` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): NodeInput | undefined {
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
     */
    private constructor(public readonly enumeration: ClassEnumerationDefinition) {
        super(enumeration);
    }

    /**
     * Create an enumeration-member meta object.
     *
     * @param enumeration Enumeration metadata.
     * @returns Enumeration-member meta object.
     */
    public static readonly create = (enumeration: ClassEnumerationDefinition): ClassMetaEnumerationMember => new ClassMetaEnumerationMember(enumeration);

    /**
     * Read a supported `meta.EnumerationMember` property.
     *
     * @param field Property name.
     * @returns Property value, if supported.
     */
    public getProperty(field: string): NodeInput | undefined {
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
export type { ClassMetaKind };
export default { ClassMetaObject, ClassMetaClass, ClassMetaMember, ClassMetaProperty, ClassMetaMethod, ClassMetaEvent, ClassMetaEnumerationMember };
