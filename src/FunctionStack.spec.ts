/// <reference types="jest" />
import path from 'node:path';
import type { FunctionTable, NameEntry, NameTable, NodeFunctionDefinition, NodeInput } from './AST';
import { AST } from './AST';
import { Complex, toNumber } from './Complex';
import type { FunctionFrame } from './FunctionStack';
import { FunctionStack } from './FunctionStack';
import type { WorkspaceScope } from './FunctionWorkspace';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const functionDefinition = (id: string): NodeFunctionDefinition =>
    ({
        type: 'FCNDEF',
        id,
        mapper: false,
        ev: [],
        func: () => undefined,
        return: AST.nodeList([AST.nodeIdentifier('y')]),
        parameter: AST.nodeList([AST.nodeIdentifier('x')]),
        arguments: AST.nodeList([]),
        statements: AST.nodeList([]),
        omitAnswer: false,
        omitOutput: false,
    }) as NodeFunctionDefinition;

class TestScope implements WorkspaceScope {
    public nameTable: NameTable = Object.create(null);
    public functionTable: FunctionTable = Object.create(null);
    public resolveParentNames = true;
    public rejectDynamicNameCreation = false;
    public staticWorkspaceNameSet?: Set<string>;
    public parent?: WorkspaceScope;

    public constructor(parent?: WorkspaceScope) {
        this.parent = parent;
    }

    public defineName(name: string, node: NodeInput): NameEntry {
        if (!this.canCreateLocalName(name)) {
            throw new Error(`Attempt to add variable '${name}' to a static workspace.`);
        }
        return (this.nameTable[name] = { node });
    }

    public assignName(name: string, node: NodeInput): NameEntry {
        return this.defineName(name, node);
    }

    public hasLocalName(name: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.nameTable, name);
    }

    public removeName(name: string): void {
        delete this.nameTable[name];
    }

    public clearName(name: string): void {
        this.removeName(name);
        this.parent?.clearName?.(name);
    }

    private canCreateLocalName(name: string): boolean {
        return !this.rejectDynamicNameCreation || this.hasLocalName(name) || Boolean(this.staticWorkspaceNameSet?.has(name));
    }
}

