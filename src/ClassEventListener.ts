import type { FunctionHandle } from './FunctionHandle';
import type { RuntimeDisplay } from './RuntimeDisplay';

/**
 * Minimal source-object contract stored by event listeners.
 *
 * The concrete runtime object is a `ClassInstance`, but listeners only need the
 * defining class name for display and the original object identity for callback
 * dispatch. Keeping this structural avoids a module cycle with `ClassInstance`.
 */
type ClassEventSource = {
    classDefinition: {
        name: string;
    };
};

/**
 * Runtime listener object returned by event subscription APIs.
 */
class ClassEventListener {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_EVENT_LISTENER = 11;
    /** Runtime type tag stored on listener objects. */
    public readonly type = ClassEventListener.CLASS_EVENT_LISTENER;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent?: unknown;
    /** Source object that owns the event. */
    public readonly source: ClassEventSource;
    /** Event name observed by this listener. */
    public readonly eventName: string;
    /** Function handle called when the event is raised. */
    public readonly callback: FunctionHandle;
    /** Whether the listener is currently enabled. */
    public enabled = true;
    /** Whether the listener has been deleted. */
    public deleted = false;

    /**
     * Test whether a value is an event listener.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassEventListener`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassEventListener => obj instanceof ClassEventListener;

    /**
     * Create an event listener.
     *
     * @param source Source object.
     * @param eventName Event name.
     * @param callback Callback function handle.
     */
    constructor(source: ClassEventSource, eventName: string, callback: FunctionHandle) {
        this.source = source;
        this.eventName = eventName;
        this.callback = callback;
    }

    /**
     * Create an event listener.
     *
     * @param source Source object.
     * @param eventName Event name.
     * @param callback Callback function handle.
     * @returns Runtime listener object.
     */
    public static readonly create = (source: ClassEventSource, eventName: string, callback: FunctionHandle): ClassEventListener => new ClassEventListener(source, eventName, callback);

    /**
     * Test whether a listener has not been deleted.
     *
     * @param listener Listener to test.
     * @returns `true` when the listener can still be used.
     */
    public static readonly isValid = (listener: ClassEventListener): boolean => !listener.deleted;

    /**
     * Delete and disable a listener.
     *
     * @param listener Listener to delete.
     */
    public static readonly delete = (listener: ClassEventListener): void => {
        listener.deleted = true;
        listener.enabled = false;
    };

    /**
     * Render a compact listener summary.
     *
     * @param listener Listener to render.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Human-readable listener summary.
     */
    public static readonly unparse = (listener: ClassEventListener, _interpreter: RuntimeDisplay): string => {
        return `event.listener ${listener.source.classDefinition.name}.${listener.eventName}`;
    };

    /**
     * Copy a listener.
     *
     * Listener values have identity, so copying preserves the same object.
     *
     * @returns This listener.
     */
    public copy(): ClassEventListener {
        return this;
    }
}

export { ClassEventListener };
export type { ClassEventSource };
export default { ClassEventListener };
