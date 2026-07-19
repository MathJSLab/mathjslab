import type { NodeArgumentValidation, NodeArguments, NodeExpr, NodeFunctionDefinition, NodeFunctionParameter, NodeFunctionReturn, NodeIdentifier, NodeInput, NodeOperation } from './AST';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { MultiArray } from './MultiArray';
import { FunctionValidation } from './FunctionValidation';
import { RuntimeValue } from './RuntimeValue';

type ThrowSyntaxError = (message: string) => never;
type ThrowEvalError = (message: string) => never;
/** Literal size dimension accepted by MATLAB-style `arguments` declarations. */
type ArgumentSizeDimension = number | { type: 'symbol'; name: string } | { type: 'any' };
/** Normalized validator call extracted from a declaration's `{mustBe...}` list. */
type ArgumentValidatorSpec = { name: string; value?: NodeExpr; bounds?: NodeExpr[]; custom?: 'implicit' | 'explicit'; expression?: NodeExpr };
/** Resolved workspace entry used during call-time validation. */
type ValidationEntry = { node?: NodeInput };
/** Interpreter services needed by parser-independent argument validation. */
type ArgumentValidationCallbacks = {
    /** Resolve the argument or return value currently being validated. */
    resolveEntry: (validation: NodeArgumentValidation, localNamesOnly: boolean) => ValidationEntry | undefined;
    /** Evaluate a validator expression or default-dependent bound. */
    evaluate: (expr: NodeExpr) => NodeInput;
    /** Optional class matcher that can include user-defined classes. */
    matchesClass?: (value: NodeInput, className: string) => boolean;
    /** Evaluation-error callback supplied by the interpreter. */
    throwEvalError: ThrowEvalError;
    /** Syntax-error callback supplied by the interpreter/parser layer. */
    throwSyntaxError: ThrowSyntaxError;
};
/** Callback set used for `arguments (Repeating)` validation over `varargin`. */
type RepeatingArgumentValidationCallbacks = Omit<ArgumentValidationCallbacks, 'resolveEntry'> & {
    /** Validate one repeated value with a per-group symbolic dimension map. */
    validateRepeatingValue: (validation: NodeArgumentValidation, validationName: string, value: NodeInput, displayName: string, symbolicDimensions: Map<string, number>) => void;
};

/**
 * Parser-independent support for MATLAB-like `arguments` blocks.
 *
 * The parser produces `NodeArgumentValidation` records. This module interprets
 * those records for:
 *
 * - input/output/repeating argument blocks,
 * - literal and symbolic size declarations,
 * - supported class declarations,
 * - built-in and user-defined `mustBe*` validators,
 * - default values for input parameters,
 * - name-value option declarations such as `opts.Field`,
 * - call splitting for positional and name-value arguments.
 *
 * It deliberately receives callbacks for lookup, evaluation, and error
 * construction so validation rules remain independent from `Interpreter.ts`.
 */
class FunctionArguments {
    private static isIdentifier(node: NodeFunctionParameter): node is NodeIdentifier {
        return AST.isNodeIdentifier(node);
    }

    private static isDefaultedIdentifier(node: NodeFunctionParameter): node is NodeOperation & { type: '='; left: NodeIdentifier; right: NodeExpr } {
        return AST.isNodeDefaultedParameter(node);
    }

    private static parameterName(node: NodeFunctionParameter): string | undefined {
        return this.isIdentifier(node) ? node.id : this.isDefaultedIdentifier(node) ? node.left.id : undefined;
    }

    /**
     * Return only syntactically valid function parameters from the AST list.
     */
    private static functionParameters(func: NodeFunctionDefinition): NodeFunctionParameter[] {
        return func.parameter.list.filter(AST.isNodeFunctionParameter);
    }

    /**
     * Return only syntactically valid function return targets from the AST list.
     */
    private static functionReturns(func: NodeFunctionDefinition): NodeFunctionReturn[] {
        return func.return.list.filter(AST.isNodeFunctionReturn);
    }

    /**
     * Return only well-formed `arguments` blocks from a function definition.
     */
    private static argumentBlocks(func: NodeFunctionDefinition): NodeArguments[] {
        return func.arguments.list.filter(AST.isNodeArguments);
    }

