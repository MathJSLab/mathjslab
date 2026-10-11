/// <reference types="jest" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Architecture', () => {
    describe('Interpreter evaluation boundaries', () => {
        it('Should keep all Context and Interpreter return-list reductions inside named helper boundaries.', () => {
            const interpreterSource = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');
            const contextSource = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');
            const reductionPattern = /AST\.reduceToFirstIfReturnList\(/g;

            expect([...interpreterSource.matchAll(reductionPattern)]).toHaveLength(8);
            expect([...contextSource.matchAll(reductionPattern)]).toHaveLength(3);
            [
                'private evaluatedExpressionValue(tree: ExpressionBoundaryValue, scope: Scope, name: string): StrictNodeExpr',
                'private evaluatedExpressionBoundaryValue(tree: ExpressionBoundaryValue, scope: Scope, name: string): ExpressionBoundaryValue',
                'private evaluatedExecutionResult(tree: NodeInput, scope: Scope): NodeInput',
                'private reducedClassMethodResult(instance: ClassInstance, method: ClassMethodDefinition, args: ExpressionBoundaryValue[], parent: NodeInput): NodeInput',
                'private reducedClassMethodResultWithOutputCount(',
                'args: ExpressionBoundaryValue[],',
                'private reducedAssignmentValue(value: NodeInput): NodeInput',
                'private reducedExecutionValue(value: NodeInput): NodeInput',
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

            expect(matches).toHaveLength(3);
            expect(source).toContain('private evaluatedExpressionValue(tree: ExpressionBoundaryValue, scope: Scope, name: string): StrictNodeExpr');
            expect(source).toContain('private evaluatedExpressionBoundaryValue(tree: ExpressionBoundaryValue, scope: Scope, name: string): ExpressionBoundaryValue');
            expect(source).toContain('private evaluatedExecutionResult(tree: NodeInput, scope: Scope): NodeInput');
        });

        it('Should keep loop and assignment helper collections on strict boundaries.', () => {
            const source = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');

            [
                'private assignmentValues(value: unknown, prefix: string): RuntimeExpressionValue[]',
                'private classPropertyPathAssignmentValues(value: NodeInput, selectedCount: number, chain: ClassPropertyDescriptorChain): RuntimeExpressionValue[]',
                'private expressionList(values: unknown[], prefix: string): StrictNodeExpr[]',
                'private linearExpressionValues(value: unknown, prefix: string): StrictNodeExpr[]',
                'private forLoopValues(value: NodeInput, target: NodeAssignmentTarget): StrictNodeExpr[]',
                'private cloneAssignmentTarget(target: unknown): StrictNodeExpr',
                'private *validateAssignment(tree: StrictNodeExpr, shallow: boolean, scope: Scope): Generator<AssignmentExecutionRequest, AssignmentTarget[], AssignmentExecutionValue>',
                'private *collectSubsasgnAssignmentTarget(node: StrictNodeExpr, scope: Scope): Generator<AssignmentExecutionRequest, AssignmentTarget | undefined, AssignmentExecutionValue>',
                'private *assignmentWriter(tree: NodeInput, scope: Scope): Generator<AssignmentExecutionRequest, NodeInput, AssignmentExecutionValue>',
                'private *assignmentIndexRequest(index: ExpressionBoundaryValue[], scope: Scope): Generator<AssignmentExecutionRequest, IndexArgument[], AssignmentExecutionValue>',
            ].forEach((signature) => expect(source).toContain(signature));
        });

        it('Should keep conditional and dynamic-dispatch helpers on strict boundaries.', () => {
            const interpreterSource = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');
            const contextSource = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');

            [
                'private toBoolean(tree: RuntimeExpressionValue): boolean',
                'private evaluatedCondition(tree: StrictNodeExpr, scope: Scope, name: string): boolean',
                'private evaluatedConditionExpression(tree: StrictNodeExpr, scope: Scope, name: string): RuntimeExpressionValue',
                'private evaluateConditionalLogicalOperation(tree: BinaryOperation, scope: Scope): ComplexType',
                'private evaluatedDynamicFieldName(field: StrictNodeExpr, scope: Scope, message: string): string',
                'private evaluatedCommaSeparatedReceiver(expr: StrictNodeExpr, scope: Scope): NodeInput[] | undefined',
                'private collectClassSubsrefChain(node: StrictNodeExpr, scope: Scope)',
                'private *collectSubsasgnAssignmentTarget(node: StrictNodeExpr, scope: Scope)',
            ].forEach((signature) => expect(interpreterSource).toContain(signature));
            [
                'public resolveCallDispatch(expr: StrictNodeExpr, parent: NodeInput, args: CallArgumentValue[] = []): CallDispatch',
                'private applyNativeIndexing(expr: StrictNodeExpr, args: CallArgumentValue[], parent: NodeInput, evaluated?: ExpressionBoundaryValue[], prepared?: NativeIndexReceiver): StrictNodeExpr',
                'apply(expr: StrictNodeExpr, args: CallArgumentValue[], parent: NodeInput): ExpressionBoundaryValue',
            ].forEach((signature) => expect(contextSource).toContain(signature));
        });

        it('Should keep declaration defaults and validator metadata on strict boundaries.', () => {
            const argumentsSource = readFileSync(join(process.cwd(), 'src', 'FunctionArguments.ts'), 'utf8');
            const callSource = readFileSync(join(process.cwd(), 'src', 'FunctionCall.ts'), 'utf8');
            const contextSource = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');
            const interpreterSource = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');

            expect(argumentsSource).toContain('value?: StrictNodeExpr; bounds?: StrictNodeExpr[];');
            expect(argumentsSource).toContain('evaluate: (expr: StrictNodeExpr) => NodeInput;');
            expect(argumentsSource).toContain('Map<string, StrictNodeExpr>');
            expect(callSource).toContain('type EvaluateExpression = (expression: ExpressionBoundaryValue) => NodeInput;');
            expect(callSource).toContain('type EvaluateDefault = (name: string, expression: StrictNodeExpr) => NodeInput;');
            expect(callSource).toContain('inputDefaults: Map<string, StrictNodeExpr>;');
            expect(contextSource).toContain('getFunctionInputArgumentDefaults(func: NodeFunctionDefinition): Map<string, StrictNodeExpr>;');
            expect(interpreterSource).toContain('public getFunctionInputArgumentDefaults(func: NodeFunctionDefinition): Map<string, StrictNodeExpr>');
        });

        it('Should keep native operator facades and lazy selectors on strict boundaries.', () => {
            const contextSource = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');
            const interpreterSource = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');
            const linearAlgebraSource = readFileSync(join(process.cwd(), 'src', 'LinearAlgebra.ts'), 'utf8');

            expect(contextSource).toContain('func: (...operand: RuntimeExpressionValue[]): StrictNodeExpr =>');
            expect(contextSource).toContain('func: (left: RuntimeExpressionValue, ...right: RuntimeExpressionValue[]): StrictNodeExpr =>');
            expect(interpreterSource).toContain('func: (...args: NodeInput[]): StrictNodeExpr =>');
            expect(linearAlgebraSource).toContain('private static readonly returnListOutput =');
            expect(linearAlgebraSource).not.toMatch(/\(evaluated: ReturnHandlerResult, index: number\): NodeExpr(?: \| undefined)?/);
        });

        it('Should keep dynamic class and callable dispatch returns strict.', () => {
            const contextSource = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');
            const interpreterSource = readFileSync(join(process.cwd(), 'src', 'Interpreter.ts'), 'utf8');

            [
                'private callFunctionDefinition(callable: FunctionDefinitionCallable, args: CallArgumentValue[], parent: NodeInput, requestedOutputCount: number): StrictNodeExpr',
                'public callClassInstanceMethod(instance: ClassInstance, method: ClassMethodDefinition, args: CallArgumentValue[], parent: NodeInput): StrictNodeExpr',
                'public callClassStaticMethod(method: ClassMethodDefinition, args: CallArgumentValue[], parent: NodeInput): StrictNodeExpr',
                'callCallable(callable: Callable, args: CallArgumentValue[], parent: NodeInput): ExpressionBoundaryValue',
                'private applyCallDispatch(dispatch: CallDispatch, args: CallArgumentValue[], parent: NodeInput): ExpressionBoundaryValue | undefined',
            ].forEach((signature) => expect(contextSource).toContain(signature));
            expect(interpreterSource).toContain(
                'public callFunctionalOperatorOverload(node: NodeBuiltInFunction, args: CallArgumentValue[], parent: NodeInput, evaluated?: ExpressionBoundaryValue[]): StrictNodeExpr | undefined',
            );
        });

        it('Should keep context-owned interpreter evaluation inside named boundary helpers.', () => {
            const source = readFileSync(join(process.cwd(), 'src', 'Context.ts'), 'utf8');
            const directReductionPattern = /AST\.reduceToFirstIfReturnList\(this\.interpreter!\.Evaluator\(/g;
            const directEvaluationPattern = /this\.interpreter!\.Evaluator\(/g;

            expect([...source.matchAll(directReductionPattern)]).toHaveLength(0);
            expect([...source.matchAll(directEvaluationPattern)]).toHaveLength(1);
            expect(source).toContain('private evaluatedExpressionValue(tree: ExpressionBoundaryValue, scope: Scope, name: string): StrictNodeExpr');
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
