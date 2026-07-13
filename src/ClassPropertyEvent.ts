import type { NodeInput } from './AST';
import { CharString } from './CharString';
import type { ClassInstance } from './ClassInstance';
import { ClassEventData } from './ClassEventData';
import type { Interpreter } from './Interpreter';

/**
 * Runtime value compatible with MATLAB's `event.PropertyEvent` shape.
 */
class ClassPropertyEvent extends ClassEventData {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly CLASS_PROPERTY_EVENT = 13;
    /** Runtime type tag stored on property event data objects. */
    public readonly type: number = ClassPropertyEvent.CLASS_PROPERTY_EVENT;
    /** Name of the property that raised the event. */
    public readonly propertyName: string;
    /** Object whose property changed or was observed. */
    public readonly affectedObject: ClassInstance;

    /**
     * Test whether a value is property event data.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassPropertyEvent`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassPropertyEvent => obj instanceof ClassPropertyEvent;

    /**
     * Create property event data.
     *
     * @param source Object whose property raised the event.
     * @param propertyName Property name.
     */
    constructor(source: ClassInstance, propertyName: string) {
        super(source, propertyName);
        this.propertyName = propertyName;
        this.affectedObject = source;
    }

    /**
     * Create property event data.
     *
     * @param source Object whose property raised the event.
     * @param propertyName Property name.
     * @returns Runtime property event data object.
     */
    public static readonly create = (source: ClassInstance, propertyName: string): ClassPropertyEvent => new ClassPropertyEvent(source, propertyName);

    /**
     * Read a public property event field.
     *
     * @param eventData Event data object.
     * @param field Field name.
     * @returns Field value, if supported.
     */
    public static readonly getProperty = (eventData: ClassEventData, field: string): NodeInput | undefined => {
        if (!ClassPropertyEvent.isInstanceOf(eventData)) {
            return ClassEventData.getProperty(eventData, field);
        }
        switch (field) {
            case 'AffectedObject':
                return eventData.affectedObject;
            case 'PropertyName':
                return CharString.create(eventData.propertyName);
            default:
                return ClassEventData.getProperty(eventData, field);
        }
    };

    /**
     * Render a compact property event summary.
     *
     * @param eventData Event data object.
     * @param _interpreter Interpreter requesting unparse.
     * @returns Human-readable event data summary.
     */
    public static readonly unparse = (eventData: ClassEventData, _interpreter: Interpreter): string =>
        ClassPropertyEvent.isInstanceOf(eventData)
            ? `event.PropertyEvent ${eventData.source.classDefinition.name}.${eventData.propertyName}`
            : ClassEventData.unparse(eventData, _interpreter);

    /**
     * Copy property event data.
     *
     * Property event data objects are immutable in the current runtime.
     *
     * @returns This property event data object.
     */
    public copy(): ClassPropertyEvent {
        return this;
    }
}

export { ClassPropertyEvent };
export default { ClassPropertyEvent };