    /**
     * Return only well-formed declarations from one `arguments` block.
     */
    private static argumentValidations(block: NodeArguments): NodeArgumentValidation[] {
        return block.validation.filter(AST.isNodeArgumentValidation);
    }

    /**
     * Classes currently supported by the function infrastructure.
     *
     * A future class-system implementation can expand this list without
     * changing the parser representation of `arguments` blocks.
     */
    private static readonly supportedArgumentClasses = new Set(['double', 'single', 'logical', 'char', 'string', 'cell', 'struct', 'function_handle']);
    private static readonly supportedArgumentValidators = new Set([
        'mustBeNumeric',
        'mustBeNumericOrLogical',
        'mustBeText',
        'mustBeTextScalar',
        'mustBeScalarOrEmpty',
        'mustBeScalar',
        'mustBeMatrix',
        'mustBeSquare',
        'mustBeVector',
        'mustBeNonempty',
        'mustBePositive',
        'mustBeNonnegative',
        'mustBeNonzero',
        'mustBeInteger',
        'mustBeOdd',
        'mustBeFinite',
        'mustBeReal',
    ]);
    private static readonly supportedComparatorValidators = new Set(['mustBeGreaterThan', 'mustBeGreaterThanOrEqual', 'mustBeLessThan', 'mustBeLessThanOrEqual']);
    private static readonly supportedRangeValidators = new Set(['mustBeInRange']);
    private static readonly supportedMembershipValidators = new Set(['mustBeMember']);
    private static readonly supportedRangeOptions = new Set(['inclusive', 'exclude-lower', 'exclude-upper', 'exclude-both']);
    private static readonly supportedBlockAttributes = new Set(['Input', 'Output', 'Repeating']);

    /**
     * Render one argument-size dimension for diagnostics.
     */
    private static argumentSizeDimensionDisplay(dimension: ArgumentSizeDimension): string {
        if (typeof dimension === 'number') {
            return String(dimension);
        }
        return dimension.type === 'any' ? ':' : dimension.name;
    }

    /**
     * Render a size declaration in a MATLAB-like diagnostic form.
     */
    public static argumentSizeDisplay(dimensions: ArgumentSizeDimension[]): string {
        const display = dimensions.map((dimension) => this.argumentSizeDimensionDisplay(dimension));
        return dimensions.some((dimension) => typeof dimension !== 'number' && dimension.type === 'any') ? `(${display.join(',')})` : display.join('x');
    }

    /**
     * Return the declared argument name, rejecting non-identifier declarations.
     */
    public static validationName(validation: NodeArgumentValidation, throwSyntaxError: ThrowSyntaxError): string {
        const name = validation.name;
        if (!AST.isNodeIdentifier(name)) {
            throwSyntaxError(`arguments block declaration must be an identifier.`);
        }
        return name.id;
    }

    /**
     * Decode a name-value declaration target.
     *
     * `arguments` declarations of the form `opts.Name` are represented as field
     * access nodes. The returned pair identifies the parameter object and the
     * option field.
     */
    public static nameValueTarget(validation: NodeArgumentValidation, throwSyntaxError: ThrowSyntaxError): { parameter: string; field: string } | undefined {
        const name = validation.name;
        if (!AST.isNodeIndirectRef(name)) {
            return undefined;
        }
        if (!AST.isNodeIdentifier(name.obj) || name.field.length !== 1 || typeof name.field[0] !== 'string') {
            throwSyntaxError(`arguments block name-value declaration must be a single dotted identifier.`);
        }
        return { parameter: name.obj.id, field: name.field[0] };
    }

    /**
     * Return the diagnostic display name for ordinary or name-value declarations.
     */
    public static validationDisplayName(validation: NodeArgumentValidation, throwSyntaxError: ThrowSyntaxError): string {
        const nameValue = this.nameValueTarget(validation, throwSyntaxError);
        return nameValue ? `${nameValue.parameter}.${nameValue.field}` : this.validationName(validation, throwSyntaxError);
    }

