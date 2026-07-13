import type { NameEntry, NodeBuiltInFunction, NodeFunctionDefinition, NodeInput } from './AST';
import { CharString, ClassDefinition, Complex, Structure } from './AST';
import { FunctionHandle } from './FunctionHandle';

type LookupFunction = NodeBuiltInFunction | NodeFunctionDefinition;
type ResolveFunction = (name: string) => LookupFunction | undefined;
type AliasNameFunction = (name: string) => string;
type UnparseHandle = (handle: FunctionHandle) => string;
type ThrowEvalError = (message: string) => never;
type EvaluateAnonymousHandle = (source: string) => NodeInput;

/**
 * Implements function/handle lookup and introspection helpers.
 *
 * Browser-hosted MathJSLab cannot fully mirror MATLAB/Octave file-system
 * lookup, so this module deliberately focuses on in-memory entities registered
 * in scopes: variables, user-defined functions, built-ins, function handles,
 * and the small runtime class-name set.
 */
class FunctionLookup {
    private static readonly runtimeClassNames = new Set([
        'double',
        'single',
        'logical',
        'char',
        'cell',
        'struct',
        'function_handle',
        'event.listener',
        'event.EventData',
        'event.PropertyEvent',
        'meta.class',
        'meta.property',
        'meta.method',
        'meta.event',
        'meta.EnumerationMember',
    ]);

    /**
     * Compute the numeric result of `exist(name, kind)`.
     */
    public static existCode(name: string, kind: string | undefined, variable: NameEntry | undefined, func: LookupFunction | undefined, classDefined = false): number {
        const normalizedKind = kind?.toLowerCase();
        const variableCode = variable && typeof variable.node !== 'undefined' && !ClassDefinition.isInstanceOf(variable.node) ? 1 : 0;
        const functionCode = func?.type === 'FCNDEF' ? 2 : func?.type === 'BUILTIN' ? 5 : 0;
        const classCode = classDefined || (variable && ClassDefinition.isInstanceOf(variable.node)) || this.isRuntimeClassName(name) ? 8 : 0;
        switch (normalizedKind) {
            case undefined:
                return variableCode || functionCode || classCode;
            case 'var':
            case 'variable':
                return variableCode;
            case 'builtin':
                return functionCode === 5 ? 5 : 0;
            case 'file':
            case 'function':
                return functionCode === 2 ? 2 : functionCode === 5 ? 5 : 0;
            case 'class':
                return classCode;
            default:
                return 0;
        }
    }

    /**
     * Produce the user-facing result for `which`.
     */
    public static whichResult(
        name: string,
        variable: NameEntry | undefined,
        func: LookupFunction | undefined,
        handle: FunctionHandle | undefined,
        unparseHandle: UnparseHandle,
        classDefined = false,
    ): CharString {
        if (handle && !handle.id) {
            return new CharString(`${unparseHandle(handle).trim()} is an anonymous function`);
        }
        if (!handle && variable && typeof variable.node !== 'undefined' && !ClassDefinition.isInstanceOf(variable.node)) {
            return new CharString(`${name} is a variable`);
        }
        if (func?.type === 'FCNDEF') {
            return new CharString(`${name} is a ${func.attributes?.nested ? 'nested' : 'user-defined'} function`);
        }
        if (func?.type === 'BUILTIN') {
            return new CharString(`${func.id} is a built-in function`);
        }
        if (classDefined || (variable && ClassDefinition.isInstanceOf(variable.node)) || this.isRuntimeClassName(name)) {
            return new CharString(`${name} is a class`);
        }
        return new CharString(`${name} not found`);
    }

    /**
     * Convert a function handle to its string representation.
     */
    public static func2str(handle: FunctionHandle, unparseHandle: UnparseHandle): CharString {
        return new CharString(handle.id ?? unparseHandle(handle).trim());
    }

    /**
     * Convert text to a named or anonymous function handle.
     *
     * Anonymous handles are parsed/evaluated through the supplied callback so
     * the interpreter can reuse its normal parser and closure creation logic.
     */
    public static str2func(sourceText: string, evaluateAnonymousHandle: EvaluateAnonymousHandle, throwEvalError: ThrowEvalError): FunctionHandle {
        const source = sourceText.trim();
        if (!source.startsWith('@')) {
            return FunctionHandle.create(source);
        }
        const handle = evaluateAnonymousHandle(source);
        if (!FunctionHandle.isInstanceOf(handle)) {
            throwEvalError('str2func: invalid function handle string.');
        }
        return handle;
    }

    /**
     * Build the structure returned by `functions(handle)`.
     */
    public static functionsInfo(handle: FunctionHandle, aliasNameFunction: AliasNameFunction, resolveFunction: ResolveFunction, unparseHandle: UnparseHandle): Structure {
        let type = 'anonymous';
        if (handle.id) {
            const canonical = aliasNameFunction(handle.id);
            const func = handle.closure?.resolveFunction(canonical) ?? resolveFunction(handle.id);
            type = func?.type === 'FCNDEF' && func.attributes?.nested ? 'nested' : 'simple';
        }
        return new Structure({
            function: this.func2str(handle, unparseHandle),
            type: new CharString(type),
            workspace: handle.closure ? Complex.true() : Complex.false(),
        });
    }

    /**
     * Resolve the function targeted by a named handle.
     *
     * Handle closures are consulted first so local/nested handles remain bound
     * to their lexical function environment.
     */
    public static resolveHandleFunction(handle: FunctionHandle, name: string, aliasNameFunction: AliasNameFunction, resolveFunction: ResolveFunction): LookupFunction | undefined {
        const canonical = aliasNameFunction(name);
        return handle.closure?.resolveFunction(canonical) ?? resolveFunction(name);
    }

    /**
     * Runtime class names currently recognized by `exist(name, 'class')`.
     */
    public static isRuntimeClassName(name: string): boolean {
        return this.runtimeClassNames.has(name);
    }
}

export type { LookupFunction };
export { FunctionLookup };
export default { FunctionLookup };
