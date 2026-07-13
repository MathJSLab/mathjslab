import type { NodeInput } from './AST';
import type { ClassDefinition } from './ClassDefinition';
import type { FunctionHandle } from './FunctionHandle';
import type { Interpreter } from './Interpreter';
import { ClassEventListener } from './ClassEventListener';
import { MultiArray } from './MultiArray';

/** Instance property storage keyed by property name. */
type ClassInstancePropertyTable = Record<string, NodeInput>;
/** Callback used to evaluate property default expressions at construction time. */
type ClassPropertyDefaultEvaluator = (expression: NodeInput) => NodeInput;

/**
 * Runtime value representing one MATLAB/Octave class object instance.
 *
 * Value classes are copied when passed to methods, while handle classes keep
 * identity and can be marked as deleted.
 */
class ClassInstance {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_INSTANCE = 7;
    /** Runtime type tag stored on the instance. */
    public readonly type = ClassInstance.CLASS_INSTANCE;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent: any;
    /** Class metadata that defines this instance. */
    public readonly classDefinition: ClassDefinition;
    /** Concrete non-dependent property values. */
    public readonly properties: ClassInstancePropertyTable;
    /** Event listeners grouped by event name. */
    public readonly listeners: Record<string, ClassEventListener[]> = {};
    /** Whether a handle instance has been deleted. */
    public deleted = false;

    /**
     * Test whether a value is a runtime class instance.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassInstance`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassInstance => obj instanceof ClassInstance;

    /**
     * Create an instance with precomputed property storage.
     *
     * @param classDefinition Runtime class metadata.
     * @param properties Initial property table.
     */
    constructor(classDefinition: ClassDefinition, properties: ClassInstancePropertyTable = {}) {
        this.classDefinition = classDefinition;
        this.properties = properties;
    }

    /**
     * Instantiate a class by evaluating defaults for all non-dependent
     * effective properties.
     *
     * @param classDefinition Class metadata to instantiate.
     * @param evaluateDefault Callback used to evaluate default expressions.
     * @returns New runtime instance.
     */
    public static readonly instantiate = (classDefinition: ClassDefinition, evaluateDefault: ClassPropertyDefaultEvaluator): ClassInstance => {
        const properties: ClassInstancePropertyTable = {};
        for (const property of classDefinition.allProperties()) {
            if (property.isDependent) {
                continue;
            }
            properties[property.name] = property.defaultValue ? evaluateDefault(property.defaultValue) : MultiArray.emptyArray();
        }
        return new ClassInstance(classDefinition, properties);
    };

    /**
     * Throw when an instance has been deleted.
     *
     * @param instance Instance to validate.
     */
    public static readonly throwIfDeleted = (instance: ClassInstance): void => {
        if (instance.deleted) {
            throw new Error(`invalid or deleted object for class ${instance.classDefinition.name}.`);
        }
    };

    /**
     * Delete a handle instance.
     *
     * Value class instances are left unchanged, matching their copy semantics.
     *
     * @param instance Instance to delete.
     */
    public static readonly delete = (instance: ClassInstance): void => {
        if (instance.classDefinition.isHandleClass()) {
            instance.deleted = true;
        }
    };

    /**
     * Test whether a handle instance is still valid.
     *
     * @param instance Instance to test.
     * @returns `true` for live handle objects.
     */
    public static readonly isValid = (instance: ClassInstance): boolean => instance.classDefinition.isHandleClass() && !instance.deleted;

    /**
     * Read a concrete stored property.
     *
     * @param instance Source instance.
     * @param name Property name.
     * @returns Stored property value, if present.
     */
    public static readonly getProperty = (instance: ClassInstance, name: string): NodeInput | undefined => {
        ClassInstance.throwIfDeleted(instance);
        return instance.properties[name];
    };

    /**
     * Test whether a concrete stored property exists.
     *
     * @param instance Instance to inspect.
     * @param name Property name.
     * @returns `true` when the property has storage.
     */
    public static readonly hasProperty = (instance: ClassInstance, name: string): boolean => Object.prototype.hasOwnProperty.call(instance.properties, name);

    /**
     * Write a concrete stored property.
     *
     * @param instance Target instance.
     * @param name Property name.
     * @param value Value to store.
     */
    public static readonly setProperty = (instance: ClassInstance, name: string, value: NodeInput): void => {
        ClassInstance.throwIfDeleted(instance);
        if (!ClassInstance.hasProperty(instance, name)) {
            throw new Error(`unknown property '${name}' for class ${instance.classDefinition.name}.`);
        }
        instance.properties[name] = value;
    };

    /**
     * Register an event listener on this instance.
     *
     * @param instance Source instance.
     * @param eventName Event name.
     * @param callback Listener callback function handle.
     * @returns Created listener object.
     */
    public static readonly addListener = (instance: ClassInstance, eventName: string, callback: FunctionHandle): ClassEventListener => {
        ClassInstance.throwIfDeleted(instance);
        const listener = ClassEventListener.create(instance, eventName, callback);
        instance.listeners[eventName] ??= [];
        instance.listeners[eventName].push(listener);
        return listener;
    };

    /**
     * Return enabled, non-deleted listeners for an event.
     *
     * @param instance Source instance.
     * @param eventName Event name.
     * @returns Snapshot of active listener objects.
     */
    public static readonly listenersFor = (instance: ClassInstance, eventName: string): ClassEventListener[] => {
        ClassInstance.throwIfDeleted(instance);
        return instance.listeners[eventName]?.filter((listener) => ClassEventListener.isValid(listener) && listener.enabled).slice() ?? [];
    };

    /**
     * Copy an instance according to value/handle semantics.
     *
     * @param instance Instance to copy.
     * @returns The same handle instance or a copied value instance.
     */
    public static readonly copy = (instance: ClassInstance): ClassInstance => {
        ClassInstance.throwIfDeleted(instance);
        if (instance.classDefinition.isHandleClass()) {
            return instance;
        }
        const properties: ClassInstancePropertyTable = {};
        for (const [name, value] of Object.entries(instance.properties)) {
            properties[name] = typeof (value as { copy?: () => NodeInput }).copy === 'function' ? (value as { copy: () => NodeInput }).copy() : value;
        }
        return new ClassInstance(instance.classDefinition, properties);
    };

    /**
     * Prepare an instance for use as an object method argument.
     *
     * @param instance Instance being passed to a method.
     * @returns Original handle object or copied value object.
     */
    public static readonly methodArgument = (instance: ClassInstance): ClassInstance => {
        ClassInstance.throwIfDeleted(instance);
        return instance.classDefinition.isHandleClass() ? instance : ClassInstance.copy(instance);
    };

    /**
     * Render a compact textual summary of an instance.
     *
     * @param instance Instance to render.
     * @param interpreter Interpreter requesting unparse.
     * @returns Human-readable object summary.
     */
    public static readonly unparse = (instance: ClassInstance, interpreter: Interpreter): string => {
        const propertyNames = Object.keys(instance.properties);
        return `${instance.classDefinition.name} object${propertyNames.length > 0 ? ` with properties: ${propertyNames.join(',')}` : ''}`;
    };

    /**
     * Copy this instance according to value/handle semantics.
     *
     * @returns Copied or original instance.
     */
    public copy(): ClassInstance {
        return ClassInstance.copy(this);
    }
}

export type { ClassInstancePropertyTable, ClassPropertyDefaultEvaluator };
export { ClassInstance };
export default { ClassInstance };