    /**
     * Convert a size declaration to literal/symbolic dimensions.
     *
     * Numeric dimensions are fixed. Identifiers are symbolic dimensions shared
     * within one validation pass. `:` accepts any actual dimension.
     */
    public static literalArgumentSize(validation: NodeArgumentValidation, throwSyntaxError: ThrowSyntaxError): ArgumentSizeDimension[] | undefined {
        if (!validation.size.some((node) => typeof node !== 'undefined')) {
            return undefined;
        }
        const validationName = this.validationDisplayName(validation, throwSyntaxError);
        return validation.size.map((node) => {
            if (AST.isNodeIdentifier(node)) {
                return { type: 'symbol', name: node.id };
            }
            if (node?.type === ':') {
                return { type: 'any' };
            }
            if (!Complex.isInstanceOf(node) || !Complex.realIsInteger(node as ComplexType) || !Complex.imagIsZero(node as ComplexType)) {
                throwSyntaxError(`arguments block size validation for '${validationName}' must use positive integer, symbolic, or ':' dimensions.`);
            }
            const size = Complex.realToNumber(node as ComplexType);
            if (size < 1) {
                throwSyntaxError(`arguments block size validation for '${validationName}' must use positive integer dimensions.`);
            }
            return size;
        });
    }

    /**
     * Return all supported class names declared for one argument.
     */
    public static argumentClassNames(validation: NodeArgumentValidation, throwSyntaxError: ThrowSyntaxError): string[] | undefined {
        const classNode = validation.class;
        if (!classNode || (AST.isNodeList(classNode) && classNode.list.length === 0)) {
            return undefined;
        }
        const validationName = this.validationDisplayName(validation, throwSyntaxError);
        const classNodes: NodeInput[] = AST.isNodeList(classNode) ? classNode.list : [classNode];
        if (!classNodes.every(AST.isNodeIdentifier)) {
            throwSyntaxError(`arguments block class validation for '${validationName}' must use class identifiers.`);
        }
        const classNames = classNodes.map((node) => node.id);
        return [...new Set(classNames)];
    }

    /**
     * Return a single class name when exactly one class is declared.
     */
    public static argumentClassName(validation: NodeArgumentValidation, throwSyntaxError: ThrowSyntaxError): string | undefined {
        const classNames = this.argumentClassNames(validation, throwSyntaxError);
        return classNames && classNames.length === 1 ? classNames[0] : undefined;
    }

    /**
     * Format a list of class names for diagnostics.
     */
    public static argumentClassDisplay(classNames: string[]): string {
        return classNames.length === 1 ? classNames[0] : classNames.slice(0, -1).join(', ') + ' or ' + classNames[classNames.length - 1];
    }

    /**
     * Parse function validators from an `arguments` declaration.
     *
     * Built-in validators are normalized to `ArgumentValidatorSpec` objects.
     * Unknown bare validators are treated as implicit user validators and called
     * with the argument value. Unknown indexed validators are treated as explicit
     * validator expressions and evaluated as written.
     */
    public static argumentValidators(validation: NodeArgumentValidation, throwSyntaxError: ThrowSyntaxError): ArgumentValidatorSpec[] {
        const validationName = this.validationDisplayName(validation, throwSyntaxError);
        return validation.functions.map((node) => {
            if (AST.isNodeIdentifier(node) && this.supportedArgumentValidators.has(node.id)) {
                return { name: node.id };
            }
            if (AST.isNodeIdentifier(node)) {
                return { name: node.id, custom: 'implicit' };
            }
            if (AST.isNodeIndexExpr(node) && node.delim === '()' && AST.isNodeIdentifier(node.expr) && this.supportedComparatorValidators.has(node.expr.id) && node.args.length === 2) {
                return { name: node.expr.id, value: node.args[0], bounds: [node.args[1]] };
            }
            if (
                AST.isNodeIndexExpr(node) &&
                node.delim === '()' &&
                AST.isNodeIdentifier(node.expr) &&
                this.supportedRangeValidators.has(node.expr.id) &&
                (node.args.length === 3 || node.args.length === 4)
            ) {
                return { name: node.expr.id, value: node.args[0], bounds: node.args.slice(1) };
            }
            if (AST.isNodeIndexExpr(node) && node.delim === '()' && AST.isNodeIdentifier(node.expr) && this.supportedMembershipValidators.has(node.expr.id) && node.args.length === 2) {
                return { name: node.expr.id, value: node.args[0], bounds: [node.args[1]] };
            }
            if (
                AST.isNodeIndexExpr(node) &&
                AST.isNodeIdentifier(node.expr) &&
                (this.supportedComparatorValidators.has(node.expr.id) || this.supportedRangeValidators.has(node.expr.id) || this.supportedMembershipValidators.has(node.expr.id))
            ) {
                throwSyntaxError(`arguments block function validation for '${validationName}' has invalid ${node.expr.id} arguments.`);
            }
            if (AST.isNodeIndexExpr(node) && node.delim === '()' && AST.isNodeIdentifier(node.expr)) {
                return { name: node.expr.id, custom: 'explicit', expression: node };
            }
            throwSyntaxError(`arguments block function validation for '${validationName}' must be a validator identifier or function call.`);
        });
    }

