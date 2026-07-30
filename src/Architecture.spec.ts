/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Architecture', () => {
    describe('Interpreter evaluation boundaries', () => {
        it('Should keep all Context and Interpreter return-list reductions inside named helper boundaries.', () => {
            const interpreterSource = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');
            const contextSource = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');
            const reductionPattern = /AST\.reduceToFirstIfReturnList\(/g;

            expect([...interpreterSource.matchAll(reductionPattern)]).toHaveLength(6);
            expect([...contextSource.matchAll(reductionPattern)]).toHaveLength(3);
            [
                'private evaluatedExpressionValue(tree: NodeExpr, scope: Scope, name: string): NodeExpr',
                'private evaluatedExecutionResult(tree: NodeInput, scope: Scope): NodeInput',
                'private reducedClassMethodResult(instance: ClassInstance, method: ClassMethodDefinition, args: ExpressionBoundaryValue[], parent: NodeInput): NodeInput',
                'private reducedClassMethodResultWithOutputCount(',
                'args: ExpressionBoundaryValue[],',
                'private reducedAssignmentValue(value: NodeInput): NodeInput',
                'private reducedIndexingResult(value: NodeInput): NodeInput',
            ].forEach((signature) => expect(interpreterSource).toContain(signature));
            [
                'private reducedCommaListScalar(value: NodeInput): NodeInput',
                'private evaluatedExecutionResult(tree: NodeInput, scope: Scope = this.currentScope): NodeInput',
                'private reducedClassMethodResult(instance: ClassInstance, method: ClassMethodDefinition, args: CallArgumentValue[], parent: NodeInput): NodeInput',
            ].forEach((signature) => expect(contextSource).toContain(signature));
        });

        it('Should keep direct evaluator return-list reduction inside named boundary helpers.', () => {
            const source = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');
            const directReductionPattern = /AST\.reduceToFirstIfReturnList\(this\.Evaluator\(/g;
            const matches = [...source.matchAll(directReductionPattern)];

            expect(matches).toHaveLength(2);
            expect(source).toContain('private evaluatedExpressionValue(tree: NodeExpr, scope: Scope, name: string): NodeExpr');
            expect(source).toContain('private evaluatedExecutionResult(tree: NodeInput, scope: Scope): NodeInput');
        });

        it('Should keep context-owned interpreter evaluation inside named boundary helpers.', () => {
            const source = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');
            const directReductionPattern = /AST\.reduceToFirstIfReturnList\(this\.interpreter!\.Evaluator\(/g;
            const directEvaluationPattern = /this\.interpreter!\.Evaluator\(/g;

            expect([...source.matchAll(directReductionPattern)]).toHaveLength(0);
            expect([...source.matchAll(directEvaluationPattern)]).toHaveLength(1);
            expect(source).toContain('private evaluatedExpressionValue(tree: NodeExpr, scope: Scope, name: string): ExpressionBoundaryValue');
            expect(source).toContain('private evaluatedExecutionResult(tree: NodeInput, scope: Scope = this.currentScope): NodeInput');
            expect(source).toContain('private rawEvaluationResult(tree: NodeInput, scope: Scope = this.currentScope): NodeInput');
        });

        it('Should keep class-method return-list reduction inside named boundary helpers.', () => {
            const interpreterSource = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');
            const contextSource = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');

            expect([...interpreterSource.matchAll(/AST\.reduceToFirstIfReturnList\(this\.context\.callClassInstanceMethod\(/g)]).toHaveLength(1);
            expect(interpreterSource).toContain(
                'private reducedClassMethodResult(instance: ClassInstance, method: ClassMethodDefinition, args: ExpressionBoundaryValue[], parent: NodeInput): NodeInput',
            );
            expect([...contextSource.matchAll(/AST\.reduceToFirstIfReturnList\(this\.callClassInstanceMethod\(/g)]).toHaveLength(1);
            expect(contextSource).toContain(
                'private reducedClassMethodResult(instance: ClassInstance, method: ClassMethodDefinition, args: CallArgumentValue[], parent: NodeInput): NodeInput',
            );
        });
    });
});
