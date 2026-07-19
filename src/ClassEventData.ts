import type { NodeInput } from './AST';
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
    public readonly source: ClassInstance;
    /** Name of the event that was raised. */
    public readonly eventName: string;

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
     * @param source Object that raised the event.
     * @param eventName Event name.
     */
    constructor(source: ClassInstance, eventName: string) {
        this.source = source;
        this.eventName = eventName;
    }

    /**
     * Create event data.
     *
     * @param source Object that raised the event.
     * @param eventName Event name.
     * @returns Runtime event data object.
     */
    public static readonly create = (source: ClassInstance, eventName: string): ClassEventData => new ClassEventData(source, eventName);

    /**
     * Read a public event data field.
     *
     * @param eventData Event data object.
     * @param field Field name.
     * @returns Field value, if supported.
     */
    public static readonly getProperty = (eventData: ClassEventData, field: string): NodeInput | undefined => {
        switch (field) {
            case 'Source':
                return eventData.source;
            case 'EventName':
                return CharString.create(eventData.eventName);
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
    public static readonly unparse = (eventData: ClassEventData, _interpreter: RuntimeDisplay): string => `event.EventData ${eventData.source.classDefinition.name}.${eventData.eventName}`;

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
