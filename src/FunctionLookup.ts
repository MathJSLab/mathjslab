import type { NameEntry, NodeBuiltInFunction, NodeFunctionDefinition, NodeInput } from './AST';
import { CharString } from './CharString';
import { ClassDefinition } from './ClassDefinition';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import type { SymbolResolution } from './Context';
import { FunctionHandle } from './FunctionHandle';

/** Function-like AST node accepted by lookup helpers. */
type LookupFunction = NodeBuiltInFunction | NodeFunctionDefinition;
/** Callback that resolves a function name in the current interpreter context. */
type ResolveFunction = (name: string) => LookupFunction | undefined;
/** Callback that maps aliases such as operators or built-in shorthands to canonical names. */
type AliasNameFunction = (name: string) => string;
/** Callback that renders a function handle with interpreter-specific unparsing rules. */
type UnparseHandle = (handle: FunctionHandle) => string;
/** Interpreter evaluation-error callback used by pure lookup helpers. */
type ThrowEvalError = (message: string) => never;
/** Callback used to parse/evaluate anonymous handles supplied to `str2func`. */
type EvaluateAnonymousHandle = (source: string) => NodeInput;
/** Callback that builds the `functions(handle).workspace` cell array. */
type WorkspaceInfo = (handle: FunctionHandle) => NodeInput;
/** Minimal metadata for an imported static class method. */
type StaticMethodInfo = { className: string; methodName: string; sourceName?: string };
/** Callback that resolves a named handle as an imported static class method. */
type ResolveStaticMethod = (name: string, handle?: FunctionHandle) => StaticMethodInfo | undefined;