    /**
     * Return the MATLAB-like size of a value.
     */
    public static valueSize(value: NodeInput): number[] {
        return RuntimeValue.dimensions(value);
    }

    /**
     * Extract text elements from scalar text or a cell array of text values.
     */
    private static textElements(value: NodeInput): string[] | undefined {
        if (CharString.isInstanceOf(value)) {
            return [value.str];
        }
        if (MultiArray.isInstanceOf(value) && value.isCell) {
            const values = MultiArray.linearize(value);
            return values.every(CharString.isInstanceOf) ? values.map((item) => item.str) : undefined;
        }
        return undefined;
    }

    /**
     * Validate one built-in `mustBe*` function against an evaluated value.
     */
    public static validateArgumentFunction(
        name: string,
        value: NodeInput,
        validator: string,
        bounds: NodeInput[],
        throwEvalError: ThrowEvalError,
        throwSyntaxError: ThrowSyntaxError,
        validationContext = 'arguments block',
    ): void {
        const numericElements = FunctionValidation.numericElements(value);
        const fail = () => throwEvalError(`${validationContext} validation failed for '${name}': ${validator}.`);
        const getRealBound = (index = 0) => {
            const bound = bounds[index];
            const boundElements = typeof bound !== 'undefined' ? FunctionValidation.numericElements(bound) : undefined;
            if (!boundElements || boundElements.length !== 1 || !Complex.imagIsZero(boundElements[0])) {
                fail();
            }
            return Complex.realToNumber(boundElements![0]);
        };
        const compareRealElements = (test: (item: ComplexType, boundValue: number) => boolean, index = 0) => {
            const boundValue = getRealBound(index);
            return Boolean(numericElements && numericElements.every((item) => Complex.imagIsZero(item) && test(item, boundValue)));
        };
        const builtInValidator = FunctionValidation.builtInValidatorForArgumentValidator(validator);
        if (builtInValidator) {
            if (!FunctionValidation.matchesBuiltInValidator(value, builtInValidator)) fail();
            return;
        }
        switch (validator) {
            case 'mustBeOdd':
                if (!numericElements || !numericElements.every((item) => Complex.realIsInteger(item) && Complex.imagIsZero(item) && Math.abs(Complex.realToNumber(item) % 2) === 1)) {
                    fail();
                }
                return;
            case 'mustBeGreaterThan':
                if (!compareRealElements((item, boundValue) => Complex.realGreaterThan(item, boundValue))) fail();
                return;
            case 'mustBeGreaterThanOrEqual':
                if (!compareRealElements((item, boundValue) => Complex.realGreaterThanOrEqualTo(item, boundValue))) fail();
                return;
            case 'mustBeLessThan':
                if (!compareRealElements((item, boundValue) => Complex.realLessThan(item, boundValue))) fail();
                return;
            case 'mustBeLessThanOrEqual':
                if (!compareRealElements((item, boundValue) => Complex.realLessThanOrEqualTo(item, boundValue))) fail();
                return;
            case 'mustBeInRange': {
                const lower = getRealBound(0);
                const upper = getRealBound(1);
                const option = bounds[2];
                const optionText = typeof option === 'undefined' ? 'inclusive' : CharString.isInstanceOf(option) ? option.str : undefined;
                if (typeof optionText === 'undefined' || !this.supportedRangeOptions.has(optionText)) {
                    fail();
                }
                const lowerTest =
                    optionText === 'exclude-lower' || optionText === 'exclude-both'
                        ? (item: ComplexType) => Complex.realGreaterThan(item, lower)
                        : (item: ComplexType) => Complex.realGreaterThanOrEqualTo(item, lower);
                const upperTest =
                    optionText === 'exclude-upper' || optionText === 'exclude-both'
                        ? (item: ComplexType) => Complex.realLessThan(item, upper)
                        : (item: ComplexType) => Complex.realLessThanOrEqualTo(item, upper);
                if (!numericElements || !numericElements.every((item) => Complex.imagIsZero(item) && lowerTest(item) && upperTest(item))) {
                    fail();
                }
                return;
            }
            case 'mustBeMember': {
                const allowedElements = FunctionValidation.numericElements(bounds[0]);
                if (numericElements && allowedElements) {
                    if (
                        !numericElements.every((item) =>
                            allowedElements.some((allowed) => Complex.imagEquals(item, Complex.imagToNumber(allowed)) && Complex.realEquals(item, Complex.realToNumber(allowed))),
                        )
                    ) {
                        fail();
                    }
                    return;
                }
                const textElements = this.textElements(value);
                const allowedTextElements = this.textElements(bounds[0]);
                if (textElements && allowedTextElements) {
                    if (!textElements.every((item) => allowedTextElements.includes(item))) {
                        fail();
                    }
                    return;
                }
                fail();
                return;
            }
            default:
                throwSyntaxError(`${validationContext} function validation for '${name}' uses unsupported validator '${validator}'.`);
        }
    }

