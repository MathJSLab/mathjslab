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
} from './AST';
import { CharString } from './CharString';
import type { ClassDefinition } from './ClassDefinition';

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
    /** Whether the property was declared with `Constant`. */
    isConstant: boolean;
    /** Whether the property was declared with `Dependent`. */
    isDependent: boolean;
    /** Whether the property was declared with `Hidden`. */
    isHidden: boolean;
    /** Whether the property was declared with `Transient`. */
    isTransient: boolean;
    /** Whether reads should raise observable get events. */
    isGetObservable: boolean;
    /** Whether writes should raise observable set events. */
    isSetObservable: boolean;
    /** Whether repeated equal assignments may be skipped. */
    isAbortSet: boolean;
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
     * Test whether an attribute table contains at least one entry with a name.
     *
     * @param table Attribute table produced by the AST layer.
     * @param name Attribute name to test.
     * @returns `true` when the attribute exists.
     */
    public static readonly hasAttribute = (table: ClassAttributeTable, name: string): boolean => typeof table[name] !== 'undefined' && table[name].length > 0;

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
        return null;
    };

    /**
     * Resolve an access-like attribute with a fallback value.
     *
     * @param table Attribute table to inspect.
     * @param name Attribute name, usually `Access`, `GetAccess`, or
     * `SetAccess`.
     * @param fallback Value used when the attribute is absent or valueless.
     * @returns Effective access specifier.
     */
    public static readonly accessFromAttributes = (table: ClassAttributeTable, name = 'Access', fallback = this.defaultAccess): ClassAccess =>
        this.attributeValue(table[name]?.[0]) ?? fallback;
}

export type { ClassAccess, ClassPropertyDefinition, ClassMethodDefinition, ClassEventDefinition, ClassEnumerationDefinition };
export { ClassMember };
export default { ClassMember };
