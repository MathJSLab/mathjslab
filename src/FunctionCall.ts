import type { ExpressionBoundaryValue, NodeExpr, NodeFunctionDefinition, NodeFunctionParameter, NodeFunctionReturn, NodeIdentifier, NodeInput, ReturnHandlerResult, NameTable } from './AST';
import { AST } from './AST';
import { expressionValue } from './ExpressionValue';
import { MultiArray } from './MultiArray';

/**
 * Interpreter error callback used by pure call helpers.
 */
type ThrowEvalError = (message: string) => never;

type ReturnName = NodeFunctionReturn;
type FunctionParameter = NodeFunctionParameter;
type DefaultedFunctionParameter = NodeFunctionParameter & { type: '='; left: NodeIdentifier; right: NodeExpr };
type EvaluatedArgumentValue = ExpressionBoundaryValue | DefaultArgumentMarker;
type CallArgumentValue = ExpressionBoundaryValue;

/**
 * Internal placeholder for Octave's `:` default-argument marker.
 */
type DefaultArgumentMarker = {
    /** Discriminator for default-marker values. */
    useDefaultArgument: true;
};

/**
 * Workspace binding callback used while wiring evaluated inputs and outputs.
 */
type DefineName = (name: string, value: ExpressionBoundaryValue) => void;

/**
 * Expression evaluator callback supplied by the interpreter.
 */
type EvaluateExpression = (expression: NodeExpr) => NodeInput;

/**
 * Default-argument evaluator callback.
 *
 * The parameter name is passed so interpreter diagnostics can report which
 * default expression failed.
 */
type EvaluateDefault = (name: string, expression: NodeExpr) => NodeInput;

/**
 * Static input layout derived from a function definition.
 */
type FunctionInputLayout = {
    /**
     * All declared parameters, including name-value-only parameters and `varargin`.
     */
    params: FunctionParameter[];
    /**
     * Whether the final declared parameter is `varargin`.
     */
    hasVarargin: boolean;
    /**
     * Number of parameters before `varargin`, if any.
     */
    fixedParamCount: number;
    /**
     * Parameters that accept positional arguments after name-value filtering.
     */
    positionalParams: FunctionParameter[];
    /**
     * Number of positional parameters after name-value filtering.
     */
    positionalParamCount: number;
};

/**
 * Static output layout derived from a function definition.
 */
type FunctionReturnLayout = {
    /**
     * All declared return identifiers, including `varargout`.
     */
    returnNames: ReturnName[];
    /**
     * Whether the final declared return identifier is `varargout`.
     */
    hasVarargout: boolean;
    /**
     * Return variable that behaves as a variable-length output cell.
     *
     * This is usually `varargout`, but MATLAB `arguments (Output,Repeating)`
     * also allows an ordinary output name to back a repeating output list.
     */
    variableOutputName?: string;
    /**
     * Number of fixed return identifiers before `varargout`, if any.
     */
    fixedReturnCount: number;
    /**
     * Return names as strings for workspace lookup.
     */
    names: string[];
};

/**
 * Call-site arguments after positional and name-value splitting.
 */
type FunctionCallArguments = {
    /**
     * Positional argument expressions in call order.
     */
    positional: CallArgumentValue[];
    /**
     * Positional argument count before comma-separated-list expansion.
     */
    rawPositionalCount?: number;
    /**
     * Name-value argument expressions keyed by option name.
     */
    named: Map<string, CallArgumentValue>;
};

/**
 * Complete metadata needed to enter a user-function call.
 */
type PreparedFunctionCall = {
    /**
     * Prepared input layout.
     */
    inputLayout: FunctionInputLayout;
    /**
     * Prepared output layout.
     */
    returnLayout: FunctionReturnLayout;
    /**
     * Split call-site arguments.
     */
    callArguments: FunctionCallArguments;
    /**
     * Default expressions keyed by parameter name.
     */
    inputDefaults: Map<string, NodeExpr>;
    /**
     * Minimum number of positional arguments required after trailing defaults.
     */
    minFixedParamCount: number;
};

/**
 * Interpreter services required while preparing a function call.
 */