    /**
     * Validate one declaration against the current function workspace.
     *
     * `symbolicDimensions` is shared by declarations in the same block pass so
     * `(n,1)` style declarations bind `n` once and require later uses to match.
     * `localNamesOnly` is used for output validation so inherited names cannot
     * accidentally satisfy a declared but unassigned return variable.
     */
    public static validateArgumentValidation(
        validation: NodeArgumentValidation,
        symbolicDimensions: Map<string, number>,
        callbacks: ArgumentValidationCallbacks,
        localNamesOnly = false,
        displayName = this.validationDisplayName(validation, callbacks.throwSyntaxError),
        validationContext = 'arguments block',
    ): void {
        const expected = this.literalArgumentSize(validation, callbacks.throwSyntaxError);
        const classNames = this.argumentClassNames(validation, callbacks.throwSyntaxError);
        const validators = this.argumentValidators(validation, callbacks.throwSyntaxError);
        if (!expected && !classNames && validators.length === 0) return;
        const entry = callbacks.resolveEntry(validation, localNamesOnly);
        if (!entry || typeof entry.node === 'undefined') {
            callbacks.throwEvalError(`'${displayName}' undefined.`);
        }
        if (expected) {
            const actual = this.valueSize(entry.node);
            const length = Math.max(expected.length, actual.length);
            if (length > expected.length) {
                expected.push(...new Array(length - expected.length).fill(1));
            }
            MultiArray.appendSingletonTail(actual, length);
            const matches = expected.every((dimension, index) => {
                if (typeof dimension === 'number') {
                    return dimension === actual[index];
                }
                if (dimension.type === 'any') {
                    return true;
                }
                const existing = symbolicDimensions.get(dimension.name);
                if (typeof existing === 'undefined') {
                    symbolicDimensions.set(dimension.name, actual[index]);
                    return true;
                }
                return existing === actual[index];
            });
            if (!matches) {
                callbacks.throwEvalError(`${validationContext} validation failed for '${displayName}': expected size ${this.argumentSizeDisplay(expected)}, got ${actual.join('x')}.`);
            }
        }
        const matchesClass = callbacks.matchesClass ?? ((value: NodeInput, className: string): boolean => FunctionValidation.matchesClass(value, className));
        if (classNames && !classNames.some((className) => matchesClass(entry.node!, className))) {
            callbacks.throwEvalError(
                `${validationContext} validation failed for '${displayName}': expected class ${this.argumentClassDisplay(classNames)}, got ${FunctionValidation.className(entry.node)}.`,
            );
        }
        for (const validator of validators) {
            if (validator.custom === 'explicit') {
                callbacks.evaluate(validator.expression!);
                continue;
            }
            if (validator.custom === 'implicit') {
                callbacks.evaluate(AST.nodeIndexExpr(AST.nodeIdentifier(validator.name), AST.nodeList([entry.node as NodeExpr])));
                continue;
            }
            const value = validator.value ? callbacks.evaluate(validator.value) : entry.node;
            const bounds = validator.bounds?.map((bound) => callbacks.evaluate(bound)) ?? [];
            this.validateArgumentFunction(displayName, value, validator.name, bounds, callbacks.throwEvalError, callbacks.throwSyntaxError, validationContext);
        }
    }

