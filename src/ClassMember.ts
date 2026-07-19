import type {
    ClassAttributeTable,
    NodeClassAttribute,
    NodeClassEnumeration,
    NodeClassEvent,
    NodeClassProperty,
    NodeClassSection,
    NodeExpr,
    NodeFunctionDefinition,
    NodeIdentifier,
    NodeInput,
    NodeMetaClass,
    NodeOperation,
} from './AST';
import { CharString } from './CharString';
import type { ClassDefinition } from './ClassDefinition';
import { MultiArray } from './MultiArray';

/**
 * Access specifier stored in class member metadata.
 *
 * MATLAB accepts named levels such as `public`, `protected`, `private`, and
 * class-qualified access lists. The runtime stores the parsed value as text and
 * lets the interpreter decide which forms it can enforce.
 */
type ClassAccess = string;

/**
 * Runtime metadata for a property declared in a `properties` block.
 */
interface ClassPropertyDefinition {
    /** Property name as declared in the classdef block. */
    name: string;
    /** AST node that originated the property declaration. */
    node: NodeClassProperty;
    /** Default value expression, when one was declared. */
    defaultValue: NodeExpr | null;
    /** Literal/symbolic size declaration from the property validation syntax. */
    size: NodeInput[];
    /** Class declaration from the property validation syntax. */
    class: NodeInput | null;
    /** Validator function declarations from the property validation syntax. */
    functions: NodeInput[];
    /** Containing `properties` section. */
    section: NodeClassSection;
    /** Duplicate-preserving attribute table inherited from the section. */
    attributes: ClassAttributeTable;
    /** Effective read/write access when no specific accessor rule is present. */
    access: ClassAccess;
    /** Effective getter access. */
    getAccess: ClassAccess;
    /** Effective setter access. */
    setAccess: ClassAccess;
    /** Explicit getter method declared with the `GetMethod` attribute. */
    getMethodName: string | null;
    /** Explicit setter method declared with the `SetMethod` attribute. */
    setMethodName: string | null;
    /** Whether the property was declared with `Constant`. */
    isConstant: boolean;
    /** Whether the property was declared with `Dependent`. */
    isDependent: boolean;
    /** Whether the property was declared with `Abstract`. */
    isAbstract: boolean;
    /** Whether the property was declared with `Hidden`. */
    isHidden: boolean;
    /** Whether the property was declared with `Transient`. */
    isTransient: boolean;
    /** Whether the property was declared with `NonCopyable`. */
    isNonCopyable: boolean;
    /** Whether reads should raise observable get events. */
    isGetObservable: boolean;
    /** Whether writes should raise observable set events. */
    isSetObservable: boolean;
    /** Whether repeated equal assignments may be skipped. */
    isAbortSet: boolean;
    /** Relative priority for partial property-name matching. */
    partialMatchPriority: number;
    /** Class that owns the property metadata. */
    classDefinition: ClassDefinition;
}

/**
 * Runtime metadata for a method declared in a `methods` block.
 */
interface ClassMethodDefinition {
    /** Method name, including qualified names preserved by the parser. */
    name: string;
    /** Function-definition AST node for the method body or prototype. */
    node: NodeFunctionDefinition;
    /** Containing `methods` section. */
    section: NodeClassSection;
    /** Duplicate-preserving attribute table inherited from the section. */
    attributes: ClassAttributeTable;
    /** Effective method access. */
    access: ClassAccess;
    /** Whether the method was declared in a `Static` section. */
    isStatic: boolean;
    /** Whether the method is abstract or prototype-only. */
    isAbstract: boolean;
    /** Whether subclasses may override this method. */
    isSealed: boolean;
    /** Whether the method was declared with `Hidden`. */
    isHidden: boolean;
    /** Class that owns the method metadata. */
    classDefinition: ClassDefinition;
}

/**
 * Runtime metadata for an event declared in an `events` block.
 */
interface ClassEventDefinition {
    /** Event name as declared in the classdef block. */
    name: string;
    /** AST node that originated the event declaration. */
    node: NodeClassEvent;
    /** Containing `events` section. */
    section: NodeClassSection;
    /** Duplicate-preserving attribute table inherited from the section. */
    attributes: ClassAttributeTable;
    /** Effective event access. */
    access: ClassAccess;
    /** Effective listener registration access. */
    listenAccess: ClassAccess;
    /** Effective event notification access. */
    notifyAccess: ClassAccess;
    /** Whether the event was declared with `Hidden`. */
    isHidden: boolean;
    /** Class that owns the event metadata. */
    classDefinition: ClassDefinition;
}

