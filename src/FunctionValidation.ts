import type { BuiltInFunctionParameter, BuiltInFunctionParameterValidator, NodeInput } from './AST';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { ClassInstance } from './ClassInstance';
import { ClassEnumerationValue } from './ClassEnumerationValue';
import { ClassEventListener } from './ClassEventListener';
import { ClassEventData } from './ClassEventData';
import { ClassPropertyEvent } from './ClassPropertyEvent';
import { ClassMetaObject } from './ClassMeta';
import { RuntimeValue } from './RuntimeValue';

/**
 * Declarative validation contract for one evaluated function parameter.
 */
interface FunctionParameterValidationSpec {
    /** Optional parameter name used by callers for diagnostics. */
    name?: string;
    /** Accepted MATLAB-like class names. */
    classes?: string[];
    /** Low-level validator predicates such as `numeric`, `integer`, or `vector`. */
    validators?: BuiltInFunctionParameterValidator[];
    /** Literal string values accepted for text parameters. */
    allowedStrings?: string[];
    /** Whether text values must be valid identifiers. */
    identifier?: boolean;
    /** Whether numeric validators should accept positive infinity. */
    allowInfinity?: boolean;
}

/**
 * Options for extracting numeric scalar elements from runtime values.
 */
interface NumericElementOptions {
    /** Whether logical scalars should be accepted together with numeric values. */
    includeLogical?: boolean;
}

/**
 * Value validation shared by built-in signatures and `arguments` blocks.
 *
 * This module is intentionally value-oriented: it does not know how to evaluate
 * expressions or resolve variables. Callers provide evaluated `NodeInput`
 * values and receive boolean results, making the same validator vocabulary
 * usable for native built-ins and MATLAB-like function declarations.
 */
class FunctionValidation {
    /**
     * Return the MATLAB-like runtime class name for a value.
     *
     * @param value Evaluated runtime value.
     * @returns Class name used by `class`, validators, and diagnostics.
     */
    public static className(value: NodeInput): string {
        if (Complex.isInstanceOf(value)) {
            return value.type === Complex.LOGICAL ? 'logical' : 'double';
        }
        if (CharString.isInstanceOf(value)) {
            return 'char';
        }
        if (FunctionHandle.isInstanceOf(value)) {
            return 'function_handle';
        }
        if (ClassEventListener.isInstanceOf(value)) {
            return 'event.listener';
        }
        if (ClassPropertyEvent.isInstanceOf(value)) {
            return 'event.PropertyEvent';
        }
        if (ClassEventData.isInstanceOf(value)) {
            return 'event.EventData';
        }
        if (ClassMetaObject.isInstanceOf(value)) {
            return value.kind;
        }
        if (ClassInstance.isInstanceOf(value)) {
            return value.classDefinition.name;
        }
        if (ClassEnumerationValue.isInstanceOf(value)) {
            return value.classDefinition.name;
        }
        if (Structure.isStructure(value)) {
            return 'struct';
        }
        if (MultiArray.isInstanceOf(value)) {
            if (value.isCell) {
                return 'cell';
            }
            const elements = MultiArray.linearize(value);
            if (elements.every((item) => Complex.isInstanceOf(item))) {
                if (elements.length > 0 && elements.every((item) => (item as ComplexType).type === Complex.LOGICAL)) {
                    return 'logical';
                }
                return 'double';
            }
            return 'array';
        }
        return 'unknown';
    }

    /**
     * Extract numeric elements from a scalar or numeric array.
     *
     * @param value Evaluated runtime value.
     * @param options Extraction options.
     * @returns Numeric elements in linear order, or `undefined` for nonnumeric values.
     */
    public static numericElements(value: NodeInput, options: NumericElementOptions = {}): ComplexType[] | undefined {
        const acceptsComplex = (item: unknown): item is ComplexType => Complex.isInstanceOf(item) && (options.includeLogical || item.type !== Complex.LOGICAL);
        if (Complex.isInstanceOf(value)) {
            return acceptsComplex(value) ? [value as ComplexType] : undefined;
        }
        if (MultiArray.isInstanceOf(value) && !value.isCell) {
            const values = MultiArray.linearize(value);
            return values.every(acceptsComplex) ? (values as ComplexType[]) : undefined;
        }
        return undefined;
    }