type FunctionCallPreparationCallbacks = {
    /**
     * Return the parameters that are bound exclusively through name-value input.
     */
    nameValueParameters: (func: NodeFunctionDefinition) => Set<string>;
    /**
     * Split raw call arguments into positional and named groups.
     */
    splitCallArguments: (func: NodeFunctionDefinition, args: CallArgumentValue[]) => FunctionCallArguments;
    /**
     * Expand comma-separated-list expressions in positional call arguments.
     */
    expandPositionalArguments?: (args: CallArgumentValue[]) => CallArgumentValue[];
    /**
     * Return default expressions keyed by input parameter name.
     */
    inputDefaults: (func: NodeFunctionDefinition) => Map<string, NodeExpr>;
    /**
     * Return the `arguments (Output,Repeating)` output name, when present.
     */
    outputRepeatingName?: (func: NodeFunctionDefinition) => string | undefined;
    /**
     * Raise an interpreter evaluation error.
     */
    throwEvalError: ThrowEvalError;
};

/**
 * Mechanics for calling MATLAB/Octave-like user functions and lambdas.
 *
 * The interpreter remains responsible for parsing, expression evaluation, and
 * error construction. This class is deliberately a pure helper around layouts,
 * arity checks, argument binding, `varargin`, `varargout`, default arguments,
 * and lazy return-list construction.
 */
class FunctionCall {
    private static readonly defaultArgumentMarker: DefaultArgumentMarker = { useDefaultArgument: true };

    private static isIdentifier(node: FunctionParameter): node is NodeIdentifier {
        return AST.isNodeIdentifier(node);
    }

    private static isDefaultedIdentifier(node: FunctionParameter): node is DefaultedFunctionParameter {
        return AST.isNodeDefaultedParameter(node);
    }

    private static parameterName(node: FunctionParameter): string | undefined {
        return this.isIdentifier(node) ? node.id : this.isDefaultedIdentifier(node) ? node.left.id : undefined;
    }

    private static isNamed(node: FunctionParameter, name: string): boolean {
        return this.parameterName(node) === name;
    }

    /**
     * Validate function header metadata that should already be guaranteed by AST factories.
     */
    private static checkedList<NODE>(items: unknown[], guard: (value: unknown) => value is NODE, role: string): NODE[] {
        return items.map((item, index) => {
            if (!guard(item)) {
                throw new TypeError(`internal AST error: ${role} ${index + 1} has invalid node type.`);
            }
            return item;
        });
    }

    /**
     * Ensure a workspace value can be exposed through a lazy return list.
     *
     * `eval`/`evalin` can legitimately hand back a `NodeList` execution result,
     * so the return channel accepts strict expression values plus that explicit
     * carrier while still rejecting control-flow statements.
     */
    private static returnExpression(value: unknown, name: string, throwEvalError: ThrowEvalError): NodeExpr {
        return expressionValue(value, name, 'Return variable', throwEvalError);
    }

    /**
     * Ensure an evaluated input can be bound to a function workspace.
     */
    private static evaluatedArgument(value: unknown, name: string, throwEvalError: ThrowEvalError): ExpressionBoundaryValue {
        return expressionValue(value, name, 'Argument value', throwEvalError);
    }

    private static isDefaultArgumentMarker(value: EvaluatedArgumentValue): value is DefaultArgumentMarker {
        return (value as DefaultArgumentMarker).useDefaultArgument === true;
    }

    private static callArgumentRequestsDefault(arg: CallArgumentValue): boolean {
        return AST.isNodeBase(arg) && arg.type === ':';
    }

    private static requireEvaluatedArgument(value: EvaluatedArgumentValue, name: string, throwEvalError: ThrowEvalError): ExpressionBoundaryValue {
        if (this.isDefaultArgumentMarker(value)) {
            throwEvalError(`invalid use of default argument marker ':' for ${name}.`);
        }
        return value;
    }

    /**
     * Convert evaluated argument values back to ordinary expression values.
     *
     * This is used after fixed positional defaults have consumed any `:`
     * markers, before forwarding remaining inputs to `varargin` or repeating
     * argument validation.
     */
    public static expressionArgumentValues(values: EvaluatedArgumentValue[], role: string, throwEvalError: ThrowEvalError): ExpressionBoundaryValue[] {
        return values.map((value, index) => this.requireEvaluatedArgument(value, `${role} ${index + 1}`, throwEvalError));
    }