/**
 * Runtime metadata for an enumeration member declared in an `enumeration` block.
 */
interface ClassEnumerationDefinition {
    /** Enumeration member name. */
    name: string;
    /** AST node that originated the enumeration member. */
    node: NodeClassEnumeration;
    /** Constructor-like arguments attached to the enumeration member. */
    args: NodeExpr[];
    /** Containing `enumeration` section. */
    section: NodeClassSection;
    /** Duplicate-preserving attribute table inherited from the section. */
    attributes: ClassAttributeTable;
    /** Whether the enumeration member was declared in a `Hidden` section. */
    isHidden: boolean;
    /** Class that owns the enumeration metadata. */
    classDefinition: ClassDefinition;
}

/**
 * Shared helpers for interpreting `classdef` member attributes.
 */
class ClassMember {
    /** Default MATLAB/Octave member access when no attribute overrides it. */
    public static readonly defaultAccess = 'public';

    /**
     * Test whether a parsed attribute value is a metaclass literal.
     *
     * @param value Value to test.
     * @returns `true` when the value is a `?ClassName` AST node.
     */
    private static readonly isMetaClassNode = (value: unknown): value is NodeMetaClass => typeof value === 'object' && value !== null && (value as NodeMetaClass).type === 'METACLASS';

    /**
     * Test whether a parsed attribute value is a negated attribute marker.
     *
     * @param value Value to test.
     * @returns `true` for parser nodes produced by `~Attribute` or `!Attribute`.
     */
    private static readonly isNegatedAttributeNode = (value: unknown): value is NodeOperation =>
        typeof value === 'object' && value !== null && ((value as NodeOperation).type === '~' || (value as NodeOperation).type === '!');

    /**
     * Convert a class-name-like AST value to a class name.
     *
     * @param value Value to convert.
     * @returns Class name, if recognized.
     */
    private static readonly classNameValue = (value: unknown): string | null => {
        if ((value as NodeIdentifier)?.type === 'IDENT') {
            return (value as NodeIdentifier).id;
        }
        if (CharString.isInstanceOf(value)) {
            return value.str;
        }
        if (this.isMetaClassNode(value)) {
            return value.className.id;
        }
        return null;
    };

    /**
     * Test whether an attribute table contains at least one entry with a name.
     *
     * @param table Attribute table produced by the AST layer.
     * @param name Attribute name to test.
     * @returns `true` when the effective attribute value is true.
     */
    public static readonly hasAttribute = (table: ClassAttributeTable, name: string): boolean => this.attributeBooleanValue(table[name]?.[0]) === true;

    /**
     * Resolve an attribute as a boolean marker when possible.
     *
     * @param attribute Attribute node to read.
     * @returns Effective boolean value, or `null` when the attribute is absent
     * or has a non-boolean value.
     */
    public static readonly attributeBooleanValue = (attribute: NodeClassAttribute | undefined): boolean | null => {
        if (!attribute) {
            return null;
        }
        if (!attribute.value) {
            return true;
        }
        const value = attribute.value;
        if (this.isNegatedAttributeNode(value)) {
            return false;
        }
        if ((value as NodeIdentifier).type === 'IDENT') {
            const id = (value as NodeIdentifier).id;
            if (id === 'true') {
                return true;
            }
            if (id === 'false') {
                return false;
            }
        }
        return null;
    };

    /**
     * Test whether an effective access string is supported by the runtime.
     *
     * @param access Access value to test.
     * @returns `true` for named access levels or class-qualified friend lists.
     */
    public static readonly isSupportedAccess = (access: string): boolean => {
        if (access === 'public' || access === 'protected' || access === 'private') {
            return true;
        }
        const friendPattern = /^\?[A-Za-z]\w*(?:\.[A-Za-z]\w*)*$/;
        if (friendPattern.test(access)) {
            return true;
        }
        if (access.startsWith('{') && access.endsWith('}')) {
            const values = access.slice(1, -1).split(',');
            return values.length > 0 && values.every((value) => friendPattern.test(value));
        }
        return false;
    };

