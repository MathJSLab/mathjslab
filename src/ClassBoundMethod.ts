import type { ClassMethodDefinition } from './ClassMember';
import type { ClassInstance } from './ClassInstance';
import type { Interpreter } from './Interpreter';

/**
 * Runtime value representing an instance method already bound to an object.
 */
class ClassBoundMethod {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_BOUND_METHOD = 8;
    /** Runtime type tag stored on the bound method. */
    public readonly type = ClassBoundMethod.CLASS_BOUND_METHOD;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent: any;
    /** Object instance that will be supplied as the receiver. */
    public readonly instance: ClassInstance;
    /** Method metadata selected from the receiver class. */
    public readonly method: ClassMethodDefinition;

    /**
     * Test whether a value is a bound class method.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassBoundMethod`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassBoundMethod => obj instanceof ClassBoundMethod;

    /**
     * Create a bound method value.
     *
     * @param instance Receiver instance.
     * @param method Method metadata.
     */
    constructor(instance: ClassInstance, method: ClassMethodDefinition) {
        this.instance = instance;
        this.method = method;
    }

    /**
     * Bind a method to a receiver instance.
     *
     * @param instance Receiver instance.
     * @param method Method metadata.
     * @returns Bound method value.
     */
    public static readonly bind = (instance: ClassInstance, method: ClassMethodDefinition): ClassBoundMethod => new ClassBoundMethod(instance, method);

    /**
     * Copy a bound method value.
     *
     * @param boundMethod Bound method to copy.
     * @returns New bound method wrapper.
     */
    public static readonly copy = (boundMethod: ClassBoundMethod): ClassBoundMethod => new ClassBoundMethod(boundMethod.instance, boundMethod.method);

    /**
     * Render a compact method summary.
     *
     * @param boundMethod Bound method to render.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Human-readable method summary.
     */
    public static readonly unparse = (boundMethod: ClassBoundMethod, _interpreter: Interpreter): string => {
        return `${boundMethod.instance.classDefinition.name}.${boundMethod.method.name} method`;
    };

    /**
     * Copy this bound method value.
     *
     * @returns New bound method wrapper.
     */
    public copy(): ClassBoundMethod {
        return ClassBoundMethod.copy(this);
    }
}

export { ClassBoundMethod };
export default { ClassBoundMethod };