    /**
     * Compute the input layout of a user-defined function.
     *
     * Name-value option structs declared through `arguments` are excluded from
     * the positional parameter list. `varargin` still participates as the final
     * catch-all parameter.
     */
    public static inputLayout(func: NodeFunctionDefinition, nameValueParameters: Set<string>): FunctionInputLayout {
        const params = this.checkedList(func.parameter.list, AST.isNodeFunctionParameter, 'function parameter');
        const hasVarargin = params.length > 0 && this.isNamed(params[params.length - 1], 'varargin');
        const fixedParamCount = hasVarargin ? params.length - 1 : params.length;
        const positionalParams = params.slice(0, fixedParamCount).filter((param) => {
            const name = this.parameterName(param);
            return param.type === '<~>' || !name || !nameValueParameters.has(name);
        });
        return {
            params,
            hasVarargin,
            fixedParamCount,
            positionalParams,
            positionalParamCount: positionalParams.length,
        };
    }

    /**
     * Compute the fixed/variadic input layout of an anonymous function handle.
     */
    public static lambdaInputLayout(params: FunctionParameter[]): Pick<FunctionInputLayout, 'hasVarargin' | 'fixedParamCount'> {
        const hasVarargin = params.length > 0 && this.isNamed(params[params.length - 1], 'varargin');
        return { hasVarargin, fixedParamCount: hasVarargin ? params.length - 1 : params.length };
    }

    /**
     * Compute the return layout, including `varargout`.
     */
    public static returnLayout(func: NodeFunctionDefinition, repeatingOutputName?: string): FunctionReturnLayout {
        const returnNames = this.checkedList(func.return.list, AST.isNodeFunctionReturn, 'function return');
        const names = returnNames.map((r) => (AST.isNodeIgnoredTarget(r) ? '~' : r.id));
        const hasVarargout = names.length > 0 && names[names.length - 1] === 'varargout';
        const variableOutputName = repeatingOutputName ?? (hasVarargout ? 'varargout' : undefined);
        const variableOutputIndex = typeof variableOutputName === 'undefined' ? -1 : names.indexOf(variableOutputName);
        return {
            returnNames,
            hasVarargout,
            variableOutputName,
            fixedReturnCount: variableOutputIndex >= 0 ? variableOutputIndex : returnNames.length,
            names,
        };
    }

    /**
     * Determine the minimum required positional count after trailing defaults.
     */
    public static minimumPositionalCount(positionalParams: FunctionParameter[], inputDefaults: Map<string, NodeExpr>): number {
        let minFixedParamCount = positionalParams.length;
        while (minFixedParamCount > 0) {
            const param = positionalParams[minFixedParamCount - 1];
            const name = this.parameterName(param);
            if (!name || !inputDefaults.has(name)) {
                break;
            }
            minFixedParamCount--;
        }
        return minFixedParamCount;
    }

    /**
     * Check anonymous-function input arity.
     */
    public static validateLambdaInputArity(argsLength: number, hasVarargin: boolean, fixedParamCount: number, throwEvalError: ThrowEvalError): void {
        if ((hasVarargin && argsLength < fixedParamCount) || (!hasVarargin && argsLength !== fixedParamCount)) {
            throwEvalError(`invalid number of arguments.`);
        }
    }

    /**
     * Check user-function input arity after name-value splitting and defaults.
     */
    public static validateFunctionInputArity(
        func: NodeFunctionDefinition,
        positionalLength: number,
        hasVarargin: boolean,
        positionalParamCount: number,
        minFixedParamCount: number,
        throwEvalError: ThrowEvalError,
    ): void {
        if ((hasVarargin && positionalLength < minFixedParamCount) || (!hasVarargin && (positionalLength < minFixedParamCount || positionalLength > positionalParamCount))) {
            throwEvalError(`invalid number of arguments in function ${func.id}`);
        }
    }

    /**
     * Check requested output count before entering the function body.
     */
    public static validateFunctionOutputArity(returnNames: ReturnName[], hasVarargout: boolean, requestedOutputCount: number, throwEvalError: ThrowEvalError): void {
        if (!hasVarargout && returnNames.length > 0 && requestedOutputCount > returnNames.length) {
            AST.throwErrorIfGreaterThanReturnList(returnNames.length, requestedOutputCount, throwEvalError);
        }
    }