    /**
     * Convert a class attribute value node into the textual value used by the
     * runtime metadata layer.
     *
     * @param attribute Attribute node to read.
     * @returns Identifier/string value, or `null` for marker attributes.
     */
    public static readonly attributeValue = (attribute: NodeClassAttribute | undefined): string | null => {
        if (!attribute || !attribute.value) {
            return null;
        }
        const value = attribute.value;
        if ((value as NodeIdentifier).type === 'IDENT') {
            return (value as NodeIdentifier).id;
        }
        if (CharString.isInstanceOf(value)) {
            return value.toString();
        }
        if (this.isMetaClassNode(value)) {
            return `?${value.className.id}`;
        }
        if (MultiArray.isInstanceOf(value) && value.isCell) {
            const values = MultiArray.linearize(value);
            const accessList = values.map((item) => {
                const candidate: unknown = item;
                if (this.isMetaClassNode(candidate)) {
                    return `?${candidate.className.id}`;
                }
                return null;
            });
            if (accessList.every((item): item is string => typeof item === 'string')) {
                return `{${accessList.join(',')}}`;
            }
        }
        return null;
    };

    /**
     * Resolve an attribute value as a class-name list.
     *
     * MATLAB-like class attributes such as `InferiorClasses` and
     * `AllowedSubclasses` accept class names or cell arrays of class-name-like
     * entries. The runtime stores those names as strings.
     *
     * @param attribute Attribute node to read.
     * @returns Class names, or `null` when the attribute is absent or invalid.
     */
    public static readonly classNameListFromAttribute = (attribute: NodeClassAttribute | undefined): string[] | null => {
        if (!attribute || !attribute.value) {
            return null;
        }
        const single = this.classNameValue(attribute.value);
        if (single) {
            return [single];
        }
        if (MultiArray.isInstanceOf(attribute.value) && attribute.value.isCell) {
            const names = MultiArray.linearize(attribute.value).map((item) => this.classNameValue(item));
            if (names.every((item): item is string => Boolean(item))) {
                return names;
            }
        }
        return null;
    };

    /**
     * Resolve an attribute value as a positive integer.
     *
     * MATLAB property metadata uses this shape for `PartialMatchPriority`.
     *
     * @param attribute Attribute node to read.
     * @returns Positive integer value, or `null` when absent or invalid.
     */
    public static readonly positiveIntegerFromAttribute = (attribute: NodeClassAttribute | undefined): number | null => {
        const value = attribute?.value as { re?: unknown; im?: unknown } | undefined;
        if (!value || typeof value.re === 'undefined' || typeof value.im === 'undefined' || Number(value.im) !== 0) {
            return null;
        }
        const numericValue = Number(value.re);
        return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
    };

    /**
     * Resolve an access-like attribute with a fallback value.
     *
     * @param table Attribute table to inspect.
     * @param name Attribute name, usually `Access`, `GetAccess`, or
     * `SetAccess`.
     * @param fallback Value used when the attribute is absent.
     * @returns Effective access specifier.
     */
    public static readonly accessFromAttributes = (table: ClassAttributeTable, name = 'Access', fallback = this.defaultAccess): ClassAccess =>
        this.attributeValue(table[name]?.[0]) ?? fallback;

    /**
     * Resolve a property accessor method attribute.
     *
     * @param table Attribute table to inspect.
     * @param name Attribute name, usually `GetMethod` or `SetMethod`.
     * @returns Method name, or `null` when the attribute is absent or invalid.
     */
    public static readonly methodNameFromAttribute = (table: ClassAttributeTable, name: 'GetMethod' | 'SetMethod'): string | null => {
        const value = this.attributeValue(table[name]?.[0]);
        return value && /^[A-Za-z]\w*(?:\.[A-Za-z]\w*)*$/.test(value) ? value : null;
    };

    /**
     * Validate a parsed access-like attribute before class registration.
     *
     * @param table Attribute table to inspect.
     * @param name Attribute name to validate.
     * @param owner Description used in error messages.
     * @param throwEvalError Interpreter error callback.
     */
    public static readonly validateAccessAttribute = (table: ClassAttributeTable, name: string, owner: string, throwEvalError: (message: string) => never): void => {
        const attribute = table[name]?.[0];
        if (!attribute) {
            return;
        }
        const value = this.attributeValue(attribute);
        if (!value || !this.isSupportedAccess(value)) {
            throwEvalError(`invalid ${name} attribute for ${owner}.`);
        }
    };
}

export type { ClassAccess, ClassPropertyDefinition, ClassMethodDefinition, ClassEventDefinition, ClassEnumerationDefinition };
export { ClassMember };
export default { ClassMember };
