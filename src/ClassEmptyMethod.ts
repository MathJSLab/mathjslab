import type { ClassDefinition } from './ClassDefinition';
import type { RuntimeDisplay } from './RuntimeDisplay';

/**
 * Runtime value for the built-in `ClassName.empty` static method.
 */
class ClassEmptyMethod {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_EMPTY_METHOD = 14;
    /** Runtime type tag stored on the empty-method wrapper. */
    public readonly type = ClassEmptyMethod.CLASS_EMPTY_METHOD;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent?: unknown;
    /** Class that owns the `empty` method. */
    public readonly classDefinition: ClassDefinition;

    /**
     * Test whether a value is a built-in class empty-method wrapper.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassEmptyMethod`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassEmptyMethod => obj instanceof ClassEmptyMethod;

    /**
     * Create an empty-method wrapper for a class.
     *
     * @param classDefinition Owning class metadata.
     */
    constructor(classDefinition: ClassDefinition) {
        this.classDefinition = classDefinition;
    }

    /**
     * Bind the built-in `empty` method to a class.
     *
     * @param classDefinition Owning class metadata.
     * @returns Empty-method wrapper.
     */
    public static readonly bind = (classDefinition: ClassDefinition): ClassEmptyMethod => new ClassEmptyMethod(classDefinition);

    /**
     * Copy an empty-method wrapper.
     *
     * @param emptyMethod Wrapper to copy.
     * @returns New empty-method wrapper.
     */
    public static readonly copy = (emptyMethod: ClassEmptyMethod): ClassEmptyMethod => new ClassEmptyMethod(emptyMethod.classDefinition);

    /**
     * Render a compact empty-method summary.
     *
     * @param emptyMethod Wrapper to render.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Human-readable method summary.
     */
    public static readonly unparse = (emptyMethod: ClassEmptyMethod, _interpreter: RuntimeDisplay): string => `${emptyMethod.classDefinition.name}.empty static method`;

    /**
     * Copy this empty-method wrapper.
     *
     * @returns New empty-method wrapper.
     */
    public copy(): ClassEmptyMethod {
        return ClassEmptyMethod.copy(this);
    }
}

export { ClassEmptyMethod };
export default { ClassEmptyMethod };
