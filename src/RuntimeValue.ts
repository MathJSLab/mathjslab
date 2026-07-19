/**
 * Shared runtime-value helpers that cut across parser, interpreter, built-ins,
 * and validation modules.
 *
 * This module centralizes contracts that must remain identical wherever a
 * MATLAB/Octave value is inspected. In particular, `CharString` is a row
 * character vector, `MultiArray` values keep their stored dimensions, and all
 * other scalar runtime values are `1x1`.
 */
type RuntimeStructureField = Record<string, unknown> | string[];

type RuntimeStructureLike = {
    type: number;
    field: Record<string, unknown>;
    copy?: () => RuntimeStructureLike;
};

abstract class RuntimeValue {
    /** Runtime tag used by function-handle values. */
    public static readonly FUNCTION_HANDLE = 5;

    /** Runtime tag shared by class instances and some class metadata values. */
    public static readonly CLASS_INSTANCE = 7;

    private static structureFactory: ((field: RuntimeStructureField) => RuntimeStructureLike) | undefined;

    /**
     * Test whether a value implements the runtime copy protocol.
     *
     * Runtime scalar/object values own their copy semantics. This structural
     * test keeps generic runtime helpers decoupled from concrete value classes.
     *
     * @param value Value to inspect.
     * @returns `true` when `value.copy()` can be used.
     */
    private static readonly hasCopy = <T>(value: T): value is T & { copy: () => T } =>
        !!value && (typeof value === 'object' || typeof value === 'function') && typeof (value as { copy?: unknown }).copy === 'function';

    /**
     * Copy a runtime value through its own copy protocol.
     *
     * Immutable or singleton-like values may return themselves from `copy()`.
     * Values without a copy method are returned unchanged so parser-only nodes
     * and plain host values can still flow through generic runtime paths.
     *
     * @param value Runtime value to copy.
     * @returns Copied value when supported, otherwise `value`.
     */
    public static readonly copy = <T>(value: T): T => (RuntimeValue.hasCopy(value) ? value.copy() : value);

    /**
     * Register the runtime structure constructor without coupling generic
     * runtime helpers to the concrete `Structure` module.
     *
     * @param factory Factory that creates a structure value.
     */
    public static readonly registerStructureFactory = (factory: (field: RuntimeStructureField) => RuntimeStructureLike): void => {
        RuntimeValue.structureFactory = factory;
    };

    /**
     * Create a runtime structure through the registered factory.
     *
     * @param field Field map or nested field path.
     * @returns New runtime structure value.
     */
    public static readonly createStructure = (field: RuntimeStructureField): RuntimeStructureLike => {
        if (!RuntimeValue.structureFactory) {
            throw new Error('runtime structure factory is not registered.');
        }
        return RuntimeValue.structureFactory(field);
    };

    /**
     * Test whether a value structurally behaves as a MATLAB/Octave object instance.
     *
     * The runtime deliberately avoids importing `ClassInstance` here so generic
     * array and dispatch helpers can identify object values without coupling to
     * the concrete class module. Metadata objects may share the same type tag, so
     * the test also requires an object-property bag and a class definition.
     *
     * @param value Value to inspect.
     * @returns `true` when `value` looks like a class instance.
     */
    public static readonly isClassInstance = (value: unknown): value is { type: number; classDefinition: { name: string }; properties: Map<string, unknown> | Record<string, unknown> } =>
        !!value &&
        typeof value === 'object' &&
        (value as { type?: unknown }).type === RuntimeValue.CLASS_INSTANCE &&
        !!(value as { classDefinition?: unknown }).classDefinition &&
        typeof (value as { classDefinition: { name?: unknown } }).classDefinition.name === 'string' &&
        !!(value as { properties?: unknown }).properties &&
        typeof (value as { properties?: unknown }).properties === 'object';

    /**
     * Return the class-definition object associated with a runtime class instance.
     *
     * @param value Value to inspect.
     * @returns The instance class definition, or `undefined` for non-instances.
     */
    public static readonly classDefinitionOfInstance = (value: unknown): { name: string } | undefined => (RuntimeValue.isClassInstance(value) ? value.classDefinition : undefined);

