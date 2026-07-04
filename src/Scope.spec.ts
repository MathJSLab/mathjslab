import { AST, Complex } from './AST';
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

        it('Should snapshot variables by value.', () => {
            const scope = Scope.create();
            const value = Complex.create(7);

            scope.defineName('x', value);

            const snapshot = scope.snapshot((node) => node.copy());

            expect(Complex.realToNumber(snapshot.resolveName('x')?.node)).toBe(7);
            expect(snapshot.resolveName('x')?.node).not.toBe(value);
        });
    });
});
