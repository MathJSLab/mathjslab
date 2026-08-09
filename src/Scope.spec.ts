/// <reference types="jest" />
import { AST } from './AST';
import { Complex } from './Complex';
import { Scope } from './Scope';

describe('Scope', () => {
    describe('Behavior', () => {
        it('Should resolve names and functions through the parent chain.', () => {
            const parent = Scope.create();
            const child = Scope.create(parent);
            const func = AST.nodeFunctionDefinition(AST.nodeIdentifier('f'), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]));

            parent.defineName('x', Complex.create(3));
            parent.defineFunction('f', func);

            expect(Complex.realToNumber(child.resolveName('x')?.node)).toBe(3);
            expect(child.resolveFunction('f')).toBe(func);
        });

        it('Should optionally avoid parent name lookup.', () => {
            const parent = Scope.create();
            const child = Scope.create(parent, false);

            parent.defineName('x', Complex.create(3));

            expect(child.resolveName('x')).toBeUndefined();
        });

        it('Should assign existing parent names when enabled.', () => {
            const parent = Scope.create();
            const child = Scope.create(parent);

            parent.defineName('x', Complex.create(3));
            child.assignExistingParentNames = true;
            child.assignName('x', Complex.create(5));

            expect(Complex.realToNumber(parent.resolveName('x')?.node)).toBe(5);
            expect(child.hasLocalName('x')).toBe(false);
        });

        it('Should reject dynamic names outside static-workspace allowlists.', () => {
            const scope = Scope.create();

            scope.allowStaticWorkspaceName('declared');
            scope.rejectDynamicNameCreation = true;
            scope.assignName('declared', Complex.create(3));

            expect(Complex.realToNumber(scope.resolveName('declared')?.node)).toBe(3);
            expect(() => scope.assignName('dynamic', Complex.create(5))).toThrow("Attempt to add variable 'dynamic' to a static workspace.");
            expect(() => scope.defineName('dynamic', Complex.create(7))).toThrow("Attempt to add variable 'dynamic' to a static workspace.");
        });

        it('Should define name tables from own bindings only.', () => {
            const inherited = { inherited: Complex.one() };
            const table = Object.create(inherited) as Record<string, typeof inherited.inherited>;
            table.own = Complex.two();
            const scope = Scope.create();

            scope.defineNameTable(table);

            expect(Complex.realToNumber(scope.resolveName('own')?.node)).toBe(2);
            expect(scope.resolveName('inherited')).toBeUndefined();
        });

        it('Should snapshot variables by value.', () => {
            const scope = Scope.create();
            const value = Complex.create(7);

            scope.defineName('x', value);
            Object.setPrototypeOf(scope.nameTable, { inherited: { node: Complex.one() } });

            const snapshot = scope.snapshot((node) => node.copy());

            expect(Complex.realToNumber(snapshot.resolveName('x')?.node)).toBe(7);
            expect(snapshot.resolveName('x')?.node).not.toBe(value);
            expect(snapshot.resolveName('inherited')).toBeUndefined();
        });

        it('Should capture local variables by value.', () => {
            const scope = Scope.create();
            const value = Complex.create(11);

            scope.defineName('x', value);
            Object.setPrototypeOf(scope.nameTable, { inherited: { node: Complex.one() } });

            const capture = scope.capture((node) => node.copy(), false);

            expect(Complex.realToNumber(capture.resolveName('x')?.node)).toBe(11);
            expect(capture.resolveName('x')?.node).not.toBe(value);
            expect(capture.resolveName('inherited')).toBeUndefined();
        });

        it('Should bind evaluated expression-boundary parameters.', () => {
            const scope = Scope.create();
            const scalar = Complex.create(9);
            const identifier = AST.nodeIdentifier('source');

            scope.bindParametersChecked(['x', 'source'], [scalar, identifier]);

            expect(scope.resolveName('x')?.node).toBe(scalar);
            expect(scope.resolveName('source')?.node).toBe(identifier);
            expect(() => scope.bindParametersChecked(['x'], [scalar, identifier])).toThrow('Arity mismatch: expected 1 argument(s), got 2');
        });

        it('Should order explicit and wildcard imports lexically.', () => {
            const parent = Scope.create();
            const child = Scope.create(parent);

            parent.defineImport('pkg.parent.Target');
            child.defineImport('pkg.child.*');

            expect(child.importedNameCandidates('Target')).toEqual(['pkg.child.Target', 'pkg.parent.Target']);

            child.defineImport('pkg.child.Target');

            expect(child.importedNameCandidates('Target')).toEqual(['pkg.child.Target']);
        });

        it('Should keep same-scope explicit imports as ordered ambiguity candidates.', () => {
            const scope = Scope.create();

            scope.defineImport('pkg.first.Target');
            scope.defineImport('pkg.second.Target');
            scope.defineImport('pkg.first.Target');

            const snapshot = scope.snapshot((node) => node);
            scope.defineImport('pkg.third.Target');

            expect(scope.importedNameCandidates('Target')).toEqual(['pkg.first.Target', 'pkg.second.Target', 'pkg.third.Target']);
            expect(snapshot.importedNameCandidates('Target')).toEqual(['pkg.first.Target', 'pkg.second.Target']);
        });

        it('Should clear only imports declared directly in the current scope.', () => {
            const parent = Scope.create();
            const child = Scope.create(parent);

            parent.defineImport('pkg.parent.Target');
            child.defineImport('pkg.child.Target');
            child.defineImport('pkg.child.*');

            child.clearImports();

            expect(child.importedNameCandidates('Target')).toEqual(['pkg.parent.Target']);
            expect(child.importedNameCandidates('Other')).toEqual([]);
        });

        it('Should snapshot and restore current-scope imports.', () => {
            const parent = Scope.create();
            const child = Scope.create(parent);

            parent.defineImport('pkg.parent.*');
            child.defineImport('pkg.initial.Target');
            child.defineImport('pkg.initial.*');
            const snapshot = child.importSnapshot();

            child.defineImport('pkg.changed.Target');
            child.defineImport('pkg.changed.*');
            child.restoreImports(snapshot);

            expect(child.importedNameCandidates('Target')).toEqual(['pkg.initial.Target']);
            expect(child.importedNameCandidates('Other')).toEqual(['pkg.initial.Other', 'pkg.parent.Other']);
        });

        it('Should clone imports from own entries only.', () => {
            const scope = Scope.create();
            const inheritedImports = Object.create(null) as Record<string, string[]>;
            inheritedImports.Inherited = ['pkg.inherited.Inherited'];
            Object.setPrototypeOf(scope.importTable.explicit, inheritedImports);
            scope.defineImport('pkg.own.Target');

            const snapshot = scope.snapshot((node) => node);
            const imports = scope.importSnapshot();
            const restored = Scope.create();
            restored.restoreImports(imports);

            expect(Object.getPrototypeOf(imports.explicit)).toBeNull();
            expect(snapshot.importedNameCandidates('Target')).toEqual(['pkg.own.Target']);
            expect(snapshot.importedNameCandidates('Inherited')).toEqual([]);
            expect(restored.importedNameCandidates('Target')).toEqual(['pkg.own.Target']);
            expect(restored.importedNameCandidates('Inherited')).toEqual([]);
        });

        it('Should list visible imports from inner to outer scopes.', () => {
            const parent = Scope.create();
            const child = Scope.create(parent);

            parent.defineImport('pkg.parent.Target');
            parent.defineImport('pkg.parent.*');
            child.defineImport('pkg.child.Target');
            child.defineImport('pkg.child.*');
            child.defineImport('pkg.parent.Target');

            expect(child.importList()).toEqual(['pkg.child.Target', 'pkg.parent.Target', 'pkg.child.*', 'pkg.parent.*']);
        });
    });
});
