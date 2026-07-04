import type { FunctionTable, NameEntry, NameTable, NodeBuiltInFunction, NodeExpr, NodeFunctionDefinition, NodeInput, UndefinedReferenceTable } from './AST';

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
 */
class Scope {
    /**
     * Use `Scope.create` so scope tables are always prototype-less maps.
     */
    private constructor(
        public parent?: Scope,
        public nameTable: NameTable = Object.create(null),
        public functionTable: FunctionTable = Object.create(null),
        public undefinedReferenceTable: UndefinedReferenceTable = Object.create(null),
        public resolveParentNames: boolean = true,
        public assignExistingParentNames: boolean = false,
    ) {}

    /**
     * Create a fresh scope with empty name/function/reference tables.
     *
     * @param parent Optional parent scope for lexical lookup.
     * @param resolveParentNames Whether variable lookup may continue into the parent chain.
     */
    public static readonly create = (parent?: Scope, resolveParentNames: boolean = true) =>
        new Scope(parent, Object.create(null), Object.create(null), Object.create(null), resolveParentNames);

    /**
     * Define or replace a variable in the current scope only.
     *
     * Existing entries are mutated in place so global aliases, persistent
     * bindings, and UI references that point at the entry object continue to see
     * updates.
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
        return undefinedReference ? (this.nameTable[name] = { undefinedReference, node }) : (this.nameTable[name] = { node });
    }

    /**
     * Assign a value using the current scope's assignment policy.
     *
     * Ordinary scopes define locally. Nested-function scopes can opt into
     * parent assignment through `assignExistingParentNames`, which preserves
     * MATLAB/Octave shared-variable behavior.
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
        return this.defineName(name, node, undefinedReference);
    }

    /**
     * Define several local variables at once.
     */
    public defineNameTable(table: Record<string, NodeInput>): void {
        for (const name in table) {
            this.nameTable[name] = { node: table[name] };
        }
    }

    /**
     * Resolve a variable through this scope and, when allowed, its parents.
     */
    public resolveName(name: string): NameEntry | undefined {
        const entry = this.nameTable[name];
        return entry ? entry : this.resolveParentNames && this.parent ? this.parent.resolveName(name) : undefined;
    }

    /**
     * Check whether a name is defined directly in this scope.
     */
    public hasLocalName(name: string): boolean {
        return name in this.nameTable;
    }

    /**
     * Remove a local variable binding.
     */
    public removeName(name: string): void {
        delete this.nameTable[name];
    }

    /**
     * Remove a variable binding from this scope and all parents.
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
     */
    public defineFunction(name: string, func: NodeFunctionDefinition): NodeFunctionDefinition {
        return (this.functionTable[name] = func);
    }

    /**
     * Merge a function table into this scope.
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
     */
    public resolveFunction(name: string): NodeFunctionDefinition | NodeBuiltInFunction | undefined {
        const entry = this.functionTable[name];
        return entry ? entry : this.parent ? this.parent.resolveFunction(name) : undefined;
    }

    /**
     * Check whether a function is defined directly in this scope.
     */
    public hasLocalFunction(name: string): boolean {
        return name in this.functionTable;
    }

    /**
     * Remove a local function binding.
     */
    public removeFunction(name: string): void {
        delete this.functionTable[name];
    }

    /**
     * Remove a function binding from this scope and all parents.
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
     */
    public bindParameters(names: string[], args: NodeExpr[]): void {
        for (let i = 0; i < names.length; i++) {
            this.defineName(names[i], args[i]);
        }
    }

    /**
     * Bind formal parameters after checking exact arity.
     *
     * This low-level helper predates the richer function-call pipeline and is
     * kept for focused tests and simple call paths.
     */
    public bindParametersChecked(names: string[], args: NodeExpr[]): void {
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
     */
    public defineUndefinedReference(name: string, undefinedReference: string): string[] {
        const entry = this.resolveUndefinedReference(name);
        if (entry) {
            if (!entry.includes(undefinedReference)) {
                entry.push(undefinedReference);
            }
            return entry;
        }
        return (this.undefinedReferenceTable[name] = [undefinedReference]);
    }

    /**
     * Resolve unresolved-reference metadata through the parent chain.
     */
    public resolveUndefinedReference(name: string): string[] | undefined {
        const entry = this.undefinedReferenceTable[name];
        return entry ? entry : this.parent ? this.parent.resolveUndefinedReference(name) : undefined;
    }

    /**
     * Remove a local unresolved-reference entry.
     */
    public removeUndefinedReference(name: string): void {
        delete this.undefinedReferenceTable[name];
    }

    /**
     * Remove unresolved-reference metadata from this scope and all parents.
     */
    public clearUndefinedReference(name: string): void {
        let scope: Scope | undefined = this;
        while (scope) {
            delete scope.undefinedReferenceTable[name];
            scope = scope.parent;
        }
    }

    /**
     * Deep-copy the visible variable/function environment into a detached chain.
     *
     * Anonymous functions use snapshots so captured variables keep the value
     * they had when the handle was created. Function tables and unresolved
     * reference lists are also copied so later forward-reference resolution
     * remains deterministic for the captured environment.
     */
    public snapshot(copyNode: (node: NodeInput) => NodeInput): Scope {
        const parent = this.parent ? this.parent.snapshot(copyNode) : undefined;
        const scope = Scope.create(parent);
        for (const name in this.nameTable) {
            const entry = this.nameTable[name];
            scope.nameTable[name] = {
                ...entry,
                node: typeof entry.node !== 'undefined' ? copyNode(entry.node) : entry.node,
            };
        }
        scope.functionTable = { ...this.functionTable };
        scope.undefinedReferenceTable = Object.create(null);
        for (const name in this.undefinedReferenceTable) {
            scope.undefinedReferenceTable[name] = [...this.undefinedReferenceTable[name]];
        }
        return scope;
    }

    /**
     * Create a lexical overlay over the current scope.
     *
     * Current local entries are copied, while misses fall back to the live
     * parent scope. Named local/nested function handles use this mode: existing
     * bindings are stable, but later function definitions can still be resolved
     * through the parent chain.
     */
    public capture(copyNode: (node: NodeInput) => NodeInput, resolveParentNames: boolean = true): Scope {
        const scope = Scope.create(this, resolveParentNames);
        for (const name in this.nameTable) {
            const entry = this.nameTable[name];
            scope.nameTable[name] = {
                ...entry,
                node: typeof entry.node !== 'undefined' ? copyNode(entry.node) : entry.node,
            };
        }
        scope.functionTable = { ...this.functionTable };
        scope.undefinedReferenceTable = Object.create(null);
        for (const name in this.undefinedReferenceTable) {
            scope.undefinedReferenceTable[name] = [...this.undefinedReferenceTable[name]];
        }
        return scope;
    }
}

export { Scope };
export default Scope;
