import { AST, type NodeAssignmentTarget, type StrictNodeExpr } from './AST';

describe('Typed control-flow AST boundaries', () => {
    const listCarrier = (): StrictNodeExpr => AST.nodeListFirst(AST.nodeIdentifier('value')) as unknown as StrictNodeExpr;

    it('Should retain strict expressions and parent links for branch nodes.', () => {
        const ifCondition = AST.nodeIdentifier('ifCondition');
        const elseIfCondition = AST.nodeIdentifier('elseIfCondition');
        const switchExpression = AST.nodeIdentifier('switchExpression');
        const caseExpression = AST.nodeIdentifier('caseExpression');
        const whileCondition = AST.nodeIdentifier('whileCondition');
        const untilCondition = AST.nodeIdentifier('untilCondition');

        const ifNode = AST.nodeIfBegin(ifCondition, AST.nodeListFirst());
        const elseIfNode = AST.nodeElseIf(elseIfCondition, AST.nodeListFirst());
        AST.nodeIfAppendElseIf(ifNode, elseIfNode);
        const caseNode = AST.nodeSwitchCase(caseExpression, AST.nodeListFirst());
        const switchNode = AST.nodeSwitch(switchExpression, AST.nodeListFirst(caseNode));
        const whileNode = AST.nodeWhile(whileCondition, AST.nodeListFirst());
        const doUntilNode = AST.nodeDoUntil(AST.nodeListFirst(), untilCondition);

        expect(ifNode.expression).toEqual([ifCondition, elseIfCondition]);
        expect(ifCondition.parent).toBe(ifNode);
        expect(elseIfCondition.parent).toBe(ifNode);
        expect(switchExpression.parent).toBe(switchNode);
        expect(caseExpression.parent).toBe(caseNode);
        expect(caseNode.parent).toBe(switchNode);
        expect(whileCondition.parent).toBe(whileNode);
        expect(untilCondition.parent).toBe(doUntilNode);
        expect([ifNode, switchNode, whileNode, doUntilNode].every(({ omitOutput }) => omitOutput)).toBe(true);
    });

    it('Should reject NodeList carriers in control-flow expression slots.', () => {
        expect(() => AST.nodeIfBegin(listCarrier(), AST.nodeListFirst())).toThrow('if condition is not an expression node.');
        expect(() => AST.nodeElseIf(listCarrier(), AST.nodeListFirst())).toThrow('elseif condition is not an expression node.');
        expect(() => AST.nodeSwitch(listCarrier(), AST.nodeListFirst())).toThrow('switch expression is not an expression node.');
        expect(() => AST.nodeSwitchCase(listCarrier(), AST.nodeListFirst())).toThrow('case expression is not an expression node.');
        expect(() => AST.nodeWhile(listCarrier(), AST.nodeListFirst())).toThrow('while condition is not an expression node.');
        expect(() => AST.nodeDoUntil(AST.nodeListFirst(), listCarrier())).toThrow('until condition is not an expression node.');
        expect(() => AST.nodeFor(AST.nodeIdentifier('k'), listCarrier(), AST.nodeListFirst())).toThrow('for expression is not an expression node.');
        expect(() => AST.nodeFor(AST.nodeIdentifier('k'), AST.nodeIdentifier('values'), AST.nodeListFirst(), true, listCarrier())).toThrow('for workers is not an expression node.');
    });

    it('Should accept every assignment-target family supported by for nodes.', () => {
        const targets: NodeAssignmentTarget[] = [
            AST.nodeIdentifier('k'),
            AST.nodeIgnoredTarget(),
            AST.nodeIndexExpr(AST.nodeIdentifier('values'), AST.nodeListFirst(AST.nodeNumber('1'))),
            AST.nodeIndirectRef(AST.nodeIdentifier('object'), 'field'),
            AST.emptyArray(),
        ];

        for (const target of targets) {
            const node = AST.nodeFor(target, AST.nodeIdentifier('values'), AST.nodeListFirst());
            expect(node.target).toBe(target);
            expect(target.parent).toBe(node);
            expect(AST.requireNodeAssignmentTarget(target)).toBe(target);
        }
    });

    it('Should reject expression and statement nodes that are not assignment targets.', () => {
        expect(() => AST.requireNodeAssignmentTarget(AST.nodeNumber('1'))).toThrow('expression is not an assignment target.');
        expect(() => AST.requireNodeAssignmentTarget(AST.nodeReturn(), 'loop target')).toThrow('loop target is not an assignment target.');
        expect(() => AST.nodeFor(AST.nodeNumber('1') as unknown as NodeAssignmentTarget, AST.nodeIdentifier('values'), AST.nodeListFirst())).toThrow('for target is not an expression node.');
        expect(() => AST.nodeFor(AST.nodeReturn() as unknown as NodeAssignmentTarget, AST.nodeIdentifier('values'), AST.nodeListFirst())).toThrow('for target is not an expression node.');
    });

    it('Should retain parfor worker expressions and loop metadata.', () => {
        const target = AST.nodeIdentifier('k');
        const range = AST.nodeRange(AST.nodeNumber('1'), AST.nodeNumber('3'));
        const workers = AST.nodeNumber('2');
        const body = AST.nodeListFirst(AST.nodeContinue());
        const node = AST.nodeFor(target, range, body, true, workers);

        expect(node.parallel).toBe(true);
        expect(node.target).toBe(target);
        expect(node.expression).toBe(range);
        expect(node.workers).toBe(workers);
        expect(target.parent).toBe(node);
        expect(range.parent).toBe(node);
        expect(workers.parent).toBe(node);
        expect(body.parent).toBe(node);
        expect(node.omitOutput).toBe(true);
    });
});