    /**
     * Validate all declarations for one block attribute (`Input` or `Output`).
     */
    public static validateFunctionArguments(
        func: NodeFunctionDefinition,
        targetAttribute: 'Input' | 'Output',
        callbacks: ArgumentValidationCallbacks,
        namesToValidate?: Set<string>,
        localNamesOnly = false,
    ): void {
        const symbolicDimensions = new Map<string, number>();
        for (const block of this.argumentBlocks(func)) {
            const attribute = block.attribute?.id ?? 'Input';
            if (attribute !== targetAttribute) {
                continue;
            }
            for (const validation of this.argumentValidations(block)) {
                if (namesToValidate && !namesToValidate.has(this.validationName(validation, callbacks.throwSyntaxError))) {
                    continue;
                }
                this.validateArgumentValidation(validation, symbolicDimensions, callbacks, localNamesOnly);
            }
        }
    }

    /**
     * Validate `arguments (Repeating)` values grouped across `varargin`.
     */
    public static validateRepeatingArguments(func: NodeFunctionDefinition, values: NodeInput[], callbacks: RepeatingArgumentValidationCallbacks): void {
        for (const block of this.argumentBlocks(func)) {
            const attribute = block.attribute?.id ?? 'Input';
            if (attribute !== 'Repeating') {
                continue;
            }
            const validations = this.argumentValidations(block);
            if (values.length % validations.length !== 0) {
                callbacks.throwEvalError(`invalid number of repeating arguments in function ${func.id}`);
            }
            for (let groupIndex = 0; groupIndex < values.length / validations.length; groupIndex++) {
                const symbolicDimensions = new Map<string, number>();
                validations.forEach((validation, validationIndex) => {
                    const value = values[groupIndex * validations.length + validationIndex];
                    const validationName = this.validationName(validation, callbacks.throwSyntaxError);
                    callbacks.validateRepeatingValue(validation, validationName, value, `${validationName}{${groupIndex + 1}}`, symbolicDimensions);
                });
            }
        }
    }

    /**
     * Validate the static consistency of all `arguments` blocks in a function.
     *
     * This is run when a function definition is registered, before any call, so
     * malformed declarations fail early and subsequent call-time validation can
     * assume the block structure is coherent.
     */
    public static validateBlocks(func: NodeFunctionDefinition, throwSyntaxError: ThrowSyntaxError): void {
        const inputNames = new Set(
            this.functionParameters(func)
                .map((node) => this.parameterName(node))
                .filter((name): name is string => typeof name !== 'undefined'),
        );
        const outputNames = new Set(
            this.functionReturns(func)
                .filter(AST.isNodeIdentifier)
                .map((node) => node.id),
        );
        const hasVarargin = inputNames.has('varargin');
        const nameValueFields = new Set<string>();
        for (const block of this.argumentBlocks(func)) {
            const attribute = block.attribute?.id ?? 'Input';
            if (!this.supportedBlockAttributes.has(attribute)) {
                throwSyntaxError(`unsupported arguments block attribute '${attribute}'.`);
            }
            if (attribute === 'Repeating' && !hasVarargin) {
                throwSyntaxError(`arguments (Repeating) requires a varargin parameter in function ${func.id}.`);
            }
            if (attribute === 'Repeating' && block.validation.length === 0) {
                throwSyntaxError(`arguments (Repeating) requires at least one declaration in function ${func.id}.`);
            }
            const validNames = attribute === 'Output' ? outputNames : attribute === 'Input' ? inputNames : undefined;
            for (const validation of this.argumentValidations(block)) {
                const nameValue = this.nameValueTarget(validation, throwSyntaxError);
                const validationName = nameValue ? `${nameValue.parameter}.${nameValue.field}` : this.validationName(validation, throwSyntaxError);
                if (nameValue) {
                    if (attribute !== 'Input') {
                        throwSyntaxError(`arguments block name-value declaration '${validationName}' is only supported for input arguments.`);
                    }
                    if (!inputNames.has(nameValue.parameter)) {
                        throwSyntaxError(`arguments block declaration '${validationName}' does not match a function parameter in function ${func.id}.`);
                    }
                    const key = `${nameValue.parameter}.${nameValue.field}`;
                    if (nameValueFields.has(key)) {
                        throwSyntaxError(`duplicate arguments block name-value declaration '${validationName}' in function ${func.id}.`);
                    }
                    nameValueFields.add(key);
                } else if (validNames && !validNames.has(validationName)) {
                    const target = attribute === 'Output' ? 'return value' : 'function parameter';
                    throwSyntaxError(`arguments block declaration '${validationName}' does not match a ${target} in function ${func.id}.`);
                }
                const hasSize = validation.size.some((node) => typeof node !== 'undefined');
                const hasClass = Boolean(validation.class && (!AST.isNodeList(validation.class) || validation.class.list.length > 0));
                const hasFunctions = validation.functions.some((node) => typeof node !== 'undefined');
                if (hasSize) {
                    this.literalArgumentSize(validation, throwSyntaxError);
                }
                if (hasClass) {
                    this.argumentClassNames(validation, throwSyntaxError);
                }
                if (hasFunctions) {
                    this.argumentValidators(validation, throwSyntaxError);
                }
                if (validation.default && attribute !== 'Input') {
                    throwSyntaxError(`arguments block default for '${validationName}' is only supported for input parameters.`);
                }
                if (nameValue && !validation.default) {
                    throwSyntaxError(`arguments block name-value declaration '${validationName}' requires a default value.`);
                }
                if (validation.default && !nameValue && validationName === 'varargin') {
                    throwSyntaxError(`arguments block default for 'varargin' is not supported.`);
                }
            }
        }
    }