    /**
     * Test whether a value is a logical scalar or logical array.
     *
     * @param value Evaluated runtime value.
     * @returns `true` when every stored element is logical.
     */
    public static isLogicalValue(value: NodeInput): boolean {
        const elements = this.numericElements(value, { includeLogical: true });
        return Boolean(elements && elements.length > 0 && elements.every((item) => item.type === Complex.LOGICAL));
    }

    /**
     * Check whether a value matches a supported class constraint.
     *
     * @param value Evaluated runtime value.
     * @param className MATLAB-like class name.
     * @returns `true` when the value belongs to the class.
     */
    public static matchesClass(value: NodeInput, className: string): boolean {
        switch (className) {
            case 'double':
            case 'single':
                return Boolean(this.numericElements(value));
            case 'logical':
                return this.isLogicalValue(value);
            case 'char':
            case 'string':
                return CharString.isInstanceOf(value);
            case 'cell':
                return MultiArray.isInstanceOf(value) && value.isCell;
            case 'struct':
                return Structure.isStructure(value);
            case 'function_handle':
                return FunctionHandle.isInstanceOf(value);
            default:
                return false;
        }
    }

    /**
     * Remove validators implied by more specific validators.
     *
     * @param validators Validator list to normalize.
     * @returns Validator list with redundant predicates removed.
     */
    public static normalizeValidators(validators: BuiltInFunctionParameterValidator[] = []): BuiltInFunctionParameterValidator[] {
        const normalized = new Set(validators);
        const remove = (...impliedValidators: BuiltInFunctionParameterValidator[]) => {
            for (const impliedValidator of impliedValidators) {
                normalized.delete(impliedValidator);
            }
        };
        if (normalized.has('dimensionGreaterThanOne')) {
            remove('numeric', 'scalar', 'real', 'finite', 'integer', 'positive', 'nonnegative', 'dimension');
        }
        if (normalized.has('dimension')) {
            remove('numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative');
        }
        if (normalized.has('dimensionVector')) {
            remove('numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative');
        }
        if (normalized.has('reshapeDimension')) {
            remove('numeric', 'scalar', 'scalarOrEmpty', 'real', 'finite', 'integer', 'nonnegative');
        }
        if (normalized.has('reshapeDimensionVector')) {
            remove('numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative');
        }
        if (normalized.has('positive')) {
            remove('nonnegative');
        }
        if (normalized.has('zeroOrOne')) {
            remove('nonnegative');
        }
        if (normalized.has('textScalar')) {
            remove('text', 'scalar', 'scalarOrEmpty', 'scalarOrVector');
        }
        if (normalized.has('squareMatrix')) {
            remove('matrix2d');
        }
        if (normalized.has('scalar')) {
            remove('scalarOrEmpty', 'scalarOrVector');
        }
        return [...normalized];
    }

    /**
     * Check whether a value can be used as a dimension scalar.
     *
     * @param value Evaluated runtime value.
     * @param allowEmpty Whether empty values are accepted.
     * @returns `true` for nonnegative integer dimension values.
     */
    public static isDimensionValue(value: NodeInput, allowEmpty: boolean): boolean {
        if (RuntimeValue.isEmpty(value)) {
            return allowEmpty;
        }
        const numericElements = this.numericElements(value);
        return Boolean(
            numericElements &&
            numericElements.every((item) => Complex.imagIsZero(item) && Complex.realIsFinite(item) && Complex.realIsInteger(item) && Complex.realGreaterThanOrEqualTo(item, 0)),
        );
    }

    /**
     * Check whether a value is a valid dimension vector.
     *
     * @param value Evaluated runtime value.
     * @param allowEmpty Whether empty dimension entries are accepted.
     * @returns `true` for vector-shaped dimension lists.
     */
    public static isDimensionVector(value: NodeInput, allowEmpty: boolean): boolean {
        if (!RuntimeValue.isVector(value)) {
            return false;
        }
        const elements = MultiArray.linearize(value);
        return elements.length > 0 && elements.every((item) => this.isDimensionValue(item, allowEmpty));
    }

