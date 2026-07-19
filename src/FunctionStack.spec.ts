/// <reference types="jest" />
import path from 'node:path';
import type { FunctionTable, NameEntry, NameTable, NodeFunctionDefinition, NodeInput } from './AST';
import { AST } from './AST';
import { Complex } from './Complex';
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
    public parent?: WorkspaceScope;

    public constructor(parent?: WorkspaceScope) {
        this.parent = parent;
    }

    public defineName(name: string, node: NodeInput): NameEntry {
        return (this.nameTable[name] = { node });
    }

    public hasLocalName(name: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.nameTable, name);
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

            const caller = FunctionStack.callerWorkspace([globalFrame, userFrame, builtinFrame], globalScope, (parent) => new TestScope(parent));
            const lambdaCaller = FunctionStack.callerWorkspace([globalFrame, userFrame, builtinFrame, lambdaFrame], globalScope, (parent) => new TestScope(parent));

            expect(caller).toBe(globalScope);
            expect(lambdaCaller.nameTable).toBeDefined();
            expect(lambdaCaller).not.toBe(globalScope);
        });

        it('Should build anonymous caller workspace with caller and lambda-visible entries.', () => {
            const globalScope = new TestScope();
            const callerScope = new TestScope(globalScope);
            const lambdaScope = new TestScope(callerScope);
            const globalFrame = frame(undefined, globalScope);
            const callerFrame = frame('FCNDEF', callerScope, 'outer', 0, 0, globalFrame);
            const lambdaFrame = frame('LAMBDA', lambdaScope, '@(x)x', 1, 1, callerFrame);

            callerScope.defineName('a', Complex.create(1));
            lambdaScope.defineName('b', Complex.create(2));

            const workspace = FunctionStack.callerWorkspace([globalFrame, callerFrame, lambdaFrame], globalScope, (parent) => new TestScope(parent));

            expect(workspace.nameTable.a.node).toBe(callerScope.nameTable.a.node);
            expect(workspace.nameTable.b.node).toBe(lambdaScope.nameTable.b.node);
        });
    });
});
