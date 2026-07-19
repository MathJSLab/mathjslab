import type { ClassMethodDefinition } from './ClassMember';
import type { ClassDefinition } from './ClassDefinition';
import type { RuntimeDisplay } from './RuntimeDisplay';

/**
 * Runtime value representing a static class method selected from a class.
 */
class ClassStaticMethod {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_STATIC_METHOD = 9;
    /** Runtime type tag stored on the static method wrapper. */
    public readonly type = ClassStaticMethod.CLASS_STATIC_METHOD;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent?: unknown;
    /** Class that owns the static method. */
    public readonly classDefinition: ClassDefinition;
    /** Static method metadata. */
    public readonly method: ClassMethodDefinition;

    /**
     * Test whether a value is a static class method wrapper.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassStaticMethod`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassStaticMethod => obj instanceof ClassStaticMethod;

    /**
     * Create a static method wrapper.
     *
     * @param classDefinition Owning class metadata.
     * @param method Static method metadata.
     */
    constructor(classDefinition: ClassDefinition, method: ClassMethodDefinition) {
        this.classDefinition = classDefinition;
        this.method = method;
    }

    /**
     * Bind a static method to its owning class.
     *
     * @param classDefinition Owning class metadata.
     * @param method Static method metadata.
     * @returns Static method wrapper.
     */
    public static readonly bind = (classDefinition: ClassDefinition, method: ClassMethodDefinition): ClassStaticMethod => new ClassStaticMethod(classDefinition, method);

    /**
     * Copy a static method wrapper.
     *
     * @param staticMethod Static method wrapper to copy.
     * @returns New static method wrapper.
     */
    public static readonly copy = (staticMethod: ClassStaticMethod): ClassStaticMethod => new ClassStaticMethod(staticMethod.classDefinition, staticMethod.method);

    /**
     * Render a compact static method summary.
     *
     * @param staticMethod Static method wrapper to render.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Human-readable method summary.
     */
    public static readonly unparse = (staticMethod: ClassStaticMethod, _interpreter: RuntimeDisplay): string => {
        return `${staticMethod.classDefinition.name}.${staticMethod.method.name} static method`;
    };

    /**
     * Copy this static method wrapper.
     *
     * @returns New static method wrapper.
     */
    public copy(): ClassStaticMethod {
        return ClassStaticMethod.copy(this);
    }
}

export { ClassStaticMethod };
export default { ClassStaticMethod };
