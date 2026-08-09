import type { ExpressionBoundaryValue, FunctionTable, NameEntry, NameTable, NodeBuiltInFunction, NodeFunctionDefinition, NodeInput, UndefinedReferenceTable } from './AST';

/**
 * Package/class import table for one lexical scope.
 */
type ImportTable = {
    /** Explicit simple-name aliases, e.g. `Point -> [pkg.Point]`. */
    explicit: Record<string, string[]>;
    /** Wildcard package prefixes, e.g. `pkg` for `import pkg.*`. */
    wildcard: string[];
};

/**
 * Represents a lexical workspace/scope.
 *
 * A scope stores variable bindings, function bindings, and forward-reference
 * bookkeeping. The parent chain models MATLAB/Octave-like lexical lookup for
 * ordinary functions, nested functions, anonymous-function closures, `eval`,
 * `evalin`, `assignin`, `global`, and `persistent`.
 *
 * Two flags tune lookup/assignment for special function-workspace cases:
 *
 * - `resolveParentNames`: when false, variable lookup stops at this scope.
 *   This is used for captured snapshots where later parent changes must not
 *   leak into a closure.
 * - `assignExistingParentNames`: when true, assignments update an existing
 *   parent binding instead of always creating a local name. Nested functions use
 *   this to emulate MATLAB/Octave shared workspaces.
 * - `rejectDynamicNameCreation`: when true, dynamic evaluation paths may only
 *   create names known from the function text. This models MATLAB static
 *   workspaces for nested/anonymous functions without affecting normal
 *   statement execution.
 */
class Scope {
    /** Real workspace that should receive declarations issued through an overlay scope. */
    public globalDeclarationTarget?: Scope;

    /**
     * Use `Scope.create` so scope tables are always prototype-less maps.
     */
    private constructor(
        public parent?: Scope,
        public nameTable: NameTable = Object.create(null),
        public functionTable: FunctionTable = Object.create(null),
        public undefinedReferenceTable: UndefinedReferenceTable = Object.create(null),
        public importTable: ImportTable = { explicit: Object.create(null), wildcard: [] },
        public resolveParentNames: boolean = true,
        public assignExistingParentNames: boolean = false,
        public rejectDynamicNameCreation: boolean = false,
        public staticWorkspaceNameSet?: Set<string>,
    ) {}

    /**
     * Create a fresh scope with empty name/function/reference tables.
     *
     * @param parent Optional parent scope for lexical lookup.
     * @param resolveParentNames Whether variable lookup may continue into the parent chain.
     * @returns New scope with prototype-less tables.
     */
    public static readonly create = (parent?: Scope, resolveParentNames: boolean = true) =>
        new Scope(parent, Object.create(null), Object.create(null), Object.create(null), { explicit: Object.create(null), wildcard: [] }, resolveParentNames);

    /**
     * Define or replace a variable in the current scope only.
     *
     * Existing entries are mutated in place so global aliases, persistent
     * bindings, and UI references that point at the entry object continue to see
     * updates.
     *
     * @param name Variable name.
     * @param node Value node to bind.
     * @param undefinedReference Optional unresolved-reference marker.
     * @returns The created or updated name-table entry.
     */
    public defineName(name: string, node: NodeInput, undefinedReference?: string): NameEntry {
        const entry = this.nameTable[name];
        if (entry) {
            entry.node = node;
            if (undefinedReference) {
                entry.undefinedReference = undefinedReference;
            } else {
                delete entry.undefinedReference;
            }
            return entry;
        }
        if (!this.canCreateLocalName(name)) {
            throw new Error(`Attempt to add variable '${name}' to a static workspace.`);
        }
        return undefinedReference ? (this.nameTable[name] = { undefinedReference, node }) : (this.nameTable[name] = { node });
    }

    /**
     * Assign a value using the current scope's assignment policy.
     *
     * Ordinary scopes define locally. Nested-function scopes can opt into
     * parent assignment through `assignExistingParentNames`, which preserves
     * MATLAB/Octave shared-variable behavior.
     *
     * @param name Variable name.
     * @param node Value node to assign.
     * @param undefinedReference Optional unresolved-reference marker.
     * @returns The created or updated name-table entry.
     */
    public assignName(name: string, node: NodeInput, undefinedReference?: string): NameEntry {
        if (this.assignExistingParentNames && !this.hasLocalName(name) && this.parent) {
            const parentEntry = this.parent.resolveName(name);
            if (parentEntry) {
                parentEntry.node = node;
                if (undefinedReference) {
                    parentEntry.undefinedReference = undefinedReference;
                } else {
                    delete parentEntry.undefinedReference;
                }
                return parentEntry;
            }
        }
        if (!this.canCreateLocalName(name)) {
            throw new Error(`Attempt to add variable '${name}' to a static workspace.`);
        }
        return this.defineName(name, node, undefinedReference);
    }