/**
 * Implements function/handle lookup and introspection helpers.
 *
 * Browser-hosted MathJSLab cannot fully mirror MATLAB/Octave file-system
 * lookup, so this module focuses on symbols the runtime can know
 * synchronously: variables, user-defined functions, built-ins, function
 * handles, runtime class names, and host-provided script/class sources exposed
 * through the virtual `.m` resolver.
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
        'event.proplistener',
        'event.EventData',
        'event.PropertyEvent',
        'handle',
        'meta.class',
        'meta.property',
        'meta.method',
        'meta.event',
        'meta.EnumerationMember',
        'matlab.mixin.SetGet',
        'matlab.mixin.SetGetExactNames',
    ]);

    /**
     * Compute the numeric result of `exist(name, kind)`.
     *
     * @param name Queried identifier.
     * @param kind Optional MATLAB/Octave `exist` kind selector.
     * @param variable Resolved variable entry, when present.
     * @param func Resolved function entry, when present.
     * @param classDefined Whether an external/source-provider class with this name is known.
     * @param scriptDefined Whether a host-provided script source with this name is known.
     * @returns MATLAB-like `exist` code for in-memory symbols supported by the runtime.
     */
    public static existCode(name: string, kind: string | undefined, variable: NameEntry | undefined, func: LookupFunction | undefined, classDefined = false, scriptDefined = false): number {
        const normalizedKind = kind?.trim().toLowerCase();
        const variableCode = variable && typeof variable.node !== 'undefined' && !ClassDefinition.isInstanceOf(variable.node) ? 1 : 0;
        const functionCode = func?.type === 'FCNDEF' ? 2 : func?.type === 'BUILTIN' ? 5 : 0;
        const classCode = classDefined || (variable && ClassDefinition.isInstanceOf(variable.node)) || this.isRuntimeClassName(name) ? 8 : 0;
        const scriptCode = scriptDefined ? 2 : 0;
        switch (normalizedKind) {
            case undefined:
                return variableCode || functionCode || classCode || scriptCode;
            case 'var':
            case 'variable':
                return variableCode;
            case 'builtin':
                return functionCode === 5 ? 5 : 0;
            case 'file':
                return functionCode === 2 ? 2 : functionCode === 5 ? 5 : scriptCode;
            case 'function':
                return functionCode === 2 ? 2 : functionCode === 5 ? 5 : 0;
            case 'class':
                return classCode;
            default:
                return 0;
        }
    }

    /**
     * Compute `exist` from a structured symbol-resolution result.
     *
     * @param name Queried identifier.
     * @param kind Optional MATLAB/Octave `exist` kind selector.
     * @param resolved Structured symbol result, when present.
     * @returns MATLAB-like `exist` code.
     */
    public static existCodeFromResolution(name: string, kind: string | undefined, resolved: SymbolResolution | undefined): number {
        const variable = resolved?.kind === 'variable' ? resolved.entry : undefined;
        const func = resolved?.kind === 'function' || resolved?.kind === 'builtin' ? resolved.functionDefinition : undefined;
        const classDefined = resolved?.kind === 'class';
        const scriptDefined = resolved?.kind === 'script';
        const sourceFunctionDefined = resolved?.kind === 'function' && !resolved.functionDefinition;
        const sourceClassDefined = resolved?.kind === 'class' && !resolved.classDefinition;
        if (resolved?.kind === 'directory') {
            const normalizedKind = kind?.trim().toLowerCase();
            switch (normalizedKind) {
                case undefined:
                case 'dir':
                case 'file':
                    return 7;
                default:
                    return 0;
            }
        }
        if (sourceFunctionDefined) {
            const normalizedKind = kind?.trim().toLowerCase();
            switch (normalizedKind) {
                case undefined:
                case 'file':
                case 'function':
                    return 2;
                default:
                    return 0;
            }
        }
        if (sourceClassDefined) {
            const normalizedKind = kind?.trim().toLowerCase();
            switch (normalizedKind) {
                case undefined:
                case 'class':
                    return 8;
                case 'file':
                    return 2;
                default:
                    return 0;
            }
        }
        return this.existCode(name, kind, variable, func, classDefined, scriptDefined);
    }

    /**
     * Produce the user-facing result for `which`.
     *
     * @param name Queried identifier.
     * @param variable Resolved variable entry, when present.
     * @param func Resolved function entry, when present.
     * @param handle Resolved function-handle variable, when present.
     * @param unparseHandle Callback used to render anonymous handles.
     * @param classDefined Whether an external/source-provider class with this name is known.
     * @param scriptDefined Whether a host-provided script source with this name is known.
     * @returns Text value describing what the name resolves to.
     */
    public static whichResult(
        name: string,
        variable: NameEntry | undefined,
        func: LookupFunction | undefined,
        handle: FunctionHandle | undefined,
        unparseHandle: UnparseHandle,
        classDefined = false,
        scriptDefined = false,
        staticMethod?: StaticMethodInfo,
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
        if (staticMethod) {
            return new CharString(`${staticMethod.className}.${staticMethod.methodName} is a static method`);
        }
        if (classDefined || (variable && ClassDefinition.isInstanceOf(variable.node)) || this.isRuntimeClassName(name)) {
            return new CharString(`${name} is a class`);
        }
        if (scriptDefined) {
            return new CharString(`${name} is a script`);
        }
        return new CharString(`${name} not found`);
    }

    /**
     * Produce `which` text from a structured symbol-resolution result.
     *
     * @param name Queried identifier.
     * @param resolved Structured symbol result, when present.
     * @param handle Resolved function-handle variable, when present.
     * @param unparseHandle Callback used to render anonymous handles.
     * @returns Text value describing what the name resolves to.
     */
    public static whichResultFromResolution(
        name: string,
        resolved: SymbolResolution | undefined,
        handle: FunctionHandle | undefined,
        unparseHandle: UnparseHandle,
        staticMethod?: StaticMethodInfo,
    ): CharString {
        if (resolved?.kind === 'function' && !resolved.functionDefinition) {
            return new CharString(`${name} is a user-defined function`);
        }
        if (resolved?.kind === 'directory') {
            return new CharString(`${name} is a folder`);
        }
        const variable = resolved?.kind === 'variable' ? resolved.entry : undefined;
        const func = resolved?.kind === 'function' || resolved?.kind === 'builtin' ? resolved.functionDefinition : undefined;
        return this.whichResult(name, variable, func, handle, unparseHandle, resolved?.kind === 'class', resolved?.kind === 'script', staticMethod);
    }

    /**
     * Convert a function handle to its string representation.
     *
     * @param handle Function handle to render.
     * @param unparseHandle Callback used for anonymous handles.
     * @returns Named handle id or anonymous handle source text.
     */
    public static func2str(handle: FunctionHandle, unparseHandle: UnparseHandle): CharString {
        return new CharString(handle.id ?? unparseHandle(handle).trim());
    }

    /**
     * Convert text to a named or anonymous function handle.
     *
     * Anonymous handles are parsed/evaluated through the supplied callback so
     * the interpreter can reuse its normal parser and closure creation logic.
     *
     * @param sourceText Text supplied to `str2func`.
     * @param evaluateAnonymousHandle Callback used to evaluate anonymous handle text.
     * @param throwEvalError Error callback for invalid handle text.
     * @returns Runtime function handle.
     */
    public static str2func(sourceText: string, evaluateAnonymousHandle: EvaluateAnonymousHandle, throwEvalError: ThrowEvalError): FunctionHandle {
        const source = sourceText.trim();
        if (source.length === 0) {
            throwEvalError('str2func: function name cannot be empty.');
        }
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
     *
     * @param handle Function handle to inspect.
     * @param aliasNameFunction Callback that maps aliases to canonical names.
     * @param resolveFunction Callback that resolves functions in the current context.
     * @param unparseHandle Callback used for anonymous handles.
     * @param workspaceInfo Callback that returns captured workspace metadata.
     * @returns MATLAB-like introspection structure.
     */
    public static functionsInfo(
        handle: FunctionHandle,
        aliasNameFunction: AliasNameFunction,
        resolveFunction: ResolveFunction,
        unparseHandle: UnparseHandle,
        workspaceInfo: WorkspaceInfo = () => MultiArray.emptyArray(true),
        resolveStaticMethod: ResolveStaticMethod = () => undefined,
    ): Structure {
        let type = 'anonymous';
        let file = handle.sourceName ?? '';
        if (handle.id) {
            const canonical = aliasNameFunction(handle.id);
            const func = (handle.closure?.resolveFunction(canonical) as LookupFunction | undefined) ?? resolveFunction(handle.id);
            if (func?.type === 'FCNDEF') {
                type = func.attributes?.nested ? 'nested' : 'simple';
                file = func.sourceName ?? '';
            } else {
                const staticMethod = resolveStaticMethod(handle.id, handle);
                type = 'simple';
                file = staticMethod?.sourceName ?? file;
            }
        }
        const workspace = type === 'simple' ? MultiArray.emptyArray(true) : workspaceInfo(handle);
        return new Structure({
            function: this.func2str(handle, unparseHandle),
            type: new CharString(type),
            file: new CharString(file),
            workspace,
        });
    }

    /**
     * Resolve the function targeted by a named handle.
     *
     * Handle closures are consulted first so local/nested handles remain bound
     * to their lexical function environment.
     *
     * @param handle Function handle being invoked or inspected.
     * @param name Target name stored in the handle.
     * @param aliasNameFunction Callback that maps aliases to canonical names.
     * @param resolveFunction Callback that resolves functions in the active context.
     * @returns Resolved built-in/user function, if present.
     */
    public static resolveHandleFunction(handle: FunctionHandle, name: string, aliasNameFunction: AliasNameFunction, resolveFunction: ResolveFunction): LookupFunction | undefined {
        const canonical = aliasNameFunction(name);
        return (handle.closure?.resolveFunction(canonical) as LookupFunction | undefined) ?? resolveFunction(name);
    }

    /**
     * Runtime class names currently recognized by `exist(name, 'class')`.
     *
     * @param name Class name to test.
     * @returns `true` for built-in runtime class names.
     */
    public static isRuntimeClassName(name: string): boolean {
        return this.runtimeClassNames.has(name);
    }
}

export type { LookupFunction, StaticMethodInfo };
export { FunctionLookup };
export default { FunctionLookup };