    /**
     * Build all static call metadata needed before evaluating arguments.
     */
    public static prepareFunctionCall(
        func: NodeFunctionDefinition,
        args: CallArgumentValue[],
        requestedOutputCount: number,
        callbacks: FunctionCallPreparationCallbacks,
    ): PreparedFunctionCall {
        const inputLayout = this.inputLayout(func, callbacks.nameValueParameters(func));
        const returnLayout = this.returnLayout(func, callbacks.outputRepeatingName?.(func));
        let callArguments = callbacks.splitCallArguments(func, args);
        callArguments.rawPositionalCount = callArguments.positional.length;
        if (callbacks.expandPositionalArguments) {
            const expandedPositional = callArguments.positional.flatMap((arg) => (this.callArgumentRequestsDefault(arg) ? [arg] : callbacks.expandPositionalArguments!([arg])));
            const expandedSplit = callbacks.splitCallArguments(func, expandedPositional);
            const named = new Map(expandedSplit.named);
            for (const [name, value] of callArguments.named) {
                named.set(name, value);
            }
            callArguments = {
                positional: expandedSplit.positional,
                rawPositionalCount: callArguments.rawPositionalCount,
                named,
            };
        }
        const inputDefaults = callbacks.inputDefaults(func);
        const minFixedParamCount = this.minimumPositionalCount(inputLayout.positionalParams, inputDefaults);
        this.validateFunctionInputArity(func, callArguments.positional.length, inputLayout.hasVarargin, inputLayout.positionalParamCount, minFixedParamCount, callbacks.throwEvalError);
        this.validateFunctionOutputArity(returnLayout.returnNames, typeof returnLayout.variableOutputName !== 'undefined', requestedOutputCount, callbacks.throwEvalError);
        return { inputLayout, returnLayout, callArguments, inputDefaults, minFixedParamCount };
    }

    /**
     * Create a cell row for `varargin`.
     */
    public static vararginCell(values: EvaluatedArgumentValue[]): MultiArray<ExpressionBoundaryValue> {
        return MultiArray.firstRow(
            this.expressionArgumentValues(values, 'varargin argument', (message) => {
                throw new EvalError(message);
            }),
            true,
        );
    }

    /**
     * Create the initial `varargout` cell array.
     *
     * MATLAB permits assigning elements later. The placeholder length is at
     * least one so the variable exists even when no extra output is requested.
     */
    public static emptyVarargoutCell(requestedOutputCount: number, fixedReturnCount: number): MultiArray {
        return new MultiArray([1, Math.max(requestedOutputCount - fixedReturnCount, 1)], () => undefined, true);
    }

    /**
     * Predeclare fixed return names in the function workspace.
     *
     * An empty entry lets the return-list builder distinguish "declared but not
     * assigned" from "not a return variable" and produce MATLAB-like undefined
     * return errors.
     */
    public static initializeFixedReturnSlots(returnNames: ReturnName[], nameTable: NameTable): void {
        for (const returnName of returnNames) {
            if (!AST.isNodeIgnoredTarget(returnName) && returnName.id !== 'varargout' && !Object.prototype.hasOwnProperty.call(nameTable, returnName.id)) {
                nameTable[returnName.id] = {};
            }
        }
    }

    /**
     * Attach call-site metadata and evaluate positional arguments.
     */
    public static evaluateCallArguments(
        args: CallArgumentValue[],
        parent: NodeInput,
        evaluate: EvaluateExpression,
        throwEvalError: ThrowEvalError,
        indexOffset = 0,
        allowDefaultMarkers = false,
    ): EvaluatedArgumentValue[] {
        return args.map((arg, index) => {
            if (AST.isNodeBase(arg)) {
                arg.parent = parent;
                arg.index = indexOffset + index;
            }
            if (allowDefaultMarkers && this.callArgumentRequestsDefault(arg)) {
                return this.defaultArgumentMarker;
            }
            return this.evaluatedArgument(evaluate(arg), `argument ${indexOffset + index + 1}`, throwEvalError);
        });
    }