    /**
     * Check whether an assignment may introduce a local name in this scope.
     *
     * Normal code paths leave `rejectDynamicNameCreation` disabled. Dynamic
     * execution (`eval`, scripts sourced from a static workspace, and
     * `assignin`) enables it temporarily so only textually known names may be
     * introduced.
     *
     * @param name Candidate local name.
     * @returns `true` when the name can be created locally.
     */
    public canCreateLocalName(name: string): boolean {
        return !this.rejectDynamicNameCreation || this.hasLocalName(name) || Boolean(this.staticWorkspaceNameSet?.has(name));
    }

    /**
     * Add one textually declared variable name to the static-workspace allowlist.
     *
     * @param name Variable name known from parsed function text.
     */
    public allowStaticWorkspaceName(name: string): void {
        (this.staticWorkspaceNameSet ??= new Set()).add(name);
    }

    /**
     * Add several textually declared variable names to the static-workspace allowlist.
     *
     * @param names Variable names known from parsed function text.
     */
    public allowStaticWorkspaceNames(names: Iterable<string>): void {
        for (const name of names) {
            this.allowStaticWorkspaceName(name);
        }
    }

    /**
     * Define several local variables at once.
     *
     * @param table Name/value table to merge into the local scope.
     */
    public defineNameTable(table: Record<string, NodeInput>): void {
        for (const [name, node] of Object.entries(table)) {
            this.nameTable[name] = { node };
        }
    }

    /**
     * Resolve a variable through this scope and, when allowed, its parents.
     *
     * @param name Variable name.
     * @returns Matching entry, if found.
     */
    public resolveName(name: string): NameEntry | undefined {
        const entry = this.nameTable[name];
        return entry ? entry : this.resolveParentNames && this.parent ? this.parent.resolveName(name) : undefined;
    }

    /**
     * Check whether a name is defined directly in this scope.
     *
     * @param name Variable name.
     * @returns `true` when the name exists locally.
     */
    public hasLocalName(name: string): boolean {
        return name in this.nameTable;
    }

    /**
     * Remove a local variable binding.
     *
     * @param name Variable name to remove.
     */
    public removeName(name: string): void {
        delete this.nameTable[name];
    }

    /**
     * Remove a variable binding from this scope and all parents.
     *
     * @param name Variable name to clear.
     */
    public clearName(name: string): void {
        let scope: Scope | undefined = this;
        while (scope) {
            delete scope.nameTable[name];
            scope = scope.parent;
        }
    }

    /**
     * Define or replace a function in the current scope only.
     *
     * @param name Function name.
     * @param func Function definition node.
     * @returns Stored function definition.
     */
    public defineFunction(name: string, func: NodeFunctionDefinition): NodeFunctionDefinition {
        return (this.functionTable[name] = func);
    }

    /**
     * Merge a function table into this scope.
     *
     * @param table Function table to merge.
     */
    public defineFunctionTable(table: FunctionTable): void {
        Object.assign(this.functionTable, table);
    }

    /**
     * Resolve a function through the lexical function table chain.
     *
     * Function lookup intentionally remains parent-aware even when
     * `resolveParentNames` is false; captured scopes still need live fallback
     * for forward-referenced local/nested functions.
     *
     * @param name Function name.
     * @returns Matching user or built-in function node, if found.
     */
    public resolveFunction(name: string): NodeFunctionDefinition | NodeBuiltInFunction | undefined {
        const entry = this.functionTable[name];
        return entry ? entry : this.parent ? this.parent.resolveFunction(name) : undefined;
    }

    /**
     * Check whether a function is defined directly in this scope.
     *
     * @param name Function name.
     * @returns `true` when the function exists locally.
     */
    public hasLocalFunction(name: string): boolean {
        return name in this.functionTable;
    }

    /**
     * Remove a local function binding.
     *
     * @param name Function name to remove.
     */
    public removeFunction(name: string): void {
        delete this.functionTable[name];
    }

    /**
     * Remove a function binding from this scope and all parents.
     *
     * @param name Function name to clear.
     */
    public clearFunction(name: string): void {
        let scope: Scope | undefined = this;
        while (scope) {
            delete scope.functionTable[name];
            scope = scope.parent;
        }
    }

    /**
     * Bind formal parameter names to already evaluated argument nodes.
     *
     * @param names Formal parameter names.
     * @param args Evaluated argument nodes.
     */
    public bindParameters(names: string[], args: ExpressionBoundaryValue[]): void {
        for (let i = 0; i < names.length; i++) {
            this.defineName(names[i], args[i]);
        }
    }