const frame = (type: string | undefined, scope: WorkspaceScope, name = '', nargin = 0, nargout = 0, parentFrame?: FunctionFrame, node?: unknown): FunctionFrame => ({
    func: type ? { type, node } : undefined,
    scope,
    parentFrame,
    name,
    nargin,
    nargout,
    inputArgs: [],
});

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        AST.reload();
    });

    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionStack).toBeDefined();
            expect(FunctionStack.currentFunctionDefinition).toBeDefined();
            expect(FunctionStack.callerWorkspace).toBeDefined();
        });

        it('Should locate the current function frame and counts.', () => {
            const base = new TestScope();
            const builtin = frame('BUILTIN', base, 'sum');
            const func = functionDefinition('f');
            const user = frame('FCNDEF', base, 'f', 2, 1, builtin, func);
            const lambda = frame('LAMBDA', base, '@(x)x', 1, 1, user);
            const frames = [frame(undefined, base), builtin, user, lambda];

            expect(FunctionStack.currentFunctionDefinition(frames)).toBe(func);
            expect(FunctionStack.currentFunctionName(frames)).toBe('f');
            expect(FunctionStack.currentArgumentCount(frames)).toBe(1);
            expect(FunctionStack.currentOutputCount(frames)).toBe(1);
        });

        it('Should resolve caller workspace by skipping built-in frames.', () => {
            const globalScope = new TestScope();
            const userScope = new TestScope(globalScope);
            const builtinScope = new TestScope(userScope);
            const globalFrame = frame(undefined, globalScope);
            const userFrame = frame('FCNDEF', userScope, 'f', 0, 0, globalFrame);
            const builtinFrame = frame('BUILTIN', builtinScope, 'evalin', 0, 0, userFrame);
            const lambdaFrame = frame('LAMBDA', new TestScope(builtinScope), '@(x)x', 1, 1, builtinFrame);

            globalScope.defineName('baseValue', Complex.create(10));
            globalScope.functionTable.baseHelper = functionDefinition('baseHelper');
            const caller = FunctionStack.callerWorkspace([globalFrame, userFrame, builtinFrame], globalScope, (parent) => new TestScope(parent));
            const variableOnlyCaller = FunctionStack.callerWorkspace([globalFrame, userFrame, builtinFrame], globalScope, (parent) => new TestScope(parent), false, true);
            const assignCaller = FunctionStack.callerWorkspace([globalFrame, userFrame, builtinFrame], globalScope, (parent) => new TestScope(parent), true);
            const lambdaCaller = FunctionStack.callerWorkspace([globalFrame, userFrame, builtinFrame, lambdaFrame], globalScope, (parent) => new TestScope(parent), false, true);

            expect(caller).toBe(globalScope);
            expect(variableOnlyCaller).not.toBe(globalScope);
            expect(variableOnlyCaller.nameTable.baseValue.node).toBe(globalScope.nameTable.baseValue.node);
            expect(variableOnlyCaller.functionTable.baseHelper).toBeUndefined();
            expect(variableOnlyCaller.parent).toBeUndefined();
            expect(variableOnlyCaller.globalDeclarationTarget).toBe(globalScope);
            const createdEntry = variableOnlyCaller.assignName!('createdByOverlay', Complex.create(11));
            expect(globalScope.nameTable.createdByOverlay).toBe(createdEntry);
            expect(variableOnlyCaller.nameTable.createdByOverlay).toBe(createdEntry);
            globalScope.rejectDynamicNameCreation = false;
            globalScope.staticWorkspaceNameSet = new Set(['staticAllowed']);
            variableOnlyCaller.rejectDynamicNameCreation = true;
            variableOnlyCaller.staticWorkspaceNameSet = new Set(['staticAllowed']);
            expect(variableOnlyCaller.assignName!('staticAllowed', Complex.create(12))).toBe(globalScope.nameTable.staticAllowed);
            expect(() => variableOnlyCaller.assignName!('staticDenied', Complex.create(13))).toThrow("Attempt to add variable 'staticDenied' to a static workspace.");
            expect(globalScope.rejectDynamicNameCreation).toBe(false);
            variableOnlyCaller.removeName!('baseValue');
            expect(globalScope.nameTable.baseValue).toBeUndefined();
            expect(variableOnlyCaller.nameTable.baseValue).toBeUndefined();
            expect(assignCaller).toBe(globalScope);
            expect(lambdaCaller.nameTable).toBeDefined();
            expect(lambdaCaller).not.toBe(globalScope);
        });

        it('Should build anonymous caller workspace with caller and lambda-visible entries.', () => {
            const globalScope = new TestScope();
            const callerScope = new TestScope(globalScope);
            const closureScope = new TestScope(globalScope);
            const lambdaScope = new TestScope(closureScope);
            const globalFrame = frame(undefined, globalScope);
            const callerFrame = frame('FCNDEF', callerScope, 'outer', 0, 0, globalFrame);
            const lambdaFrame = frame('LAMBDA', lambdaScope, '@(x)x', 1, 1, callerFrame);

            callerScope.defineName('a', Complex.create(1));
            closureScope.defineName('captured', Complex.create(3));
            lambdaScope.defineName('b', Complex.create(2));
            callerScope.functionTable.helper = functionDefinition('helper');
            closureScope.functionTable.capturedHelper = functionDefinition('capturedHelper');
            lambdaScope.functionTable.lambdaHelper = functionDefinition('lambdaHelper');
            lambdaScope.rejectDynamicNameCreation = true;
            lambdaScope.staticWorkspaceNameSet = new Set(['b']);

            const workspace = FunctionStack.callerWorkspace([globalFrame, callerFrame, lambdaFrame], globalScope, (parent) => new TestScope(parent), false, true);

            expect(workspace.nameTable.a.node).toBe(callerScope.nameTable.a.node);
            expect(workspace.nameTable.captured.node).toBe(closureScope.nameTable.captured.node);
            expect(workspace.nameTable.b.node).toBe(lambdaScope.nameTable.b.node);
            expect(workspace.parent).toBeUndefined();
            expect(workspace.functionTable.helper).toBeUndefined();
            expect(workspace.functionTable.capturedHelper).toBeUndefined();
            expect(workspace.functionTable.lambdaHelper).toBeUndefined();
            expect(workspace.rejectDynamicNameCreation).toBe(true);
            expect(workspace.staticWorkspaceNameSet).toEqual(new Set(['b']));
            expect(workspace.globalDeclarationTarget).toBe(lambdaScope);
            workspace.assignName!('a', Complex.create(10));
            workspace.assignName!('captured', Complex.create(30));
            workspace.assignName!('b', Complex.create(20));
            expect(toNumber((callerScope.nameTable.a.node as ReturnType<typeof Complex.create>).re)).toBe(10);
            expect(toNumber((closureScope.nameTable.captured.node as ReturnType<typeof Complex.create>).re)).toBe(30);
            expect(toNumber((lambdaScope.nameTable.b.node as ReturnType<typeof Complex.create>).re)).toBe(20);
            workspace.removeName!('a');
            workspace.clearName!('captured');
            expect(callerScope.nameTable.a).toBeUndefined();
            expect(closureScope.nameTable.captured).toBeUndefined();
        });
    });
});