    /**
     * Evaluate already-split name-value arguments.
     */
    public static evaluateNameValueArguments(
        named: Map<string, CallArgumentValue>,
        parent: NodeInput,
        evaluate: EvaluateExpression,
        throwEvalError: ThrowEvalError,
    ): Map<string, ExpressionBoundaryValue> {
        const result = new Map<string, ExpressionBoundaryValue>();
        for (const [name, expression] of named) {
            if (AST.isNodeBase(expression)) {
                expression.parent = parent;
            }
            result.set(name, this.evaluatedArgument(evaluate(expression), name, throwEvalError));
        }
        return result;
    }

    /**
     * Bind anonymous-function inputs, including `varargin`.
     */
    public static bindLambdaInputs(
        params: FunctionParameter[],
        args: CallArgumentValue[],
        parent: NodeInput,
        hasVarargin: boolean,
        fixedParamCount: number,
        defineName: DefineName,
        evaluate: EvaluateExpression,
        throwEvalError: ThrowEvalError,
    ): void {
        for (let i = 0; i < fixedParamCount; i++) {
            const param = params[i];
            const value = this.requireEvaluatedArgument(this.evaluateCallArguments([args[i]], parent, evaluate, throwEvalError, i)[0], `argument ${i + 1}`, throwEvalError);
            if (this.isIdentifier(param)) {
                defineName(param.id, value);
            }
        }
        if (hasVarargin) {
            defineName('varargin', this.vararginCell(this.evaluateCallArguments(args.slice(fixedParamCount), parent, evaluate, throwEvalError, fixedParamCount)));
        }
    }

    /**
     * Bind evaluated positional arguments and default values to function inputs.
     */
    public static bindPositionalInputs(
        func: NodeFunctionDefinition,
        inputLayout: FunctionInputLayout,
        evaluatedArgs: EvaluatedArgumentValue[],
        inputDefaults: Map<string, NodeExpr>,
        defineName: DefineName,
        evaluateDefault: EvaluateDefault,
        throwEvalError: ThrowEvalError,
    ): void {
        for (let i = 0; i < inputLayout.positionalParamCount; i++) {
            const param = inputLayout.positionalParams[i];
            const paramName = this.parameterName(param);
            if (i < evaluatedArgs.length) {
                const evaluatedArg = evaluatedArgs[i];
                if (!paramName) {
                    continue;
                }
                if (this.isDefaultArgumentMarker(evaluatedArg)) {
                    const defaultValue = inputDefaults.get(paramName);
                    if (!defaultValue) {
                        throwEvalError(`invalid use of default argument marker ':' in function ${func.id}`);
                    }
                    defineName(paramName, this.evaluatedArgument(evaluateDefault(paramName, defaultValue), paramName, throwEvalError));
                } else {
                    defineName(paramName, evaluatedArg);
                }
            } else {
                if (!paramName) {
                    throwEvalError(`invalid number of arguments in function ${func.id}`);
                }
                const defaultValue = inputDefaults.get(paramName);
                if (!defaultValue) {
                    throwEvalError(`invalid number of arguments in function ${func.id}`);
                }
                defineName(paramName, this.evaluatedArgument(evaluateDefault(paramName, defaultValue), paramName, throwEvalError));
            }
        }
        if (evaluatedArgs.slice(inputLayout.positionalParamCount).some((value) => this.isDefaultArgumentMarker(value))) {
            throwEvalError(`invalid use of default argument marker ':' in function ${func.id}`);
        }
    }

    /**
     * Bind the remaining evaluated inputs to `varargin`.
     */
    public static bindVarargin(inputLayout: FunctionInputLayout, evaluatedArgs: EvaluatedArgumentValue[], defineName: DefineName): void {
        if (inputLayout.hasVarargin) {
            defineName('varargin', this.vararginCell(evaluatedArgs.slice(inputLayout.positionalParamCount)));
        }
    }

    /**
     * Initialize `varargout` in the function workspace.
     */
    public static bindVarargout(returnLayout: FunctionReturnLayout, requestedOutputCount: number, defineName: DefineName): void {
        if (returnLayout.variableOutputName) {
            defineName(returnLayout.variableOutputName, this.emptyVarargoutCell(requestedOutputCount, returnLayout.fixedReturnCount));
        }
    }

    private static variableReturnKey(returnLayout: FunctionReturnLayout, index: number): string {
        return `${returnLayout.variableOutputName ?? 'varargout'}${index}`;
    }