    /**
     * Return parameter names that are backed by name-value declarations.
     */
    public static nameValueParameters(func: NodeFunctionDefinition, throwSyntaxError: ThrowSyntaxError): Set<string> {
        const result = new Set<string>();
        for (const block of this.argumentBlocks(func)) {
            const attribute = block.attribute?.id ?? 'Input';
            if (attribute !== 'Input') {
                continue;
            }
            for (const validation of this.argumentValidations(block)) {
                const target = this.nameValueTarget(validation, throwSyntaxError);
                if (target) {
                    result.add(target.parameter);
                }
            }
        }
        return result;
    }

    /**
     * Return name-value declarations grouped by their parameter object.
     */
    public static nameValueDeclarations(func: NodeFunctionDefinition, throwSyntaxError: ThrowSyntaxError): Map<string, Map<string, NodeArgumentValidation>> {
        const result = new Map<string, Map<string, NodeArgumentValidation>>();
        for (const block of this.argumentBlocks(func)) {
            const attribute = block.attribute?.id ?? 'Input';
            if (attribute !== 'Input') {
                continue;
            }
            for (const validation of this.argumentValidations(block)) {
                const target = this.nameValueTarget(validation, throwSyntaxError);
                if (!target) {
                    continue;
                }
                let fields = result.get(target.parameter);
                if (!fields) {
                    fields = new Map<string, NodeArgumentValidation>();
                    result.set(target.parameter, fields);
                }
                fields.set(target.field, validation);
            }
        }
        return result;
    }

    /**
     * Return ordinary input-parameter default expressions.
     */
    public static inputArgumentDefaults(func: NodeFunctionDefinition, throwSyntaxError: ThrowSyntaxError): Map<string, NodeExpr> {
        const result = new Map<string, NodeExpr>();
        for (const parameter of this.functionParameters(func)) {
            if (this.isDefaultedIdentifier(parameter)) {
                result.set(parameter.left.id, parameter.right);
            }
        }
        for (const block of this.argumentBlocks(func)) {
            const attribute = block.attribute?.id ?? 'Input';
            if (attribute !== 'Input') {
                continue;
            }
            for (const validation of this.argumentValidations(block)) {
                if (!this.nameValueTarget(validation, throwSyntaxError) && validation.default) {
                    result.set(this.validationName(validation, throwSyntaxError), validation.default);
                }
            }
        }
        return result;
    }