    /**
     * Check classes, literal allowed strings, identifier syntax, and validators.
     *
     * @param value Evaluated runtime value.
     * @param spec Declarative validation specification.
     * @returns `true` when all declared constraints match.
     */
    public static matchesParameter(value: NodeInput, spec: FunctionParameterValidationSpec): boolean {
        if (spec.classes && spec.classes.length > 0 && !spec.classes.some((className) => this.matchesClass(value, className))) {
            return false;
        }
        if (spec.allowedStrings && spec.allowedStrings.length > 0 && (!CharString.isInstanceOf(value) || !spec.allowedStrings.includes(value.str))) {
            return false;
        }
        if (spec.identifier && (!CharString.isInstanceOf(value) || !/^[A-Za-z_]\w*$/.test(value.str))) {
            return false;
        }
        return this.normalizeValidators(spec.validators).every((validator) => this.matchesBuiltInValidator(value, validator, spec.allowInfinity));
    }

    /**
     * Match a built-in parameter before considering alternatives.
     *
     * @param value Evaluated argument value.
     * @param parameter Built-in parameter declaration.
     * @returns `true` when the primary parameter shape accepts the value.
     */
    public static matchesBuiltInParameterBase(value: NodeInput, parameter: BuiltInFunctionParameter): boolean {
        const validators = this.normalizeValidators(parameter.validators);
        const specialValidators = new Set<BuiltInFunctionParameterValidator>(['dimension', 'dimensionGreaterThanOne', 'dimensionVector', 'reshapeDimension', 'reshapeDimensionVector']);
        const commonSpec: FunctionParameterValidationSpec = { ...parameter, validators: validators.filter((validator) => !specialValidators.has(validator)) };
        if (!this.matchesParameter(value, commonSpec)) {
            return false;
        }
        return validators.every((validator) => {
            switch (validator) {
                case 'dimension':
                    return RuntimeValue.isScalar(value) && this.isDimensionValue(value, false);
                case 'dimensionGreaterThanOne':
                    return RuntimeValue.isScalar(value) && this.isDimensionValue(value, false) && Complex.realGreaterThan(MultiArray.firstElement(value) as ComplexType, 1);
                case 'dimensionVector':
                    return this.isDimensionVector(value, false);
                case 'reshapeDimension':
                    return (RuntimeValue.isScalar(value) || RuntimeValue.isEmpty(value)) && this.isDimensionValue(value, true);
                case 'reshapeDimensionVector':
                    return this.isDimensionVector(value, true);
                default:
                    return true;
            }
        });
    }

    /**
     * Match a built-in parameter, including alternative parameter shapes.
     *
     * @param value Evaluated argument value.
     * @param parameter Built-in parameter declaration.
     * @returns `true` when the primary shape or any alternative accepts the value.
     */
    public static matchesBuiltInParameter(value: NodeInput, parameter: BuiltInFunctionParameter): boolean {
        if (!this.matchesBuiltInParameterBase(value, parameter)) {
            return false;
        }
        if (parameter.alternatives && parameter.alternatives.length > 0) {
            return parameter.alternatives.some((alternative) => this.matchesBuiltInParameter(value, alternative));
        }
        return true;
    }