    /**
     * Detect values that expose MATLAB/Octave shape metadata.
     *
     * This intentionally uses a structural test instead of importing concrete
     * runtime classes. Shape is a cross-cutting contract, and keeping this
     * helper dependency-light avoids adding cycles among the interpreter core
     * modules.
     */
    private static readonly hasDimensions = (value: unknown): value is { dimension: number[] } =>
        !!value &&
        typeof value === 'object' &&
        Array.isArray((value as { dimension?: unknown }).dimension) &&
        (value as { dimension: unknown[] }).dimension.every((dimension) => typeof dimension === 'number');

    /**
     * Return MATLAB/Octave-style dimensions for a runtime value.
     *
     * @param value Runtime value to inspect.
     * @param minDimensions Minimum number of dimensions to expose.
     * @returns A fresh dimension array padded with singleton dimensions.
     */
    public static readonly dimensions = (value: unknown, minDimensions = 2): number[] => {
        const dimensions = (() => {
            if (RuntimeValue.hasDimensions(value)) {
                return value.dimension.slice();
            }
            return [1, 1];
        })();
        while (dimensions.length < minDimensions) {
            dimensions.push(1);
        }
        return dimensions;
    };

    /**
     * Return the MATLAB/Octave element count for a runtime value.
     *
     * @param value Runtime value to inspect.
     * @returns Product of runtime dimensions.
     */
    public static readonly elementCount = (value: unknown): number => RuntimeValue.dimensions(value).reduce((product, dimension) => product * dimension, 1);

    /**
     * Test whether the runtime value has at least one zero dimension.
     *
     * @param value Runtime value to inspect.
     * @returns `true` for empty arrays and empty character vectors.
     */
    public static readonly isEmpty = (value: unknown): boolean => RuntimeValue.dimensions(value).some((dimension) => dimension === 0);

    /**
     * Test whether the runtime value contains exactly one element.
     *
     * @param value Runtime value to inspect.
     * @returns `true` for `1x1` values.
     */
    public static readonly isScalar = (value: unknown): boolean => RuntimeValue.elementCount(value) === 1;

    /**
     * Test whether the runtime value is two-dimensional.
     *
     * @param value Runtime value to inspect.
     * @returns `true` when the value has exactly two runtime dimensions.
     */
    public static readonly isMatrix = (value: unknown): boolean => RuntimeValue.dimensions(value).length === 2;

    /**
     * Test whether the runtime value is a row or column vector.
     *
     * @param value Runtime value to inspect.
     * @returns `true` for two-dimensional values with one singleton dimension.
     */
    public static readonly isVector = (value: unknown): boolean => {
        const dimensions = RuntimeValue.dimensions(value);
        return dimensions.length === 2 && (dimensions[0] === 1 || dimensions[1] === 1);
    };

    /**
     * Test whether the runtime value is a row vector.
     *
     * @param value Runtime value to inspect.
     * @returns `true` for two-dimensional values with one row.
     */
    public static readonly isRowVector = (value: unknown): boolean => {
        const dimensions = RuntimeValue.dimensions(value);
        return dimensions.length === 2 && dimensions[0] === 1;
    };

    /**
     * Test whether the runtime value is a column vector.
     *
     * @param value Runtime value to inspect.
     * @returns `true` for two-dimensional values with one column.
     */
    public static readonly isColumnVector = (value: unknown): boolean => {
        const dimensions = RuntimeValue.dimensions(value);
        return dimensions.length === 2 && dimensions[1] === 1;
    };

    /**
     * Test whether the runtime value is a square two-dimensional matrix.
     *
     * @param value Runtime value to inspect.
     * @returns `true` for `NxN` values.
     */
    public static readonly isSquareMatrix = (value: unknown): boolean => {
        const dimensions = RuntimeValue.dimensions(value);
        return dimensions.length === 2 && dimensions[0] === dimensions[1];
    };
}

export { RuntimeValue };
export default RuntimeValue;