    /**
     * Split call arguments into positional and name-value maps.
     *
     * Supported MATLAB-like forms include `Name=value` and `'Name', value`.
     * Matching is case-insensitive and accepts unambiguous prefixes. Once a
     * name-value argument is seen, later positional arguments are rejected.
     */
    public static splitCallNameValueArguments(
        func: NodeFunctionDefinition,
        args: NodeExpr[],
        throwEvalError: ThrowEvalError,
        throwSyntaxError: ThrowSyntaxError,
    ): { positional: NodeExpr[]; named: Map<string, NodeExpr> } {
        const declarations = this.nameValueDeclarations(func, throwSyntaxError);
        const knownFields = new Set([...declarations.values()].flatMap((fields) => [...fields.keys()]));
        const params = this.functionParameters(func);
        const lastParam = params[params.length - 1];
        const hasVarargin = params.length > 0 && this.parameterName(lastParam) === 'varargin';
        const fixedParamCount = hasVarargin ? params.length - 1 : params.length;
        const nameValueParameters = this.nameValueParameters(func, throwSyntaxError);
        const positionalParams = params.slice(0, fixedParamCount).filter((param) => {
            const name = this.parameterName(param);
            return param.type === '<~>' || !name || !nameValueParameters.has(name);
        });
        const inputDefaults = this.inputArgumentDefaults(func, throwSyntaxError);
        let minPositionalCount = positionalParams.length;
        while (minPositionalCount > 0) {
            const param = positionalParams[minPositionalCount - 1];
            const name = this.parameterName(param);
            if (!name || !inputDefaults.has(name)) {
                break;
            }
            minPositionalCount--;
        }
        const positional: NodeExpr[] = [];
        const named = new Map<string, NodeExpr>();
        let seenNamed = false;
        const fields = [...knownFields];
        const hasPotentialNameValueField = (name: string): boolean => fields.some((field) => field.toLowerCase().startsWith(name.toLowerCase()));
        const resolveNameValueField = (name: string): string => {
            if (knownFields.has(name)) {
                return name;
            }
            const lowerName = name.toLowerCase();
            const caseInsensitiveExactMatches = fields.filter((field) => field.toLowerCase() === lowerName);
            if (caseInsensitiveExactMatches.length === 1) {
                return caseInsensitiveExactMatches[0];
            }
            if (caseInsensitiveExactMatches.length > 1) {
                throwEvalError(`ambiguous name-value argument '${name}' in function ${func.id}`);
            }
            const matches = fields.filter((field) => field.toLowerCase().startsWith(lowerName));
            if (matches.length === 1) {
                return matches[0];
            }
            if (matches.length > 1) {
                throwEvalError(`ambiguous name-value argument '${name}' in function ${func.id}`);
            }
            throwEvalError(`unknown name-value argument '${name}' in function ${func.id}`);
        };
        const appendNamed = (name: string, value: NodeExpr) => {
            seenNamed = true;
            const canonicalName = resolveNameValueField(name);
            named.set(canonicalName, value);
        };
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (AST.isNodeDefaultedParameter(arg) && declarations.size > 0) {
                appendNamed(arg.left.id, arg.right);
            } else if (CharString.isInstanceOf(arg) && declarations.size > 0 && (hasPotentialNameValueField(arg.str) || (!hasVarargin && positional.length >= positionalParams.length))) {
                if (i + 1 >= args.length) {
                    throwEvalError(`missing value for name-value argument '${arg.str}' in function ${func.id}`);
                }
                appendNamed(arg.str, args[++i]);
            } else {
                if (seenNamed) {
                    throwEvalError(`positional arguments cannot follow name-value arguments in function ${func.id}`);
                }
                positional.push(arg);
            }
        }
        return { positional, named };
    }

    /**
     * Determine which declared output names must be validated.
     *
     * Only requested fixed outputs are checked. This preserves the MATLAB-like
     * behavior where requesting fewer outputs does not require later return
     * variables to be assigned.
     */
    public static outputNamesToValidate(func: NodeFunctionDefinition, requestedOutputCount: number): Set<string> | undefined {
        const returnNames = this.functionReturns(func).map((node) => (AST.isNodeIgnoredTarget(node) ? null : node.id));
        const hasVarargout = returnNames.length > 0 && returnNames[returnNames.length - 1] === 'varargout';
        if (returnNames.length === 1 && hasVarargout) {
            return undefined;
        }
        const fixedReturnNames = hasVarargout ? returnNames.slice(0, -1) : returnNames;
        return new Set(fixedReturnNames.slice(0, Math.min(Math.max(requestedOutputCount, 1), fixedReturnNames.length)).filter((name): name is string => name !== null));
    }
}

export type { ArgumentValidatorSpec };
export { FunctionArguments };
export default { FunctionArguments };