    /**
     * Check an evaluated argument list against declarative built-in parameters.
     *
     * @param args Evaluated argument list.
     * @param parameters Declarative built-in parameter list.
     * @returns `true` when every argument satisfies its parameter declaration.
     */
    public static argumentsMatchBuiltInParameters(args: NodeInput[], parameters?: BuiltInFunctionParameter[]): boolean {
        if (!parameters) {
            return true;
        }
        for (let index = 0; index < args.length; index++) {
            const baseParameter = parameters[Math.min(index, parameters.length - 1)];
            if (!baseParameter || (index >= parameters.length && !baseParameter.variadic)) {
                continue;
            }
            const parameter =
                baseParameter.variadic && baseParameter.variadicGroup && baseParameter.variadicGroup.length > 0
                    ? baseParameter.variadicGroup[(index - Math.min(index, parameters.length - 1)) % baseParameter.variadicGroup.length]
                    : baseParameter;
            if (!this.matchesBuiltInParameter(args[index], parameter)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check one low-level validator predicate.
     *
     * @param value Evaluated runtime value.
     * @param validator Validator predicate name.
     * @param allowInfinity Whether positive infinity is accepted by numeric predicates.
     * @returns `true` when the value satisfies the predicate.
     */
    public static matchesBuiltInValidator(value: NodeInput, validator: BuiltInFunctionParameterValidator, allowInfinity = false): boolean {
        const numericElements = this.numericElements(value);
        const isAllowedInfinity = (item: ComplexType): boolean => Boolean(allowInfinity && Complex.imagIsZero(item) && Complex.realToNumber(item) === Infinity);
        switch (validator) {
            case 'numeric':
                return Boolean(numericElements);
            case 'numericOrLogical':
                return Boolean(this.numericElements(value, { includeLogical: true }));
            case 'text':
                return CharString.isInstanceOf(value);
            case 'textScalar':
                return CharString.isInstanceOf(value);
            case 'scalar':
                return RuntimeValue.isScalar(value);
            case 'scalarOrEmpty':
                return RuntimeValue.isScalar(value) || RuntimeValue.isEmpty(value);
            case 'scalarOrVector':
                return RuntimeValue.isScalar(value) || RuntimeValue.isVector(value);
            case 'empty':
                return RuntimeValue.isEmpty(value);
            case 'matrix2d':
                return RuntimeValue.isMatrix(value);
            case 'squareMatrix':
                return RuntimeValue.isSquareMatrix(value);
            case 'vector':
                return RuntimeValue.isVector(value);
            case 'twoElement':
                return RuntimeValue.elementCount(value) === 2;
            case 'oneOrTwoElement': {
                const length = RuntimeValue.elementCount(value);
                return length === 1 || length === 2;
            }
            case 'nonempty':
                return !RuntimeValue.isEmpty(value);
            case 'positive':
                return Boolean(numericElements && numericElements.every((item) => isAllowedInfinity(item) || (Complex.imagIsZero(item) && Complex.realGreaterThan(item, 0))));
            case 'nonnegative':
                return Boolean(numericElements && numericElements.every((item) => isAllowedInfinity(item) || (Complex.imagIsZero(item) && Complex.realGreaterThanOrEqualTo(item, 0))));
            case 'nonzero':
                return Boolean(numericElements && numericElements.every((item) => Complex.realToNumber(item) !== 0 || Complex.imagToNumber(item) !== 0));
            case 'zeroOrOne':
                return Boolean(numericElements && numericElements.every((item) => Complex.imagIsZero(item) && (Complex.realToNumber(item) === 0 || Complex.realToNumber(item) === 1)));
            case 'integer':
                return Boolean(numericElements && numericElements.every((item) => isAllowedInfinity(item) || (Complex.imagIsZero(item) && Complex.realIsInteger(item))));
            case 'finite':
                return Boolean(numericElements && numericElements.every((item) => Complex.realIsFinite(item) && Complex.imagIsFinite(item)));
            case 'real':
                return Boolean(numericElements && numericElements.every((item) => Complex.imagIsZero(item)));
            default:
                return false;
        }
    }

    /**
     * Map MATLAB `mustBe*` validator names to built-in signature validators.
     *
     * @param validator MATLAB-style validator function name.
     * @returns Equivalent low-level validator, if supported.
     */
    public static builtInValidatorForArgumentValidator(validator: string): BuiltInFunctionParameterValidator | undefined {
        switch (validator) {
            case 'mustBeNumeric':
                return 'numeric';
            case 'mustBeNumericOrLogical':
                return 'numericOrLogical';
            case 'mustBeText':
                return 'text';
            case 'mustBeTextScalar':
                return 'textScalar';
            case 'mustBeScalarOrEmpty':
                return 'scalarOrEmpty';
            case 'mustBeScalar':
                return 'scalar';
            case 'mustBeMatrix':
                return 'matrix2d';
            case 'mustBeSquare':
                return 'squareMatrix';
            case 'mustBeVector':
                return 'vector';
            case 'mustBeNonempty':
                return 'nonempty';
            case 'mustBePositive':
                return 'positive';
            case 'mustBeNonnegative':
                return 'nonnegative';
            case 'mustBeNonzero':
                return 'nonzero';
            case 'mustBeInteger':
                return 'integer';
            case 'mustBeFinite':
                return 'finite';
            case 'mustBeReal':
                return 'real';
            default:
                return undefined;
        }
    }
}

export type { FunctionParameterValidationSpec };
export { FunctionValidation };
export default { FunctionValidation };