    /**
     * Runtime placeholder returned when a function declares an ignored output.
     *
     * MATLAB/Octave permit `~` in a function output list. The function body has
     * no variable to assign for that position, but callers that request the
     * corresponding output still receive an ordinary empty array.
     */
    private static ignoredReturnValue(): MultiArray {
        return MultiArray.emptyArray();
    }

    /**
     * Create the lazy return list read by assignment and display code.
     *
     * Values are pulled from the function workspace only when requested. This is
     * important for MATLAB/Octave compatibility: requesting one output should
     * not force validation of later outputs, while requesting an unassigned
     * output must raise an error.
     */
    public static createReturnList(returnLayout: FunctionReturnLayout, nameTable: NameTable, throwEvalError: ThrowEvalError, outputMask: boolean[] = []): NodeExpr {
        const { fixedReturnCount, names, variableOutputName } = returnLayout;
        const hasVariableOutput = typeof variableOutputName !== 'undefined';
        const outputIsRequested = (index: number): boolean => outputMask[index] ?? true;
        if (names.length === 0) {
            return AST.nodeVoid();
        }
        return AST.nodeReturnList(
            (evaluated, index) => {
                if (hasVariableOutput) {
                    if (index < fixedReturnCount) {
                        if (names[index] === '~') {
                            return this.ignoredReturnValue();
                        }
                        const value = evaluated[names[index]];
                        if (value === undefined) {
                            throwEvalError(`Undefined return value '${names[index]}'`);
                        }
                        return value;
                    }
                    const varargoutIndex = index - fixedReturnCount;
                    const value = evaluated[this.variableReturnKey(returnLayout, varargoutIndex)];
                    if (typeof value === 'undefined') {
                        AST.throwErrorIfGreaterThanReturnList(index, index + 1, throwEvalError);
                    }
                    return value;
                }
                const key = names[index];
                if (key === '~') {
                    return this.ignoredReturnValue();
                }
                const value = evaluated[key];
                if (value === undefined) {
                    throwEvalError(`Undefined return value '${key}'`);
                }
                return value;
            },
            (length: number) => {
                if (!hasVariableOutput && length > names.length) {
                    AST.throwErrorIfGreaterThanReturnList(names.length, length, throwEvalError);
                }
                const out: ReturnHandlerResult = { length };
                if (hasVariableOutput) {
                    for (let i = 0; i < Math.min(length, fixedReturnCount); i++) {
                        if (!outputIsRequested(i)) {
                            continue;
                        }
                        const name = names[i];
                        if (name === '~') {
                            continue;
                        }
                        const entry = nameTable[name];
                        if (!entry || !entry.node) {
                            throwEvalError(`Undefined return variable '${name}'`);
                        }
                        out[name] = this.returnExpression(entry.node, name, throwEvalError);
                    }
                    const entry = nameTable[variableOutputName];
                    if (!entry || !(entry.node instanceof MultiArray) || !entry.node.isCell) {
                        throwEvalError(`Undefined return variable '${variableOutputName}'`);
                    }
                    const values = MultiArray.linearize(entry.node);
                    for (let i = fixedReturnCount; i < length; i++) {
                        if (!outputIsRequested(i)) {
                            continue;
                        }
                        const value = values[i - fixedReturnCount];
                        if (typeof value === 'undefined') {
                            AST.throwErrorIfGreaterThanReturnList(i, i + 1, throwEvalError);
                        }
                        out[this.variableReturnKey(returnLayout, i - fixedReturnCount)] = this.returnExpression(value, `${variableOutputName}{${i - fixedReturnCount + 1}}`, throwEvalError);
                    }
                    return out;
                }
                for (let i = 0; i < length; i++) {
                    if (!outputIsRequested(i)) {
                        continue;
                    }
                    const name = names[i];
                    if (name === '~') {
                        continue;
                    }
                    const entry = nameTable[name];
                    if (!entry || !entry.node) {
                        throwEvalError(`Undefined return variable '${name}'`);
                    }
                    out[name] = this.returnExpression(entry.node, name, throwEvalError);
                }
                return out;
            },
        );
    }
}

export type { CallArgumentValue, FunctionInputLayout, FunctionReturnLayout, FunctionCallArguments, PreparedFunctionCall, FunctionParameter };
export { FunctionCall };
export default { FunctionCall };