    /**
     * Bind formal parameters after checking exact arity.
     *
     * This low-level helper predates the richer function-call pipeline and is
     * kept for focused tests and simple call paths.
     *
     * @param names Formal parameter names.
     * @param args Evaluated argument nodes.
     * @throws Error when the list lengths differ.
     */
    public bindParametersChecked(names: string[], args: ExpressionBoundaryValue[]): void {
        if (names.length !== args.length) {
            throw new Error(`Arity mismatch: expected ${names.length} argument(s), got ${args.length}`);
        }
        this.bindParameters(names, args);
    }

    /**
     * Record that `name` depends on an unresolved identifier.
     *
     * Forward references are stored per scope so assigning a missing name can
     * later trigger re-resolution without confusing unrelated workspaces.
     *
     * @param name Name that depends on an unresolved reference.
     * @param undefinedReference Missing identifier name.
     * @returns Mutable set of unresolved references for `name`.
     */
    public defineUndefinedReference(name: string, undefinedReference: string): Set<string> {
        const entry = this.resolveUndefinedReference(name);
        if (entry) {
            entry.add(undefinedReference);
            return entry;
        }
        return (this.undefinedReferenceTable[name] = new Set([undefinedReference]));
    }

    /**
     * Resolve unresolved-reference metadata through the parent chain.
     *
     * @param name Name to inspect.
     * @returns Set of unresolved references, if any.
     */
    public resolveUndefinedReference(name: string): Set<string> | undefined {
        const entry = this.undefinedReferenceTable[name];
        return entry ? entry : this.parent ? this.parent.resolveUndefinedReference(name) : undefined;
    }

    /**
     * Remove a local unresolved-reference entry.
     *
     * @param name Name to remove from the local unresolved-reference table.
     */
    public removeUndefinedReference(name: string): void {
        delete this.undefinedReferenceTable[name];
    }

    /**
     * Remove unresolved-reference metadata from this scope and all parents.
     *
     * @param name Name to clear from all reachable unresolved-reference tables.
     */
    public clearUndefinedReference(name: string): void {
        let scope: Scope | undefined = this;
        while (scope) {
            delete scope.undefinedReferenceTable[name];
            scope = scope.parent;
        }
    }

    /**
     * Register one MATLAB-style package/class import in the current scope.
     *
     * @param qualifiedName Fully qualified class name or wildcard package import.
     */
    public defineImport(qualifiedName: string): void {
        if (qualifiedName.endsWith('.*')) {
            const prefix = qualifiedName.slice(0, -2);
            if (prefix && !this.importTable.wildcard.includes(prefix)) {
                this.importTable.wildcard.push(prefix);
            }
            return;
        }
        const simpleName = qualifiedName.split('.').pop() ?? qualifiedName;
        if (simpleName) {
            const imports = (this.importTable.explicit[simpleName] ??= []);
            if (!imports.includes(qualifiedName)) {
                imports.push(qualifiedName);
            }
        }
    }

    /**
     * Remove all imports declared directly in this scope.
     *
     * Parent imports remain visible through the lexical chain, matching the
     * same local-only behavior used by ordinary name/function tables.
     */
    public clearImports(): void {
        this.importTable.explicit = Object.create(null);
        this.importTable.wildcard = [];
    }

    /**
     * Create a detached copy of imports declared directly in this scope.
     *
     * @returns Copy suitable for later restoration.
     */
    public importSnapshot(): ImportTable {
        return { explicit: Scope.cloneExplicitImports(this.importTable.explicit), wildcard: this.importTable.wildcard.slice() };
    }

    /**
     * Replace imports declared directly in this scope.
     *
     * Parent imports are not touched, preserving lexical import visibility.
     *
     * @param importTable Snapshot produced by `importSnapshot`.
     */
    public restoreImports(importTable: ImportTable): void {
        this.importTable = {
            explicit: Scope.cloneExplicitImports(importTable.explicit),
            wildcard: importTable.wildcard.slice(),
        };
    }

    /**
     * Return the currently visible import declarations.
     *
     * Imports are reported from the innermost scope to outer scopes, with
     * explicit imports before wildcard package imports in each scope. Duplicate
     * entries are suppressed while preserving first visibility.
     *
     * @returns Fully qualified imports visible from this scope.
     */
    public importList(): string[] {
        const result: string[] = [];
        const seen = new Set<string>();
        let scope: Scope | undefined = this;
        while (scope) {
            for (const imports of Object.values(scope.importTable.explicit)) {
                for (const qualifiedName of imports) {
                    if (!seen.has(qualifiedName)) {
                        seen.add(qualifiedName);
                        result.push(qualifiedName);
                    }
                }
            }
            for (const prefix of scope.importTable.wildcard) {
                const qualifiedName = `${prefix}.*`;
                if (!seen.has(qualifiedName)) {
                    seen.add(qualifiedName);
                    result.push(qualifiedName);
                }
            }
            scope = scope.parent;
        }
        return result;
    }

