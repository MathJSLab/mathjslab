import type { BuiltInFunctionParameter, BuiltInFunctionParameterValidator, NodeInput } from './AST';
import {
    CharString,
    Complex,
    ComplexType,
    FunctionHandle,
    MultiArray,
    Structure,
    ClassInstance,
    ClassEnumerationValue,
    ClassEventListener,
    ClassEventData,
    ClassPropertyEvent,
    ClassMetaObject,
} from './AST';

interface FunctionParameterValidationSpec {
    name?: string;
    classes?: string[];
    validators?: BuiltInFunctionParameterValidator[];
    allowedStrings?: string[];
    identifier?: boolean;
    allowInfinity?: boolean;
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
            if (MultiArray.linearize(value).every((item) => Complex.isInstanceOf(item))) {
                return 'double';
            }
            return 'array';
        }
        return 'unknown';
    }

    /**
     * Extract numeric elements from a scalar or numeric array.
     */
    public static numericElements(value: NodeInput): ComplexType[] | undefined {
        if (Complex.isInstanceOf(value)) {
            return [value as ComplexType];
        }
        if (MultiArray.isInstanceOf(value) && !value.isCell) {
            const values = MultiArray.linearize(value);
            return values.every((item) => Complex.isInstanceOf(item)) ? (values as ComplexType[]) : undefined;
        }
        return undefined;
    }

    /**
     * Check whether a value matches a supported class constraint.
     */
    public static matchesClass(value: NodeInput, className: string): boolean {
        switch (className) {
            case 'double':
            case 'single':
                return Boolean(this.numericElements(value));
            case 'char':
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
     */
    public static isDimensionValue(value: NodeInput, allowEmpty: boolean): boolean {
        if (MultiArray.isEmpty(value)) {
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
     */
    public static isDimensionVector(value: NodeInput, allowEmpty: boolean): boolean {
        if (!MultiArray.isVector(value)) {
            return false;
        }
        const elements = MultiArray.linearize(value);
        return elements.length > 0 && elements.every((item) => this.isDimensionValue(item, allowEmpty));
    }

    /**
     * Check classes, literal allowed strings, identifier syntax, and validators.
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
                    return MultiArray.isScalar(value) && this.isDimensionValue(value, false);
                case 'dimensionGreaterThanOne':
                    return MultiArray.isScalar(value) && this.isDimensionValue(value, false) && Complex.realGreaterThan(MultiArray.firstElement(value) as ComplexType, 1);
                case 'dimensionVector':
                    return this.isDimensionVector(value, false);
                case 'reshapeDimension':
                    return (MultiArray.isScalar(value) || MultiArray.isEmpty(value)) && this.isDimensionValue(value, true);
                case 'reshapeDimensionVector':
                    return this.isDimensionVector(value, true);
                default:
                    return true;
            }
        });
    }

    /**
     * Match a built-in parameter, including alternative parameter shapes.
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
     */
    public static matchesBuiltInValidator(value: NodeInput, validator: BuiltInFunctionParameterValidator, allowInfinity = false): boolean {
        const numericElements = this.numericElements(value);
        const isAllowedInfinity = (item: ComplexType): boolean => Boolean(allowInfinity && Complex.imagIsZero(item) && Complex.realToNumber(item) === Infinity);
        switch (validator) {
            case 'numeric':
                return Boolean(numericElements);
            case 'numericOrLogical':
                return Boolean(numericElements);
            case 'text':
                return CharString.isInstanceOf(value);
            case 'textScalar':
                return CharString.isInstanceOf(value);
            case 'scalar':
                return MultiArray.isScalar(value);
            case 'scalarOrEmpty':
                return MultiArray.isScalar(value) || MultiArray.isEmpty(value);
            case 'scalarOrVector':
                return MultiArray.isScalar(value) || MultiArray.isVector(value);
            case 'empty':
                return MultiArray.isEmpty(value);
            case 'matrix2d':
                return MultiArray.isScalar(value) || (MultiArray.isInstanceOf(value) && value.dimension.length === 2);
            case 'squareMatrix':
                return MultiArray.isScalar(value) || (MultiArray.isInstanceOf(value) && value.dimension.length === 2 && value.dimension[0] === value.dimension[1]);
            case 'vector':
                return MultiArray.isVector(value);
            case 'twoElement':
                return MultiArray.linearize(value).length === 2;
            case 'oneOrTwoElement': {
                const length = MultiArray.linearize(value).length;
                return length === 1 || length === 2;
            }
            case 'nonempty':
                return !MultiArray.isEmpty(value);
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
