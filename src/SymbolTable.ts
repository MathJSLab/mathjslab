import * as AST from './AST';
import type { AliasFunction, BuiltInFunctionTable, BuiltInFunctionTableEntry } from './Evaluator';

class SymbolTable {
    variableTable: Record<string, AST.NodeExpr>;
    functionTable: Record<string, AST.NodeFunction>;
    builtInTable: BuiltInFunctionTable;
    aliasName: AliasFunction;
    parent: SymbolTable | null;
    child: SymbolTable[];
    scope: string | null;

    constructor(builtInTable: BuiltInFunctionTable, aliasName: AliasFunction, parent?: SymbolTable | null, scope?: string | null, node?: any) {
        const thisParent = typeof parent !== 'undefined' ? parent : null;
        if (thisParent) {
            thisParent.child.push(this);
        }
        this.variableTable = {};
        this.functionTable = {};
        this.builtInTable = builtInTable;
        this.aliasName = aliasName;
        this.parent = thisParent;
        this.child = [];
        this.scope = scope ?? null;
        if (typeof node !== 'undefined') {
            node['symtab'] = this;
        }
    }

    public lookupVariable(id: string): [AST.NodeExpr, string | null] | null {
        let table: SymbolTable | null = this;
        while (table !== null) {
            if (typeof table.variableTable[id] !== 'undefined') {
                return [table.variableTable[id], table.scope];
            } else {
                table = table.parent;
            }
        }
        return null;
    }

    public insertVariable(id: string, expression: AST.NodeExpr): [AST.NodeExpr, string | null] {
        this.variableTable[id] = expression;
        return [this.variableTable[id], this.scope];
    }

    public lookupFunction(id: string): [AST.NodeFunction | BuiltInFunctionTableEntry, string | null] | null {
        let table: SymbolTable | null = this;
        while (table !== null) {
            if (typeof table.functionTable[id] !== 'undefined') {
                return [table.functionTable[id], table.scope];
            } else {
                table = table.parent;
            }
        }
        return null;
    }

    public insertFunction(id: string, entry: AST.NodeFunction): [AST.NodeFunction, string | null] {
        this.functionTable[id] = entry;
        return [this.functionTable[id], this.scope];
    }
}
export { SymbolTable };
export default SymbolTable;
