import path from 'node:path';
import type { FunctionTable, NameEntry, NameTable, NodeFunctionDefinition, NodeInput } from './AST';
import { AST, CharString, Complex } from './AST';
import type { WorkspaceScope } from './FunctionWorkspace';
import { FunctionWorkspace } from './FunctionWorkspace';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const functionDefinition = (): NodeFunctionDefinition =>
    ({
        type: 'FCNDEF',
        id: 'f',
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

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        AST.reload();
    });

    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionWorkspace).toBeDefined();
            expect(FunctionWorkspace.ensurePersistentTable).toBeDefined();
            expect(FunctionWorkspace.declareGlobal).toBeDefined();
        });

        it('Should copy visible scope entries in parent-first order.', () => {
            const parent = new TestScope();
            const child = new TestScope(parent);
            const target = new TestScope();

            parent.defineName('x', Complex.create(1));
            child.defineName('x', Complex.create(2));
            child.defineName('y', Complex.create(3));

            FunctionWorkspace.copyVisibleScopeEntries(target, child);

            expect(target.nameTable.x.node).toBe(child.nameTable.x.node);
            expect(target.nameTable.y.node).toBe(child.nameTable.y.node);
        });

        it('Should resolve inputname from identifier arguments only.', () => {
            expect(
                FunctionWorkspace.inputName([AST.nodeIdentifier('x'), Complex.create(2)], Complex.create(1), (message) => {
                    throw new Error(message);
                }).str,
            ).toBe('x');

            expect(
                FunctionWorkspace.inputName([AST.nodeIdentifier('x'), Complex.create(2)], Complex.create(2), (message) => {
                    throw new Error(message);
                }).str,
            ).toBe('');

            expect(() =>
                FunctionWorkspace.inputName([AST.nodeIdentifier('x')], Complex.create(0), (message) => {
                    throw new Error(message);
                }),
            ).toThrow('inputname: argument number must be a positive integer.');
        });

        it('Should resolve base and caller workspaces.', () => {
            const base = new TestScope();
            const caller = new TestScope(base);

            expect(
                FunctionWorkspace.resolveWorkspace('base', base, caller, (message) => {
                    throw new Error(message);
                }),
            ).toBe(base);
            expect(
                FunctionWorkspace.resolveWorkspace('caller', base, caller, (message) => {
                    throw new Error(message);
                }),
            ).toBe(caller);
            expect(() =>
                FunctionWorkspace.resolveWorkspace('other', base, caller, (message) => {
                    throw new Error(message);
                }),
            ).toThrow("unsupported workspace 'other'.");
        });

        it('Should evaluate source with optional catch source in a workspace.', () => {
            const scope = new TestScope();
            const evaluated: string[] = [];
            const evaluate = (source: string, _scope: TestScope) => {
                evaluated.push(source);
                if (source === 'bad') {
                    throw new Error('bad source');
                }
                return new CharString(source);
            };

            expect((FunctionWorkspace.evaluateWithCatch(scope, 'ok', undefined, evaluate) as CharString).str).toBe('ok');
            expect((FunctionWorkspace.evaluateWithCatch(scope, 'bad', 'fallback', evaluate) as CharString).str).toBe('fallback');
            expect(evaluated).toEqual(['ok', 'bad', 'fallback']);
            expect(() => FunctionWorkspace.evaluateWithCatch(scope, 'bad', undefined, evaluate)).toThrow('bad source');
        });

        it('Should assign copied values into a workspace.', () => {
            const scope = new TestScope();
            const value = Complex.create(9);
            const result = FunctionWorkspace.assignIn(scope, 'x', value);

            expect(result.type).toBe('VOID');
            expect(Complex.realToNumber(scope.nameTable.x.node)).toBe(9);
            expect(scope.nameTable.x.node).not.toBe(value);
        });

        it('Should declare, load and store persistent variables.', () => {
            const func = functionDefinition();
            const firstScope = new TestScope();

            FunctionWorkspace.declarePersistent('p', Complex.create(1), func, firstScope);
            expect(Complex.realToNumber(firstScope.nameTable.p.node)).toBe(1);

            firstScope.defineName('p', Complex.create(5));
            FunctionWorkspace.storePersistentVariables(func, firstScope);

            const secondScope = new TestScope();
            FunctionWorkspace.loadPersistentVariables(func, secondScope);
            expect(Complex.realToNumber(secondScope.nameTable.p.node)).toBe(5);
        });

        it('Should share global entries and clear them from reachable scopes.', () => {
            const globalNames = new Set<string>();
            const globalScope = new TestScope();
            const localScope = new TestScope(globalScope);
            const nestedScope = new TestScope(localScope);
            const func = functionDefinition();
            func.definingScope = nestedScope as any;
            localScope.functionTable.f = func;

            FunctionWorkspace.declareGlobal('g', Complex.create(7), globalNames, globalScope.nameTable, localScope.nameTable);

            expect(localScope.nameTable.g).toBe(globalScope.nameTable.g);
            expect(globalScope.nameTable.g.global).toBe(true);

            FunctionWorkspace.clearGlobalVariables(globalNames, globalScope, [localScope]);

            expect(globalNames.size).toBe(0);
            expect(globalScope.nameTable.g).toBeUndefined();
            expect(localScope.nameTable.g).toBeUndefined();
        });
    });
});
