import type { NodeBuiltInFunction } from './AST';
import { AST } from './AST';
import { Callables } from './Callable';
import { FunctionHandle } from './FunctionHandle';

describe('Callable', () => {
    describe('Behavior', () => {
        it('Should create and classify built-in callables.', () => {
            const node = { type: 'BUILTIN', id: 'sin', mapper: true, ev: [], func: () => undefined } as NodeBuiltInFunction;
            const callable = Callables.builtin(node);

            expect(callable.type).toBe('BUILTIN');
            expect(callable.node).toBe(node);
            expect(Callables.isBuiltin(callable)).toBe(true);
            expect(Callables.isLambda(callable)).toBe(false);
            expect(Callables.isFunctionDefinition(callable)).toBe(false);
        });

        it('Should create and classify lambda callables.', () => {
            const node = FunctionHandle.create(undefined, [AST.nodeIdentifier('x')], AST.nodeIdentifier('x')) as FunctionHandle & { id: undefined };
            const callable = Callables.lambda(node);

            expect(callable.type).toBe('LAMBDA');
            expect(callable.node).toBe(node);
            expect(Callables.isLambda(callable)).toBe(true);
        });

        it('Should wrap function nodes preserving their kind.', () => {
            const builtin = { type: 'BUILTIN', id: 'sum', mapper: false, ev: [], func: () => undefined } as NodeBuiltInFunction;
            const defined = AST.nodeFunctionDefinition(AST.nodeIdentifier('f'), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]), AST.nodeList([]));

            expect(Callables.fromFunctionNode(builtin).type).toBe('BUILTIN');
            expect(Callables.fromFunctionNode(defined).type).toBe('FCNDEF');
        });
    });
});
