import type { NodeInput } from './AST';
import type { ClassEnumerationDefinition } from './ClassMember';
import type { ClassDefinition } from './ClassDefinition';
import type { RuntimeDisplay } from './RuntimeDisplay';

/**
 * Runtime value representing one member of a MATLAB/Octave enumeration class.
 */
class ClassEnumerationValue {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_ENUMERATION_VALUE = 10;
    /** Runtime type tag stored on the enumeration value. */
    public readonly type = ClassEnumerationValue.CLASS_ENUMERATION_VALUE;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent?: unknown;
    /** Class that owns the enumeration member. */
    public readonly classDefinition: ClassDefinition;
    /** Enumeration member metadata. */
    public readonly enumeration: ClassEnumerationDefinition;
    /** Constructor-like arguments attached to the enumeration member. */
    public readonly args: NodeInput[];

    /**
     * Test whether a value is a class enumeration value.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassEnumerationValue`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassEnumerationValue => obj instanceof ClassEnumerationValue;

    /**
     * Create an enumeration value.
     *
     * @param classDefinition Owning class metadata.
     * @param enumeration Enumeration member metadata.
     * @param args Constructor-like argument values.
     */
    constructor(classDefinition: ClassDefinition, enumeration: ClassEnumerationDefinition, args: NodeInput[] = []) {
        this.classDefinition = classDefinition;
        this.enumeration = enumeration;
        this.args = args;
    }

    /**
     * Create an enumeration value.
     *
     * @param classDefinition Owning class metadata.
     * @param enumeration Enumeration member metadata.
     * @param args Constructor-like argument values.
     * @returns Runtime enumeration value.
     */
    public static readonly create = (classDefinition: ClassDefinition, enumeration: ClassEnumerationDefinition, args: NodeInput[] = []): ClassEnumerationValue =>
        new ClassEnumerationValue(classDefinition, enumeration, args);

    /**
     * Copy an enumeration value.
     *
     * @param value Value to copy.
     * @returns New enumeration value wrapper.
     */
    public static readonly copy = (value: ClassEnumerationValue): ClassEnumerationValue => new ClassEnumerationValue(value.classDefinition, value.enumeration, value.args.slice());

    /**
     * Render the enumeration member name.
     *
     * @param value Enumeration value to render.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Fully qualified enumeration member name.
     */
    public static readonly unparse = (value: ClassEnumerationValue, _interpreter: RuntimeDisplay): string => `${value.classDefinition.name}.${value.enumeration.name}`;

    /**
     * Copy this enumeration value.
     *
     * @returns New enumeration value wrapper.
     */
    public copy(): ClassEnumerationValue {
        return ClassEnumerationValue.copy(this);
    }
}

export { ClassEnumerationValue };
export default { ClassEnumerationValue };