    /**
     * Return possible fully qualified names imported for a simple name.
     *
     * Local imports take precedence over parent imports. Wildcard imports are
     * returned from innermost to outermost scope and preserve source order.
     *
     * @param name Simple class or function name.
     * @returns Candidate fully qualified imported names.
     */
    public importedNameCandidates(name: string): string[] {
        const result: string[] = [];
        let scope: Scope | undefined = this;
        while (scope) {
            const explicit = scope.importTable.explicit[name];
            if (explicit?.length) {
                result.push(...explicit);
                break;
            }
            for (const prefix of scope.importTable.wildcard) {
                result.push(`${prefix}.${name}`);
            }
            scope = scope.parent;
        }
        return result;
    }

    /**
     * Deep-copy the visible variable/function environment into a detached chain.
     *
     * Anonymous functions use snapshots so captured variables keep the value
     * they had when the handle was created. Function tables and unresolved
     * reference lists are also copied so later forward-reference resolution
     * remains deterministic for the captured environment.
     *
     * @param copyNode Callback used to copy bound AST/runtime values.
     * @returns Detached scope chain.
     */
    public snapshot(copyNode: (node: NodeInput) => NodeInput): Scope {
        const parent = this.parent ? this.parent.snapshot(copyNode) : undefined;
        const scope = Scope.create(parent);
        for (const [name, entry] of Object.entries(this.nameTable)) {
            scope.nameTable[name] = {
                ...entry,
                node: typeof entry.node !== 'undefined' ? copyNode(entry.node) : entry.node,
            };
        }
        scope.functionTable = { ...this.functionTable };
        scope.undefinedReferenceTable = Object.create(null);
        for (const [name, references] of Object.entries(this.undefinedReferenceTable)) {
            scope.undefinedReferenceTable[name] = new Set(references);
        }
        scope.importTable.explicit = Scope.cloneExplicitImports(this.importTable.explicit);
        scope.importTable.wildcard = [...this.importTable.wildcard];
        scope.assignExistingParentNames = this.assignExistingParentNames;
        scope.rejectDynamicNameCreation = this.rejectDynamicNameCreation;
        scope.staticWorkspaceNameSet = this.staticWorkspaceNameSet ? new Set(this.staticWorkspaceNameSet) : undefined;
        return scope;
    }

    /**
     * Create a lexical overlay over the current scope.
     *
     * Current local entries are copied, while misses fall back to the live
     * parent scope. Named local/nested function handles use this mode: existing
     * bindings are stable, but later function definitions can still be resolved
     * through the parent chain.
     *
     * @param copyNode Callback used to copy local AST/runtime values.
     * @param resolveParentNames Whether variable lookup may continue to the parent.
     * @returns Captured overlay scope.
     */
    public capture(copyNode: (node: NodeInput) => NodeInput, resolveParentNames: boolean = true): Scope {
        const scope = Scope.create(this, resolveParentNames);
        for (const [name, entry] of Object.entries(this.nameTable)) {
            scope.nameTable[name] = {
                ...entry,
                node: typeof entry.node !== 'undefined' ? copyNode(entry.node) : entry.node,
            };
        }
        scope.functionTable = { ...this.functionTable };
        scope.undefinedReferenceTable = Object.create(null);
        for (const [name, references] of Object.entries(this.undefinedReferenceTable)) {
            scope.undefinedReferenceTable[name] = new Set(references);
        }
        scope.importTable.explicit = Scope.cloneExplicitImports(this.importTable.explicit);
        scope.importTable.wildcard = [...this.importTable.wildcard];
        scope.assignExistingParentNames = this.assignExistingParentNames;
        scope.rejectDynamicNameCreation = this.rejectDynamicNameCreation;
        scope.staticWorkspaceNameSet = this.staticWorkspaceNameSet ? new Set(this.staticWorkspaceNameSet) : undefined;
        return scope;
    }

    /**
     * Clone an explicit import table while preserving the prototype-less
     * internal representation used for scope maps.
     */
    private static cloneExplicitImports(imports: Record<string, string[]>): Record<string, string[]> {
        const explicit = Object.create(null) as Record<string, string[]>;
        for (const [name, candidates] of Object.entries(imports)) {
            explicit[name] = candidates.slice();
        }
        return explicit;
    }
}

export { Scope };
export type { ImportTable };
export default Scope;
