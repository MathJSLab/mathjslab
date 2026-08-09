import type { RuntimeExpressionValue } from './AST';
import { CharString } from './CharString';
import type { ClassInstance } from './ClassInstance';
import type { RuntimeDisplay } from './RuntimeDisplay';

/**
 * Runtime value compatible with MATLAB's `event.EventData` shape.
 */
class ClassEventData {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_EVENT_DATA = 12;
    /** Runtime type tag stored on event data objects. */
    public readonly type: number = ClassEventData.CLASS_EVENT_DATA;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent?: unknown;
    /** Object that raised the event. */
    public source?: ClassInstance;
    /** Name of the event that was raised. */
    public eventName?: string;

    /**
     * Test whether a value is event data.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassEventData`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassEventData => obj instanceof ClassEventData;

    /**
     * Create event data.
     *
     * @param source Object that raised the event, when already dispatched.
     * @param eventName Event name, when already dispatched.
     */
    constructor(source?: ClassInstance, eventName?: string) {
        this.source = source;
        this.eventName = eventName;
    }

    /**
     * Create event data.
     *
     * @param source Object that raised the event, when already dispatched.
     * @param eventName Event name, when already dispatched.
     * @returns Runtime event data object.
     */
    public static readonly create = (source?: ClassInstance, eventName?: string): ClassEventData => new ClassEventData(source, eventName);

    /**
     * Read a public event data field.
     *
     * @param eventData Event data object.
     * @param field Field name.
     * @returns Field value, if supported.
     */
    public static readonly getProperty = (eventData: ClassEventData, field: string): RuntimeExpressionValue | undefined => {
        switch (field) {
            case 'Source':
                return eventData.source;
            case 'EventName':
                return typeof eventData.eventName === 'undefined' ? undefined : CharString.create(eventData.eventName);
            default:
                return undefined;
        }
    };

    /**
     * Render a compact event data summary.
     *
     * @param eventData Event data object.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Human-readable event data summary.
     */
    public static readonly unparse = (eventData: ClassEventData, _interpreter: RuntimeDisplay): string =>
        eventData.source && eventData.eventName ? `event.EventData ${eventData.source.classDefinition.name}.${eventData.eventName}` : 'event.EventData';

    /**
     * Copy event data.
     *
     * Event data objects are immutable in the current runtime.
     *
     * @returns This event data object.
     */
    public copy(): ClassEventData {
        return this;
    }
}

export { ClassEventData };
export default { ClassEventData };
