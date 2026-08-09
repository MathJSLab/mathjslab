/// <reference types="jest" />
import path from 'node:path';
import { AST, type BuiltInFunctionSignature, type NodeExpr, type NodeInput } from './AST';
import { CircularReferenceError, EvalError, Interpreter, InterpreterError, ReferenceError, SyntaxError, UndefinedReferenceError } from './Interpreter';
import { CharString } from './CharString';
import { ClassDefinition } from './ClassDefinition';
import { Complex } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { Scope } from './Scope';
import { ManifestSourceResolver } from './SourceResolver';
import type { ComplexType } from './Complex';
import { executeList, parseClassDefinition, parseList } from './ParserTestUtils';

type InterpreterReturnListHarness = {
    context: Interpreter['context'];
    forLoopValues(_value: NodeInput, _target: NodeInput): NodeInput[];
    forLoopAssignmentValue(_target: NodeInput, _value: NodeInput): NodeInput;
    linearExpressionValues(_value: unknown, _prefix: string): NodeInput[];
    nestedAssignmentValue(_resultList: ReturnType<typeof AST.nodeListFirst>): NodeInput;
    Unparse(_value: NodeInput): string;
    valueReturnList(_values: unknown[]): ReturnType<typeof AST.nodeReturnList>;
};
type InterpreterBuiltInHarness = {
    functions: {
        builtin: { func: (..._args: NodeInput[]) => NodeInput };
        feval: { func: (..._args: NodeInput[]) => NodeInput };
    };
    functionHandleWorkspaceInfo(_handle: FunctionHandle): MultiArray;
    functionHandleWorkspaceValue(_value: unknown, _name: string): NodeInput;
};
type InterpreterClassMethodHarness = {
    classMethodArgumentValues(_values: NodeInput[], _prefix: string): NodeInput[];
    assignmentValues(_value: unknown, _prefix: string): NodeInput[];
    booleanControlArgument(_value: unknown, _name: string): boolean;
    cloneAssignmentTarget(_target: unknown): NodeInput;
    descriptorSubscripts(_subs: MultiArray): NodeInput[];
    expressionList(_values: unknown[], _prefix: string): NodeInput[];
    nativeSubscriptScalar(_target: NodeInput, _descriptor: { type: '.' | '()' | '{}'; subs: NodeInput[] }): NodeInput;
    switchCaseMatches(_switchValue: NodeInput, _caseValue: NodeInput): boolean;
    switchComparableValue(_value: NodeInput): NodeInput;
};

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

/**
 * Shared interpreter used by the basic construction and evaluation tests.
 */
let interpreter: Interpreter;

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        interpreter = Interpreter.Create();
    });

    describe('Behavior', () => {
        it(`${unitName} should be defined and instantiated.`, () => {
            expect(Interpreter).toBeDefined();
            expect(interpreter).toBeInstanceOf(Interpreter);
        });

        it('Should export the public interpreter error hierarchy.', () => {
            expect(new EvalError('eval')).toBeInstanceOf(InterpreterError);
            expect(new ReferenceError('reference')).toBeInstanceOf(InterpreterError);
            expect(new UndefinedReferenceError('x')).toBeInstanceOf(ReferenceError);
            expect(new CircularReferenceError(['A', 'B', 'A'])).toBeInstanceOf(InterpreterError);
            expect(new SyntaxError('syntax')).toBeInstanceOf(InterpreterError);
        });

        it('Should parse, evaluate and unparse a simple real expression.', () => {
            const tree = interpreter.Parse('1+2*3');
            const value = interpreter.Evaluate(tree);
            const unparsed = interpreter.Unparse(tree);
            expect(value.list[0].re.toNumber()).toBe(7);
            expect(unparsed === '1+2*3\n').toBe(true);
        });

        it('Should reject detached colon and end nodes with stable semantic diagnostics.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Evaluator(AST.nodeColon())).toThrow('indeterminate colon. The colon to refer a range is valid only in indexing.');
            expect(() => localInterpreter.Evaluator(AST.nodeEndRange())).toThrow("indeterminate end of range. The word 'end' to refer a value is valid only in indexing.");
        });

        it('Should unparse typed prefix and postfix operation nodes.', () => {
            const localInterpreter = Interpreter.Create();
            const prefix = AST.nodeOperation('++_', AST.nodeIdentifier('i'));
            const postfix = AST.nodeOperation('_++', AST.nodeIdentifier('j'));
            const transpose = AST.nodeOperation(".'", AST.nodeIdentifier('A'));

            expect(localInterpreter.Unparse(prefix)).toBe('++i');
            expect(localInterpreter.Unparse(postfix)).toBe('j++');
            expect(localInterpreter.Unparse(transpose)).toBe("A.'");
            expect(localInterpreter.UnparserMathML(postfix)).toBe('<mi>j</mi><mo form="postfix" stretchy="true">++</mo>');
        });

        it('Should short-circuit scalar logical operators.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('0 && missingName'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('1 || missingName'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 0; y = 0 && (x = 1); x; y'))).toBe('x=0\ny=false\n0\nfalse\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 0; y = 1 || (x = 1); x; y'))).toBe('x=0\ny=true\n0\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 0; y = 1 && (x = 5); x; y'))).toBe('x=0\ny=true\n5\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 0; y = 0 || (x = 6); x; y'))).toBe('x=0\ny=true\n6\ntrue\n');
        });

        it('Should continue logical lines with ellipsis without requiring leading whitespace.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n% comment\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n%{\nblock\n%}\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1,...\n2]; A'))).toBe('A=[1,2]\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1,...\n%{\nblock\n%}\n2]; A'))).toBe('A=[1,2]\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['f = @(x, y) x + y;', 'f(1,...', '2)'].join('\n')))).toBe('f=@(x,y) x+y\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = sin(...\n0)'))).toBe('x=0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n2\n% comment\ny = 3; x + y'))).toBe('x=3\ny=3\n6\n');
        });

        it('Should continue logical lines inside parentheses.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = (1\n+ 2); x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = sin(\n0\n); x'))).toBe('x=0\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [10, 20, 30]; x = A(\n2\n); x'))).toBe('A=[10,20,30]\nx=20\n20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = (1\n% comment\n+ 2); x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = (1\n%{\nblock\n%}\n+ 2); x'))).toBe('x=3\n3\n');
            localInterpreter.Execute(['function y = addtwolines(a, b)', '  y = a + b;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = addtwolines(1,\n2); x'))).toBe('x=3\n3\n');
        });

        it('Should expand cell and structure comma-separated lists for multiple assignment.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {10, 20}; [a, b] = C{:};'))).toBe('C={10,20}\na=10\nb=20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S(1).x = 1; S(2).x = 2; [a, b] = S.x;'))).toBe(
                'S=[struct {\nx: 1\n}]\nS=[struct {\nx: 1\n},struct {\nx: 2\n}]\na=1\nb=2\n',
            );
            expect(() => localInterpreter.Execute('[u, v, w] = C{:};')).toThrow('element number 3 undefined in return list');
            expect(() => localInterpreter.Execute('[u, v, w] = S.x;')).toThrow('element number 3 undefined in return list');
        });

        it('Should reject non-expression values in interpreter-owned comma-separated lists.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterReturnListHarness;
            const returnList = localInterpreter.valueReturnList([AST.nodeReturn()]);
            const unknownReturnList = localInterpreter.valueReturnList([undefined]);

            expect(AST.isNodeReturnList(returnList)).toBe(true);
            expect(() => returnList.handler(1)).toThrow("Return value 'out1' is not an expression.");
            expect(() => unknownReturnList.handler(1)).toThrow("Return value 'out1' is not an expression.");
        });

        it('Should preserve output masks captured by interpreter-owned comma-separated lists.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterReturnListHarness;
            localInterpreter.context.pushRequestedOutputCount(2);
            localInterpreter.context.pushRequestedOutputMask([false, true]);
            const returnList = localInterpreter.valueReturnList([AST.nodeReturn(), Complex.create(2)]);
            localInterpreter.context.popRequestedOutputMask();
            localInterpreter.context.popRequestedOutputCount();

            const evaluated = returnList.handler(2);

            expect(localInterpreter.Unparse(returnList.selector(evaluated, 1))).toBe('2');
            expect(() => returnList.selector(evaluated, 0)).toThrow('element number 1 undefined in return list');
        });

        it('Should reject non-expression values in for-loop iteration values.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterReturnListHarness;
            const target = AST.nodeIdentifier('k');
            const wideTarget = new MultiArray([1, 2], [[Complex.one(), Complex.one()]]);
            const row = new MultiArray([1, 1]);
            row.array[0][0] = AST.nodeReturn() as unknown as (typeof row.array)[0][0];
            const structure = new Structure({});
            structure.field.bad = AST.nodeReturn() as unknown as (typeof structure.field)[string];

            expect(() => localInterpreter.forLoopValues(AST.nodeReturn(), target)).toThrow("Expression value 'for' is not an expression.");
            expect(() => localInterpreter.forLoopValues(row, target)).toThrow("Expression value 'for1' is not an expression.");
            expect(() => localInterpreter.forLoopValues(structure, wideTarget)).toThrow("Expression value 'bad' is not an expression.");
        });

        it('Should reject non-expression values copied for for-loop assignments.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterReturnListHarness;
            const target = new MultiArray([1, 1], [[Complex.one()]]);
            const values = new MultiArray([1, 1]);
            values.array[0][0] = AST.nodeReturn() as unknown as (typeof values.array)[0][0];

            expect(() => localInterpreter.forLoopAssignmentValue(target, values)).toThrow("Expression value 'for1' is not an expression.");
        });

        it('Should validate values before linearizing expression sequences.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterReturnListHarness;
            const values = new MultiArray([1, 2], [[Complex.one(), Complex.one()]]);
            values.array[0][1] = AST.nodeReturn() as unknown as (typeof values.array)[0][0];

            expect(localInterpreter.linearExpressionValues(Complex.one(), 'value')).toHaveLength(1);
            expect(() => localInterpreter.linearExpressionValues(AST.nodeReturn(), 'value')).toThrow("Expression value 'value' is not an expression.");
            expect(() => localInterpreter.linearExpressionValues(values, 'value')).toThrow("Expression value 'value2' is not an expression.");
        });

        it('Should reject malformed nested assignment result lists.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterReturnListHarness;
            const malformed = AST.nodeListFirst(AST.nodeIdentifier('x'));
            const invalidAssignment = AST.nodeOperation('=', AST.nodeIdentifier('x'), Complex.one());
            if (!AST.isNodeBinaryOperation(invalidAssignment)) {
                throw new Error('expected binary assignment fixture.');
            }
            invalidAssignment.right = AST.nodeReturn() as NodeExpr;
            const invalidValue = AST.nodeListFirst(invalidAssignment);

            expect(() => localInterpreter.nestedAssignmentValue(malformed)).toThrow('invalid nested assignment result.');
            expect(() => localInterpreter.nestedAssignmentValue(invalidValue)).toThrow("Expression value 'assignment result' is not an expression.");
        });

        it('Should reject non-expression values forwarded by builtin and feval.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterBuiltInHarness;

            expect(() => localInterpreter.functions.builtin.func(AST.nodeReturn())).toThrow("Expression value 'builtin function' is not an expression.");
            expect(() => localInterpreter.functions.builtin.func(CharString.create('sin'), AST.nodeReturn())).toThrow("Expression value 'builtin1' is not an expression.");
            expect(() => localInterpreter.functions.feval.func(AST.nodeReturn())).toThrow("Expression value 'feval target' is not an expression.");
            expect(() => localInterpreter.functions.feval.func(FunctionHandle.create('sin') as unknown as NodeInput, AST.nodeReturn())).toThrow(
                "Expression value 'feval1' is not an expression.",
            );
        });

        it('Should reject non-expression values exposed through function handle workspace metadata.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterBuiltInHarness;
            const closure = Scope.create();
            closure.defineName('bad', AST.nodeReturn());
            const handle = FunctionHandle.create('captured');
            handle.closure = closure;

            expect(() => localInterpreter.functionHandleWorkspaceValue(AST.nodeReturn(), 'bad')).toThrow("Expression value 'workspace bad' is not an expression.");
            expect(() => localInterpreter.functionHandleWorkspaceInfo(handle)).toThrow("Expression value 'workspace bad' is not an expression.");
        });

        it('Should reject non-expression values forwarded to class methods.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;

            expect(() => localInterpreter.classMethodArgumentValues([AST.nodeReturn()], 'subsref')).toThrow("Expression value 'subsref1' is not an expression.");
        });

        it('Should reject non-expression values in object-array assignment values.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;
            const invalidArray = new MultiArray([1, 1]);
            invalidArray.array[0][0] = undefined as unknown as (typeof invalidArray.array)[0][0];

            expect(() => localInterpreter.assignmentValues(AST.nodeReturn(), 'assignment')).toThrow("Expression value 'assignment' is not an expression.");
            expect(() => localInterpreter.assignmentValues(invalidArray, 'assignment')).toThrow("Expression value 'assignment1' is not an expression.");
        });

        it('Should reject non-expression values while cloning assignment targets.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;
            const invalidTarget = new MultiArray([1, 1]);
            invalidTarget.array[0][0] = AST.nodeReturn() as unknown as (typeof invalidTarget.array)[0][0];

            expect(() => localInterpreter.cloneAssignmentTarget(AST.nodeReturn())).toThrow("Expression value 'assignment target' is not an expression.");
            expect(() => localInterpreter.cloneAssignmentTarget(invalidTarget)).toThrow("Expression value 'assignment target' is not an expression.");
        });

        it('Should reject non-expression values in native subscript descriptors.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;
            const subs = new MultiArray([1, 1], undefined, true);
            subs.array[0][0] = undefined as unknown as (typeof subs.array)[0][0];

            expect(() => localInterpreter.descriptorSubscripts(subs)).toThrow("Expression value 'subscript1' is not an expression.");
        });

        it('Should reject non-expression values selected by native subscripting.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;
            const structure = new Structure({});
            structure.field.bad = AST.nodeReturn() as unknown as (typeof structure.field)[string];
            const matrix = new MultiArray([1, 1]);
            matrix.array[0][0] = AST.nodeReturn() as unknown as (typeof matrix.array)[0][0];

            expect(() => localInterpreter.nativeSubscriptScalar(structure, { type: '.', subs: [CharString.create('bad')] })).toThrow("Expression value 'field bad' is not an expression.");
            expect(() => localInterpreter.nativeSubscriptScalar(matrix, { type: '()', subs: [Complex.one()] })).toThrow("Expression value 'indexed value' is not an expression.");
        });

        it('Should reject non-expression values in interpreter-owned expression lists.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;

            expect(() => localInterpreter.expressionList([AST.nodeReturn()], 'field')).toThrow("Expression value 'field1' is not an expression.");
        });

        it('Should reject non-expression values in boolean control arguments.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;

            expect(() => localInterpreter.booleanControlArgument(AST.nodeReturn(), 'inputname onlyVariableNames')).toThrow(
                "Expression value 'inputname onlyVariableNames' is not an expression.",
            );
        });

        it('Should expand cell content targets inside multiple assignment lists.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function [x, y] = pair()', '  x = 1;', '  y = 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {10, 20, 30}; [C{1:2}] = pair(); C'))).toBe('C={10,20,30}\nC={1,20,30}\nC={1,2,30}\n{1,2,30}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {10, 20, 30}; [C{[1, 3]}] = pair(); C'))).toBe('C={10,20,30}\nC={1,20,30}\nC={1,20,2}\n{1,20,2}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {10, 20, 30}; [C{end-1:end}] = pair(); C'))).toBe('C={10,20,30}\nC={10,1,30}\nC={10,1,2}\n{10,1,2}\n');
            expect(() => localInterpreter.Execute('C = {10, 20, 30}; [C{1:3}] = pair();')).toThrow('element number 3 undefined in return list');
        });

        it('Should apply compound assignments to structure fields.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('s.a = 1; s.a += 4; s.a'))).toBe('s=struct {\na: 1\n}\ns=struct {\na: 5\n}\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s.nested.value = 10; s.nested.value -= 3; s.nested.value'))).toBe(
                's=struct {\na: 5\nnested: struct {\nvalue: 10\n}\n}\ns=struct {\na: 5\nnested: struct {\nvalue: 7\n}\n}\n7\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('s.v = [1, 2, 3]; s.v(2) += 5; s.v'))).toBe(
                's=struct {\na: 5\nnested: struct {\nvalue: 7\n}\nv: [1,2,3]\n}\ns=struct {\na: 5\nnested: struct {\nvalue: 7\n}\nv: [1,7,3]\n}\n[1,7,3]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('s.c = {1, 2}; s.c{2} += 3; s.c'))).toBe(
                's=struct {\na: 5\nnested: struct {\nvalue: 7\n}\nv: [1,7,3]\nc: {1,2}\n}\ns=struct {\na: 5\nnested: struct {\nvalue: 7\n}\nv: [1,7,3]\nc: {1,5}\n}\n{1,5}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('s.c = {1, 2}; s.c{1:2} += [10, 20]; s.c'))).toBe(
                's=struct {\na: 5\nnested: struct {\nvalue: 7\n}\nv: [1,7,3]\nc: {1,2}\n}\ns=struct {\na: 5\nnested: struct {\nvalue: 7\n}\nv: [1,7,3]\nc: {11,22}\n}\n{11,22}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('S(1).x = 2; S(2).x = 3; S.x *= 2; [S.x]'))).toBe(
                'S=[struct {\nx: 2\n}]\nS=[struct {\nx: 2\n},struct {\nx: 3\n}]\nS=[struct {\nx: 4\n},struct {\nx: 6\n}]\n[4,6]\n',
            );
            expect(() => localInterpreter.Execute('missing.field += 1')).toThrow('missing.field must be defined first.');
        });

        it('Should assign empty arrays to indexed structure fields without deleting structure elements.', () => {
            const firstInterpreter = Interpreter.Create();
            const logicalInterpreter = Interpreter.Create();
            const rangeInterpreter = Interpreter.Create();

            expect(firstInterpreter.Unparse(firstInterpreter.Execute('S(1).a = 1; S(2).a = 2; S(1).a = []; [S.a]'))).toBe(
                'S=[struct {\na: 1\n}]\nS=[struct {\na: 1\n},struct {\na: 2\n}]\nS=[struct {\na: [ ](0x0)\n},struct {\na: 2\n}]\n[2]\n',
            );
            expect(logicalInterpreter.Unparse(logicalInterpreter.Execute('S(1).a = 1; S(2).a = 2; S([true, false]).a = []; [S.a]'))).toBe(
                'S=[struct {\na: 1\n}]\nS=[struct {\na: 1\n},struct {\na: 2\n}]\nS=[struct {\na: [ ](0x0)\n},struct {\na: 2\n}]\n[2]\n',
            );
            expect(rangeInterpreter.Unparse(rangeInterpreter.Execute('S(1).a = 1; S(2).a = 2; S(1:2).a = []; {S.a}'))).toBe(
                'S=[struct {\na: 1\n}]\nS=[struct {\na: 1\n},struct {\na: 2\n}]\nS=[struct {\na: [ ](0x0)\n},struct {\na: [ ](0x0)\n}]\n{[ ](0x0),[ ](0x0)}\n',
            );
        });

        it('Should delete row-vector and structure-array elements through linear indexing.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2, 3]; A(1) = []; A'))).toBe('A=[1,2,3]\nA=[2,3]\n[2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S(1).a = 1; S(2).a = 2; S(1) = []; [S.a]'))).toBe(
                'S=[struct {\na: 1\n}]\nS=[struct {\na: 1\n},struct {\na: 2\n}]\nS=[struct {\na: 2\n}]\n[2]\n',
            );
            expect(() => localInterpreter.Execute('A = [1, 2; 3, 4]; A(:, :) = []')).toThrow('a null assignment can only have one non-colon index');
        });

        it('Should treat empty arrays as neutral operands in non-empty concatenations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [[], 2]; B = [1, []]; C = [[], 1; [], 2]'))).toBe('A=[2]\nB=[1]\nC=[1;\n2]\n');
        });

        it('Should apply increment and decrement to assignable targets.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1; y = x++; [y, x]'))).toBe('x=1\ny=1\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2, 3]; z = ++A(2); [z, A]'))).toBe('A=[1,2,3]\nz=3\n[3,1,3,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s.a = 4; old = s.a--; [old, s.a]'))).toBe('s=struct {\na: 4\n}\nold=4\n[4,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S(1).x = 2; S(2).x = 3; ++S.x; [S.x]'))).toBe(
                'S=[struct {\nx: 2\n}]\nS=[struct {\nx: 2\n},struct {\nx: 3\n}]\n3\n4\n[3,4]\n',
            );
        });

        it('Should reject structure operands through math operation dispatch.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('s = struct("x", 1); s + 1')).toThrow('operator + is not defined for struct operands.');
            expect(() => localInterpreter.Execute('s = struct("x", 1); [s, s] * 2')).toThrow('operator * is not defined for struct operands.');
            expect(() => localInterpreter.Execute('s = struct("x", 1); -s')).toThrow('operator - is not defined for struct operands.');
        });

        it('Should expand comma-separated lists in calls and concatenation contexts.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function y = sum3(a, b, c)', '  y = a + b + c;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = countargs(varargin)', '  y = nargin;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b] = pair()', '  a = 1;', '  b = 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {1, 2, 3}; sum3(C{:})'))).toBe('C={1,2,3}\n6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S(1).x = 1; S(2).x = 2; S(3).x = 3; sum3(S.x)'))).toBe(
                'S=[struct {\nx: 1\n}]\nS=[struct {\nx: 1\n},struct {\nx: 2\n}]\nS=[struct {\nx: 1\n},struct {\nx: 2\n},struct {\nx: 3\n}]\n6\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('countargs(C{:})'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('plus(C{1:2})'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(varargin) nargin; f(C{:})'))).toBe('f=@(varargin) nargin\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('feval(@sum3, C{:})'))).toBe('6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [C{:}, 4]'))).toBe('A=[1,2,3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('B = [S.x, 4]'))).toBe('B=[1,2,3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('D = {C{:}, 4}'))).toBe('D={1,2,3,4}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('E = [pair(), 3]'))).toBe('E=[1,3]\n');
        });

        it('Should evaluate a switch case that matches the selector.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 2;', 'switch x', 'case 1', '  y = 10;', 'case 2', '  y = 20;', 'otherwise', '  y = 30;', 'end', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=2\n20\n20\n');
        });

        it('Should evaluate switch otherwise when no case matches.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 3;', 'switch x', 'case 1', '  y = 10;', 'case 2', '  y = 20;', 'otherwise', '  y = 30;', 'endswitch', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=3\n30\n30\n');
        });

        it('Should match switch cases against cell-array alternatives.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 3;', 'switch x', 'case {1, 2}', '  y = 10;', 'case {3, 4}', '  y = 20;', 'otherwise', '  y = 30;', 'end', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=3\n20\n20\n');
        });

        it('Should skip switch cell-array cases when no element matches.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 5;', 'switch x', 'case {1, 2}', '  y = 10;', 'case {3, 4}', '  y = 20;', 'otherwise', '  y = 30;', 'end', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=5\n30\n30\n');
        });

        it('Should continue switch cell-array matching after nonconformant alternatives.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(localInterpreter.Execute(['x = "beta";', 'switch x', 'case {"alpha", "beta"}', '  y = 10;', 'otherwise', '  y = 20;', 'end', 'y'].join('\n'))),
            ).toBe('x=beta\n10\n10\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(['alts = {"alpha", "beta"};', 'x = "beta";', 'switch x', 'case alts', '  y = 30;', 'otherwise', '  y = 40;', 'end', 'y'].join('\n')),
                ),
            ).toBe('alts={alpha,beta}\nx=beta\n30\n30\n');
            expect(
                localInterpreter.Unparse(localInterpreter.Execute(['x = [1, 2];', 'switch x', 'case {[1, 2, 3], [1, 2]}', '  y = 50;', 'otherwise', '  y = 60;', 'end', 'y'].join('\n'))),
            ).toBe('x=[1,2]\n50\n50\n');
        });

        it('Should compare switch cases with MATLAB-like value equality.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = [];', 'switch x', 'case []', '  y = 10;', 'otherwise', '  y = 20;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('y'))).toBe('10\n');

            localInterpreter.Execute(['x = 1;', 'switch x', 'case [1]', '  y = 30;', 'otherwise', '  y = 40;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('y'))).toBe('30\n');

            localInterpreter.Execute(['x = [1, 2];', 'switch x', 'case [1, 3]', '  y = 50;', 'otherwise', '  y = 60;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('y'))).toBe('60\n');

            localInterpreter.Execute(['x = @sin;', 'switch x', 'case @sin', '  y = 70;', 'otherwise', '  y = 80;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('y'))).toBe('70\n');
        });

        it('Should reject non-expression values while normalizing switch candidates.', () => {
            const localInterpreter = Interpreter.Create() as unknown as InterpreterClassMethodHarness;
            const scalar = new MultiArray([1, 1]);
            scalar.array[0][0] = AST.nodeReturn() as unknown as (typeof scalar.array)[0][0];
            const alternatives = new MultiArray([1, 1], undefined, true);
            alternatives.array[0][0] = AST.nodeReturn() as unknown as (typeof alternatives.array)[0][0];

            expect(() => localInterpreter.switchComparableValue(scalar)).toThrow("Expression value 'switch value' is not an expression.");
            expect(() => localInterpreter.switchCaseMatches(Complex.one(), alternatives)).toThrow("Expression value 'switch case1' is not an expression.");
        });

        it('Should allow a switch without a matching case or otherwise.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 3;', 'switch x', 'case 1', '  y = 10;', 'end', 'x'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=3\n3\n');
        });

        it('Should evaluate array-valued conditions as true only when all elements are true.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['if [true true]', '  y = 1;', 'else', '  y = 2;', 'end', 'y'].join('\n')))).toBe('1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['if [true false]', '  y = 3;', 'else', '  y = 4;', 'end', 'y'].join('\n')))).toBe('4\n4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['if []', '  y = 5;', 'else', '  y = 6;', 'end', 'y'].join('\n')))).toBe('6\n6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 0; while []; x = x + 1; end; x'))).toBe('x=0\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[] && missingName; [] || 7'))).toBe('false\ntrue\n');
        });

        it('Should evaluate a while loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'while x < 3', '  x = x + 1;', '  s = s + x;', 'endwhile'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should continue a while loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'while x < 5', '  x = x + 1;', '  if x == 3', '    continue', '  endif', '  s = s + x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('12\n');
        });

        it('Should break out of a while loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'while x < 5', '  x = x + 1;', '  if x == 3', '    break', '  endif', '  s = s + x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('3\n');
        });

        it('Should evaluate a do until loop at least once.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 10;', 'do', '  x = x + 1;', 'until x > 0'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('11\n');
        });

        it('Should evaluate a do until loop until its condition is true.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'do', '  x = x + 1;', '  s = s + x;', 'until x >= 3'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should continue a do until loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'do', '  x = x + 1;', '  if x == 3', '    continue', '  endif', '  s = s + x;', 'until x >= 5'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('12\n');
        });

        it('Should break out of a do until loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'do', '  x = x + 1;', '  if x == 3', '    break', '  endif', '  s = s + x;', 'until x >= 5'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('3\n');
        });

        it('Should evaluate a for loop over a range.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = 1:3', '  s = s + i;', 'endfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should evaluate a for loop over a row vector.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = [10, 20, 30]', '  s = s + i;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('60\n');
        });

        it('Should iterate character strings by character.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['count = 0;', 'last = "";', 'second = "";', 'for ch = "abc"', '  count = count + 1;', '  if count == 2', '    second = ch;', '  end', '  last = ch;', 'end'].join('\n'),
            );
            localInterpreter.Execute(['emptyCount = 0;', 'for ch = ""', '  emptyCount = emptyCount + 1;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('count; second; last; emptyCount'))).toBe('3\nb\nc\n0\n');
        });

        it('Should concatenate char vectors and preserve string arrays in matrix row expressions.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(["joined = '';", "for ch = 'abc'", '  joined = [joined, ch];', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute("[\"a\", \"b\"]; ['c', 'd']; joined; class([\"a\", \"b\"]); class(['a';'b']); ischar(['a';'b'])"))).toBe(
                '[a,b]\ncd\nabc\nstring\nchar\ntrue\n',
            );
        });

        it('Should index character strings as character vectors.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('s = "abcd";');

            expect(localInterpreter.Unparse(localInterpreter.Execute('s(2); s([1, 3]); s(2:3); s(end); s(end-1:end); s(:)'))).toBe('b\nac\nbc\nd\ncd\nabcd\n');
        });

        it('Should assign character string contents as character vectors.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s(2) = "X"; s'))).toBe('s=abcd\ns=aXcd\naXcd\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s(2) = 88; s'))).toBe('s=abcd\ns=aXcd\naXcd\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s([1, 4]) = "XY"; s'))).toBe('s=abcd\ns=XbcY\nXbcY\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s([1, 4]) = [88, 89]; s'))).toBe('s=abcd\ns=XbcY\nXbcY\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s(end+1) = "E"; s'))).toBe('s=abcd\ns=abcdE\nabcdE\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s(6) = "F"; s'))).toBe('s=abcd\ns=abcd F\nabcd F\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s([end, 1]) = "XY"; s'))).toBe('s=abcd\ns=YbcX\nYbcX\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s(2:3) = []; s'))).toBe('s=abcd\ns=ad\nad\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = "abcd"; s(end-1:end) = []; s'))).toBe('s=abcd\ns=ab\nab\n');
            expect(() => localInterpreter.Execute('s = "abcd"; s(2) = {"X"}')).toThrow('character string assignment requires character or numeric values.');
        });

        it('Should report character string dimensions as row character vectors.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('size("abc"); length("abc"); numel("abc"); rows("abc"); columns("abc"); ndims("abc")'))).toBe('[1,3]\n3\n3\n1\n3\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[r, c] = size("abc"); r; c'))).toBe('r=1\nc=3\n1\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(""); isscalar("abc"); isvector("abc"); isrow("abc"); iscolumn("abc"); ismatrix("abc")'))).toBe(
                'true\nfalse\ntrue\ntrue\nfalse\ntrue\n',
            );
        });

        it('Should convert values with char.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('char(65); char([65, 66, 67]); char("abc"); char(65.9)'))).toBe('A\nABC\nabc\nA\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('text = char([65, 66, 67]); text(2)'))).toBe('text=ABC\nB\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('char("ab", "c")'))).toBe('[a,b;\nc, ]\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute("iscellstr({\"a\"}); iscellstr({'a', 'bc'}); iscellstr({'a', 2}); cellstr(\"abc\"); cellstr([\"a\", \"bc\"]); char({'ab', 'cd'})"),
                ),
            ).toBe('false\ntrue\nfalse\n{abc}\n{a,bc}\n[a,b;\nc,d]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("iscellstr"); nargout("iscellstr"); nargin("cellstr"); nargout("cellstr")'))).toBe('1\n1\n1\n1\n');
            expect(() => localInterpreter.Execute('char({65})')).toThrow('char: invalid conversion input.');
            expect(() => localInterpreter.Execute('cellstr({1})')).toThrow('cellstr: C must be a cell array of character vectors.');
        });

        it('Should convert values with double.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('double(true); double(1 + 2i); double("ABC")'))).toBe('1\n1+2i\n[65,66,67]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('codes = double(char("ab", "c")); codes'))).toBe('codes=[97,98;\n99,32]\n[97,98;\n99,32]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('text = char([65, 66, 67]); double(text(2))'))).toBe('text=ABC\n66\n');
            expect(() => localInterpreter.Execute('double({"A"})')).toThrow('double: invalid conversion input.');
        });

        it('Should convert values with logical.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('logical(0); logical(-2); logical([0, 2; 3, true])'))).toBe('false\ntrue\n[false,true;\ntrue,true]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('logical(char([65, 0])); islogical(logical([1, 0])); nargin("logical")'))).toBe('[true,false]\ntrue\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('logical("")'))).toBe('[ ](0x0)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('NaN'))).toBe('NaN\n');
            expect(() => localInterpreter.Execute('logical(1 + 2i)')).toThrow('logical: complex and NaN values cannot be converted to logical.');
            expect(() => localInterpreter.Execute('logical(NaN)')).toThrow('logical: complex and NaN values cannot be converted to logical.');
            expect(() => localInterpreter.Execute('logical({"A"})')).toThrow('logical: invalid conversion input.');
        });

        it('Should classify finite, infinite, and NaN values.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('isnan(NaN); isinf(Inf); isfinite(1 + 2i)'))).toBe('true\ntrue\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isnan([1, NaN, Inf]); isinf([1, NaN, Inf]); isfinite([1, NaN, Inf])'))).toBe(
                '[false,true,false]\n[false,false,true]\n[true,false,false]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('isfinite("abc"); nargin("isnan"); nargin("isinf"); nargin("isfinite")'))).toBe('[true,true,true]\n1\n1\n1\n');
            expect(() => localInterpreter.Execute('isnan({"A"})')).toThrow('isnan: invalid conversion input.');
            expect(() => localInterpreter.Execute('isinf({"A"})')).toThrow('isinf: invalid conversion input.');
            expect(() => localInterpreter.Execute('isfinite({"A"})')).toThrow('isfinite: invalid conversion input.');
        });

        it('Should classify floating-point and integer storage classes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('isfloat(2); isfloat(3+7i); isfloat(true); isfloat("abc")'))).toBe('true\ntrue\nfalse\nfalse\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isinteger(2); isinteger([1, 2]); isinteger(true); isinteger("abc")'))).toBe('false\nfalse\nfalse\nfalse\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("isfloat"); nargin("isinteger")'))).toBe('1\n1\n');
        });

        it('Should evaluate for loops over matrix columns.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['count = 0;', 'last = 0;', 'for v = [1, 3; 2, 4]', '  count = count + 1;', '  last = v(2);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('count; last'))).toBe('2\n4\n');
        });

        it('Should evaluate complex for loop targets.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['for [a, b] = [1, 3; 2, 4]', '  s = a + b;', 'end'].join('\n')))).toBe('FOR [a,b]=[1,3;\n2,4]\ns=a+b\n\nENDFOR\n');
            localInterpreter.Execute(['total = 0;', 'for [a, b] = [1, 3; 2, 4]', '  total = total + a * b;', 'end'].join('\n'));
            localInterpreter.Execute(['last = 0;', 'for [~, b] = [1, 3; 2, 4]', '  last = b;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('total; last'))).toBe('14\n4\n');
        });

        it('Should iterate cell arrays by columns without unwrapping contents.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['total = 0;', 'lastClass = "";', 'for item = {10, 20}', '  lastClass = class(item);', '  total = total + item{1};', 'end'].join('\n'));
            localInterpreter.Execute(
                ['columnCount = 0;', 'columnTotal = 0;', 'for item = {1; 2}', '  columnCount = columnCount + 1;', '  columnTotal = item{1} + item{2};', 'end'].join('\n'),
            );
            localInterpreter.Execute(
                ['matrixCount = 0;', 'matrixTotal = 0;', 'for item = {1, 3; 2, 4}', '  matrixCount = matrixCount + 1;', '  matrixTotal = matrixTotal + item{1} * item{2};', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('total; lastClass; columnCount; columnTotal; matrixCount; matrixTotal'))).toBe('30\ncell\n1\n3\n2\n14\n');
        });

        it('Should evaluate Octave-style for loops over structure fields.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'S.a = 10;',
                    'S.b = 20;',
                    'lastValue = 0;',
                    'for value = S',
                    '  lastValue = value;',
                    'end',
                    'total = 0;',
                    'lastName = "";',
                    'for [value, name] = S',
                    '  total = total + value;',
                    '  lastName = name;',
                    'end',
                    'for [~, ignoredName] = S',
                    '  onlyName = ignoredName;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('lastValue; total; lastName; onlyName'))).toBe('20\n30\nb\nb\n');
        });

        it('Should continue a for loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = 1:5', '  if i == 3', '    continue', '  endif', '  s = s + i;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('12\n');
        });

        it('Should break out of a for loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = 1:5', '  if i == 3', '    break', '  endif', '  s = s + i;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('3\n');
        });

        it('Should assign for loop values to a structure field target.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['for s.value = 1:3', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s.value'))).toBe('3\n');
        });

        it('Should assign for loop values to an indexed target.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['A = [0, 0];', 'for A(2) = 1:3', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('A(2)'))).toBe('3\n');
        });

        it('Should evaluate a parenthesized for loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for (i = 1:3)', '  s = s + i;', 'endfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should evaluate a parfor loop sequentially.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'parfor i = 1:3', '  s = s + i;', 'endparfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should evaluate a parenthesized parfor loop with a worker expression.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'parfor (i = 1:3, 2)', '  s = s + i;', 'endparfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should validate MATLAB-style parfor loop headers before the sequential fallback.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['s = 0;', 'parfor i = 3:-1:1', '  s = s + i;', 'end', 's'].join('\n')))).toBe('s=0\n6\n6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['for A(1) = [1, 2]', 'end', 'A(1)'].join('\n')))).toBe('2\n');
            expect(() => localInterpreter.Execute(['parfor A(1) = 1:2', 'end'].join('\n'))).toThrow('parfor loop variable must be a simple identifier.');
            expect(() => localInterpreter.Execute(['parfor [a, b] = [1, 2; 3, 4]', 'end'].join('\n'))).toThrow('parfor loop variable must be a simple identifier.');
            expect(() => localInterpreter.Execute(['parfor i = [1, 3]', 'end'].join('\n'))).toThrow('parfor range must be a row vector of consecutive integer values.');
            expect(() => localInterpreter.Execute(['parfor i = [1; 2]', 'end'].join('\n'))).toThrow('parfor range must be a row vector of consecutive integer values.');
            expect(() => localInterpreter.Execute(['parfor i = {1, 2}', 'end'].join('\n'))).toThrow('parfor range must be a row vector of consecutive integer values.');
        });

        it('Should reject MATLAB-incompatible parfor body constructs before the sequential fallback.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  break', 'end'].join('\n'))).toThrow('break is not allowed inside a parfor loop.');
            expect(() => localInterpreter.Execute(['function y = parforreturn()', '  parfor i = 1:3', '    return', '  end', '  y = 1;', 'end', 'parforreturn()'].join('\n'))).toThrow(
                'return is not allowed inside a parfor loop.',
            );
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  global g', 'end'].join('\n'))).toThrow('global declarations are not allowed inside a parfor loop.');
            expect(() =>
                localInterpreter.Execute(['function y = parforpersistent()', '  parfor i = 1:3', '    persistent p', '  end', '  y = 1;', 'end', 'parforpersistent()'].join('\n')),
            ).toThrow('persistent declarations are not allowed inside a parfor loop.');
            expect(() => localInterpreter.Execute(['x = 1;', 'parfor i = 1:3', '  clear x', 'end'].join('\n'))).toThrow('clear is not allowed inside a parfor loop.');
            expect(() => localInterpreter.Execute(['x = 1;', 'parfor i = 1:3', "  clear('x')", 'end'].join('\n'))).toThrow('clear is not allowed inside a parfor loop.');
            expect(() => localInterpreter.Execute(['x = 1;', 'parfor i = 1:3', "  disp(clear('x'))", 'end'].join('\n'))).toThrow('clear is not allowed inside a parfor loop.');
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  spmd', '    x = 1;', '  end', 'end'].join('\n'))).toThrow('spmd is not allowed inside a parfor loop.');
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  parfor j = 1:2', '  end', 'end'].join('\n'))).toThrow('nested parfor loops are not allowed.');
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  i = i + 1;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  i(1) = 2;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  [i, other] = deal(1, 2);', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  i .*= 2;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  i ./= 2;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  i .^= 2;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  i &= true;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
            expect(() => localInterpreter.Execute(['parfor i = 1:3', '  i |= false;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'i' is not allowed.");
        });

        it('Should allow continue inside a parfor loop sequential fallback.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'parfor i = 1:4', '  if i == 2', '    continue', '  end', '  s = s + i;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('8\n');
        });

        it('Should preserve parfor worker expressions in the AST while executing sequentially.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['parfor (i = 1:3, workers + 1)', '  last = i;', 'end'].join('\n')))).toBe(
                'PARFOR (i=1:3,workers+1)\nlast=i\n\nENDPARFOR\n',
            );
            localInterpreter.Execute('workers = 2; s = 0;');
            localInterpreter.Execute(['parfor (i = 1:3, workers + 1)', '  s = s + i;', 'endparfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should evaluate parfor worker expressions once before the sequential loop body.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['count = 0;', 'parfor (i = 1:2, count += 1)', '  x = i;', 'end', 'count; x'].join('\n')))).toBe('count=0\n2\n1\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['parfor (i = 1:2, 0)', '  x = i;', 'end', 'x'].join('\n')))).toBe('2\n2\n');
            expect(() => localInterpreter.Execute(['x = 0;', 'parfor (i = 1:2, missingWorkers)', '  x = i;', 'end'].join('\n'))).toThrow("'missingWorkers' undefined.");
            expect(() => localInterpreter.Execute(['x = 0;', 'parfor (i = 1:2, -1)', '  x = i;', 'end'].join('\n'))).toThrow('parfor workers must be a nonnegative integer.');
            expect(() => localInterpreter.Execute(['x = 0;', 'parfor (i = 1:2, 1.5)', '  x = i;', 'end'].join('\n'))).toThrow('parfor workers must be a nonnegative integer.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('0\n');
        });

        it('Should parse and evaluate an spmd block sequentially.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['spmd', '  x = 1;', '  y = x + 2;', 'endspmd'].join('\n')))).toBe('SPMD\nx=1\ny=x+2\n\nENDSPMD\n');
            localInterpreter.Execute(['x = 0;', 'spmd', '  x = x + 1;', '  y = x + 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x; y'))).toBe('1\n3\n');
        });

        it('Should preserve MATLAB-style spmd worker specifications while executing sequentially.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['spmd (workers)', '  x = 1;', 'endspmd'].join('\n')))).toBe('SPMD (workers)\nx=1\n\nENDSPMD\n');
            expect(localInterpreter.Unparse(localInterpreter.Parse(['spmd (minWorkers, maxWorkers)', '  x = 2;', 'end'].join('\n')))).toBe('SPMD (minWorkers,maxWorkers)\nx=2\n\nENDSPMD\n');
            localInterpreter.Execute(['x = 0;', 'spmd (2, 4)', '  x = x + 1;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('1\n');
        });

        it('Should evaluate MATLAB-style spmd worker specifications before the sequential body.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['count = 0;', 'spmd (count += 1)', '  x = count;', 'end', 'count; x'].join('\n')))).toBe('count=0\n1\n1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['spmd (0, 2)', '  x = 2;', 'end', 'x'].join('\n')))).toBe('2\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['spmd (2, 2)', '  x = 3;', 'end', 'x'].join('\n')))).toBe('3\n3\n');
            expect(() => localInterpreter.Execute(['x = 0;', 'spmd (missingWorkers)', '  x = 1;', 'end'].join('\n'))).toThrow("'missingWorkers' undefined.");
            expect(() => localInterpreter.Execute(['x = 0;', 'spmd ("workers")', '  x = 1;', 'end'].join('\n'))).toThrow('spmd worker 1 must be a nonnegative integer.');
            expect(() => localInterpreter.Execute(['x = 0;', 'spmd (1, 2.5)', '  x = 1;', 'end'].join('\n'))).toThrow('spmd worker 2 must be a nonnegative integer.');
            expect(() => localInterpreter.Execute(['x = 0;', 'spmd (3, 2)', '  x = 1;', 'end'].join('\n'))).toThrow('spmd minimum worker count cannot exceed maximum worker count.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('0\n');
        });

        it('Should expose spmdIndex and spmdSize inside the sequential spmd fallback.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['spmd', '  x = spmdIndex;', '  y = spmdSize;', 'end', 'x; y'].join('\n')))).toBe('1\n1\n1\n1\n');
            expect(
                localInterpreter.Unparse(localInterpreter.Execute(['spmdIndex = 99;', 'spmdSize = 88;', 'spmd', '  x = spmdIndex + spmdSize;', 'end', 'spmdIndex; spmdSize; x'].join('\n'))),
            ).toBe('spmdIndex=99\nspmdSize=88\n2\n99\n88\n2\n');
        });

        it('Should render loop and exception control nodes as MathML.', () => {
            const localInterpreter = Interpreter.Create();
            const samples = [
                ['if x == 1', '  y = 1;', 'elseif x == 2', '  y = 2;', 'else', '  y = 3;', 'end'].join('\n'),
                ['switch x', 'case 1', '  y = 1;', 'case 2', '  y = 2;', 'otherwise', '  y = 3;', 'end'].join('\n'),
                ['while x < 2', '  x = x + 1;', 'end'].join('\n'),
                ['do', '  x = x + 1;', 'until x > 2'].join('\n'),
                ['for i = 1:3', '  x = i;', 'end'].join('\n'),
                ['for i = 1:3', '  if i == 2', '    break', '  end', 'end'].join('\n'),
                ['for i = 1:3', '  if i == 2', '    continue', '  end', 'end'].join('\n'),
                ['parfor (i = 1:3, workers + 1)', '  x = i;', 'end'].join('\n'),
                ['spmd (minWorkers, maxWorkers)', '  x = 1;', 'endspmd'].join('\n'),
                ['try', '  missing;', 'catch ME', '  msg = ME.message;', 'end'].join('\n'),
                ['unwind_protect', '  x = 1;', 'unwind_protect_cleanup', '  x = 2;', 'end_unwind_protect'].join('\n'),
            ];

            for (const source of samples) {
                const mathml = localInterpreter.ToMathML(source);
                expect(mathml).not.toContain('invalid');
                expect(mathml).not.toContain('Unparse error');
            }
            expect(localInterpreter.ToMathML(['spmd (minWorkers, maxWorkers)', '  x = 1;', 'endspmd'].join('\n'))).toContain('minWorkers');
            expect(localInterpreter.ToMathML(['parfor (i = 1:3, workers + 1)', '  x = i;', 'end'].join('\n'))).toContain('workers');
            expect(localInterpreter.ToMathML(['if x == 1', '  y = 1;', 'elseif x == 2', '  y = 2;', 'end'].join('\n'))).toContain('2');
            expect(localInterpreter.ToMathML(['switch x', 'case 1', '  y = 1;', 'otherwise', '  y = 2;', 'end'].join('\n'))).toContain('otherwise');
        });

        it('Should render function, arguments, and classdef AST nodes as MathML.', () => {
            const localInterpreter = Interpreter.Create();
            const functionMathML = localInterpreter.ToMathML(['function y = checked(x)', '  arguments', '    x (1,1) double {mustBePositive} = 1', '  end', '  y = x;', 'end'].join('\n'));
            const classMathML = localInterpreter.ToMathML(
                [
                    'classdef (Sealed) RenderedClass < handle',
                    '  properties (Access = private)',
                    '    x (1,1) double = 1',
                    '  end',
                    '  methods (Abstract)',
                    '    y = value(obj)',
                    '  end',
                    '  events',
                    '    Changed',
                    '  end',
                    '  enumeration',
                    '    One(1)',
                    '  end',
                    'end',
                ].join('\n'),
            );

            for (const mathml of [functionMathML, classMathML]) {
                expect(mathml).not.toContain('invalid');
                expect(mathml).not.toContain('Unparse error');
            }
            expect(functionMathML).toContain('function');
            expect(functionMathML).toContain('arguments');
            expect(functionMathML).toContain('mustBePositive');
            expect(classMathML).toContain('classdef');
            expect(classMathML).toContain('RenderedClass');
            expect(classMathML).toContain('enumeration');
            expect(classMathML).toContain('Changed');
        });

        it('Should reject MATLAB-incompatible spmd body constructs before the sequential fallback.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['spmd', '  break', 'endspmd'].join('\n'))).toThrow('break is not allowed inside an spmd block.');
            expect(() => localInterpreter.Execute(['spmd', '  continue', 'endspmd'].join('\n'))).toThrow('continue is not allowed inside an spmd block.');
            expect(() => localInterpreter.Execute(['function y = spmdreturn()', '  spmd', '    return', '  end', '  y = 1;', 'end', 'spmdreturn()'].join('\n'))).toThrow(
                'return is not allowed inside an spmd block.',
            );
            expect(() => localInterpreter.Execute(['spmd', '  global g', 'end'].join('\n'))).toThrow('global declarations are not allowed inside an spmd block.');
            expect(() => localInterpreter.Execute(['function y = spmdpersistent()', '  spmd', '    persistent p', '  end', '  y = 1;', 'end', 'spmdpersistent()'].join('\n'))).toThrow(
                'persistent declarations are not allowed inside an spmd block.',
            );
            expect(() => localInterpreter.Execute(['x = 1;', 'spmd', '  clear x', 'end'].join('\n'))).toThrow('clear is not allowed inside an spmd block.');
            expect(() => localInterpreter.Execute(['x = 1;', 'spmd', "  clear('x')", 'end'].join('\n'))).toThrow('clear is not allowed inside an spmd block.');
            expect(() => localInterpreter.Execute(['x = 1;', 'spmd', "  disp(clear('x'))", 'end'].join('\n'))).toThrow('clear is not allowed inside an spmd block.');
            expect(() => localInterpreter.Execute(['spmd', '  spmd', '    x = 1;', '  end', 'end'].join('\n'))).toThrow('nested spmd blocks are not allowed.');
            expect(() => localInterpreter.Execute(['spmd', '  parfor i = 1:2', '    x = i;', '  end', 'end'].join('\n'))).toThrow('parfor is not allowed inside an spmd block.');
            expect(() => localInterpreter.Execute(['spmd', '  f = @(x) x + 1;', 'end'].join('\n'))).toThrow('anonymous function definitions are not allowed inside an spmd block.');
        });

        it('Should reject break and continue outside loops.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('break')).toThrow('break is only valid inside a loop.');
            expect(() => localInterpreter.Execute('continue')).toThrow('continue is only valid inside a loop.');
        });

        it('Should stop top-level execution on return without raising an error.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1; return; x = 2;'))).toBe('x=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['y = 3;', 'if y > 0', '  return', 'end', 'y = 4;'].join('\n')))).toBe('y=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('return'))).toBe('');
        });

        it('Should reject function definitions inside executable control blocks.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['function y = directlocal()', '  y = 3;', 'end', 'directlocal()'].join('\n')))).toBe('3\n');
            expect(() => localInterpreter.Execute(['if true', '  function y = hiddeniflocal()', '    y = 1;', '  end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddeniflocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['if false', '  function y = hiddeninactiveiflocal()', '    y = 1;', '  end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddeninactiveiflocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['for k = 1:1', '  function y = hiddenforlocal()', '    y = k;', '  end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddenforlocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['parfor k = 1:1', '  function y = hiddenparforlocal()', '    y = k;', '  end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddenparforlocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['while false', '  function y = hiddenwhilelocal()', '    y = 1;', '  end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddenwhilelocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['switch 1', '  case 1', '    function y = hiddencaselocal()', '      y = 1;', '    end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddencaselocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['spmd', '  function y = hiddenspmdlocal()', '    y = 1;', '  end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddenspmdlocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['try', '  x = 1;', 'catch', '  function y = hiddencatchlocal()', '    y = 1;', '  end', 'end'].join('\n'))).toThrow(
                "function definition 'hiddencatchlocal' is not allowed inside a control block.",
            );
            expect(() =>
                localInterpreter.Execute(['unwind_protect', '  function y = hiddenunwindlocal()', '    y = 1;', '  end', 'unwind_protect_cleanup', '  x = 1;', 'end'].join('\n')),
            ).toThrow("function definition 'hiddenunwindlocal' is not allowed inside a control block.");
            expect(() =>
                localInterpreter.Execute(
                    ['function y = outerhiddenlocal()', '  if true', '    function z = hiddennested()', '      z = 1;', '    end', '  end', '  y = 1;', 'end', 'outerhiddenlocal()'].join(
                        '\n',
                    ),
                ),
            ).toThrow("function definition 'hiddennested' is not allowed inside a control block.");
        });

        it('Should reject class definitions inside executable control blocks.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(['classdef DirectLocalControlClass', '  properties', '    Value = 4;', '  end', 'end', 'DirectLocalControlClass().Value'].join('\n')),
                ),
            ).toBe('4\n');
            expect(() => localInterpreter.Execute(['if true', '  classdef HiddenIfControlClass', '    properties', '      Value = 1;', '    end', '  end', 'end'].join('\n'))).toThrow(
                "class definition 'HiddenIfControlClass' is not allowed inside a control block.",
            );
            expect(() =>
                localInterpreter.Execute(['if false', '  classdef HiddenInactiveIfControlClass', '    properties', '      Value = 1;', '    end', '  end', 'end'].join('\n')),
            ).toThrow("class definition 'HiddenInactiveIfControlClass' is not allowed inside a control block.");
            expect(() => localInterpreter.Execute(['for k = 1:1', '  classdef HiddenForControlClass', '    properties', '      Value = k;', '    end', '  end', 'end'].join('\n'))).toThrow(
                "class definition 'HiddenForControlClass' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute(['parfor k = 1:1', '  classdef HiddenParforControlClass', '  end', 'end'].join('\n'))).toThrow(
                "class definition 'HiddenParforControlClass' is not allowed inside a control block.",
            );
            expect(() =>
                localInterpreter.Execute(['switch 1', '  case 2', '    classdef HiddenCaseControlClass', '      properties', '        Value = 1;', '      end', '    end', 'end'].join('\n')),
            ).toThrow("class definition 'HiddenCaseControlClass' is not allowed inside a control block.");
            expect(() => localInterpreter.Execute(['spmd', '  classdef HiddenSpmdControlClass', '  end', 'end'].join('\n'))).toThrow(
                "class definition 'HiddenSpmdControlClass' is not allowed inside a control block.",
            );
            expect(() =>
                localInterpreter.Execute(['try', '  x = 1;', 'catch', '  classdef HiddenCatchControlClass', '    properties', '      Value = 1;', '    end', '  end', 'end'].join('\n')),
            ).toThrow("class definition 'HiddenCatchControlClass' is not allowed inside a control block.");
            expect(() => localInterpreter.Execute(['unwind_protect', '  x = 1;', 'unwind_protect_cleanup', '  classdef HiddenUnwindCleanupControlClass', '  end', 'end'].join('\n'))).toThrow(
                "class definition 'HiddenUnwindCleanupControlClass' is not allowed inside a control block.",
            );
            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = outerhiddenclass()',
                        '  if true',
                        '    classdef HiddenNestedControlClass',
                        '      properties',
                        '        Value = 1;',
                        '      end',
                        '    end',
                        '  end',
                        '  y = 1;',
                        'end',
                        'outerhiddenclass()',
                    ].join('\n'),
                ),
            ).toThrow("class definition 'HiddenNestedControlClass' is not allowed inside a control block.");
        });

        it('Should reject class definitions inside function bodies.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        ['classdef DirectFunctionBodyClass', '  methods', '    function y = value(obj)', '      y = 4;', '    end', '  end', 'end', 'DirectFunctionBodyClass().value()'].join(
                            '\n',
                        ),
                    ),
                ),
            ).toBe('4\n');
            expect(() =>
                localInterpreter.Execute(['function y = classinsidefunction()', '  classdef NestedFunctionClass', '  end', '  y = 1;', 'end', 'classinsidefunction()'].join('\n')),
            ).toThrow("class definition 'NestedFunctionClass' is not allowed inside a function.");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = outerclassinsidefunction()',
                        '  function z = innerclassinsidefunction()',
                        '    classdef NestedInnerFunctionClass',
                        '    end',
                        '    z = 1;',
                        '  end',
                        '  y = innerclassinsidefunction();',
                        'end',
                        'outerclassinsidefunction()',
                    ].join('\n'),
                ),
            ).toThrow("class definition 'NestedInnerFunctionClass' is not allowed inside a function.");
        });

        it('Should evaluate a try body when no error is thrown.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['try', '  x = 1;', 'catch', '  x = 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('1\n');
        });

        it('Should evaluate a catch body when the try body throws.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['try', '  x = missing + 1;', 'catch', '  x = 2;', 'end_try_catch'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('2\n');
        });

        it('Should bind a MATLAB-like catch identifier.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['try', '  missing;', 'catch ME', '  msg = ME.message;', 'end'].join('\n')))).toBe(
                'TRY\nmissing\n\nCATCH ME\nmsg=ME.message\n\nEND_TRY_CATCH\n',
            );
            localInterpreter.Execute(['try', '  missing;', 'catch ME', '  msg = ME.message;', '  id = ME.identifier;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('msg; id'))).toBe("'missing' undefined.\nmissing\n");
        });

        it('Should expose caught errors through lasterror inside and after catch blocks.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'try',
                    '  error("mathjslab:caughtLastError", "caught last error");',
                    'catch ME',
                    '  err = lasterror();',
                    '  msgFromME = ME.message;',
                    '  idFromME = ME.identifier;',
                    '  msgFromLastError = err.message;',
                    '  idFromLastError = err.identifier;',
                    'end',
                    'afterCatch = lasterror();',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('msgFromME; idFromME; msgFromLastError; idFromLastError; afterCatch.message; afterCatch.identifier'))).toBe(
                'caught last error\nmathjslab:caughtLastError\ncaught last error\nmathjslab:caughtLastError\ncaught last error\nmathjslab:caughtLastError\n',
            );
        });

        it('Should expose caught errors through lasterr when catch has no identifier.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['try', '  error("mathjslab:caughtLastErr", "caught last err");', 'catch', '  [msg, id] = lasterr();', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('msg; id'))).toBe('caught last err\nmathjslab:caughtLastErr\n');
        });

        it('Should preserve thrown stack frames in catch identifiers.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'function y = stackinner()',
                    '  missingStackValue;',
                    'end',
                    'function y = stackouter()',
                    '  y = stackinner();',
                    'end',
                    'try',
                    '  stackouter();',
                    'catch ME',
                    '  stackName1 = ME.stack(1).name;',
                    '  stackLine1 = ME.stack(1).line;',
                    '  stackName2 = ME.stack(2).name;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('stackName1; stackLine1; stackName2'))).toBe('stackinner\n5\nstackouter\n');
        });

        it('Should preserve virtual source files in caught error stacks.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    stackerrorfile: {
                        sourceName: '+pkg/stackerrorfile.m',
                        source: [
                            'function y = stackerrorfile()',
                            '  y = stackerrorfilelocal();',
                            'end',
                            'function y = stackerrorfilelocal()',
                            '  error("mathjslab:stackfile", "virtual stack failure");',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            localInterpreter.Execute(
                [
                    'try',
                    '  stackerrorfile();',
                    'catch ME',
                    '  stackFile1 = ME.stack(1).file;',
                    '  stackName1 = ME.stack(1).name;',
                    '  stackFile2 = ME.stack(2).file;',
                    '  stackName2 = ME.stack(2).name;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('stackFile1; stackName1; stackFile2; stackName2'))).toBe(
                '+pkg/stackerrorfile.m\nstackerrorfilelocal\n+pkg/stackerrorfile.m\nstackerrorfile\n',
            );
        });

        it('Should preserve virtual source files when returned nested handles throw.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    '+pkg/makenestederrorhandle.m': {
                        source: [
                            'function h = makenestederrorhandle()',
                            '  function fail()',
                            '    error("mathjslab:nestedHandleStack", "nested handle failure");',
                            '  end',
                            '  h = @fail;',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            localInterpreter.Execute(
                ['h = pkg.makenestederrorhandle();', 'try', '  h();', 'catch ME', '  nestedHandleFile = ME.stack(1).file;', '  nestedHandleName = ME.stack(1).name;', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('nestedHandleFile; nestedHandleName'))).toBe('+pkg/makenestederrorhandle.m\nfail\n');
        });

        it('Should preserve host classdef source files in caught method error stacks.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '@StackErrorInline/StackErrorInline.m': [
                        'classdef StackErrorInline',
                        '  methods',
                        '    function fail(obj)',
                        '      error("mathjslab:inlineClassStack", "inline class stack failure");',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            localInterpreter.Execute(
                ['obj = StackErrorInline();', 'try', '  obj.fail();', 'catch ME', '  methodFile = ME.stack(1).file;', '  methodName = ME.stack(1).name;', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('methodFile; methodName'))).toBe('@StackErrorInline/StackErrorInline.m\nfail\n');
        });

        it('Should throw and catch user errors with optional identifiers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('error("plain failure")')).toThrow('plain failure');
            expect(() => localInterpreter.Execute('error("mathjslab:test", "identified failure")')).toThrow('identified failure');
            expect(() => localInterpreter.Execute('error(1)')).toThrow("Invalid call to error. Type 'help error' to see correct usage.");

            localInterpreter.Execute(['try', '  error("mathjslab:catch", "caught failure");', 'catch ME', '  msg = ME.message;', '  id = ME.identifier;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('msg; id'))).toBe('caught failure\nmathjslab:catch\n');
        });

        it('Should expose uncaught user errors through lasterror.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = usererrorinner()',
                        '  error("mathjslab:user", "user failure");',
                        'end',
                        'function y = usererrorouter()',
                        '  y = usererrorinner();',
                        'end',
                        'usererrorouter();',
                    ].join('\n'),
                ),
            ).toThrow('user failure');

            localInterpreter.Execute('err = lasterror();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier; err.stack(1).name; err.stack(2).name'))).toBe(
                'user failure\nmathjslab:user\nusererrorinner\nusererrorouter\n',
            );
        });

        it('Should expose virtual source files in lasterror stacks.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    laststackfile: {
                        sourceName: '+pkg/laststackfile.m',
                        source: ['function y = laststackfile()', '  y = laststackfilelocal();', 'end', 'function y = laststackfilelocal()', '  missingLastStackFile;', 'end'].join('\n'),
                    },
                },
            });

            expect(() => localInterpreter.Execute('laststackfile();')).toThrow("'missingLastStackFile' undefined.");
            localInterpreter.Execute('err = lasterror();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('err.stack(1).file; err.stack(1).name; err.stack(2).file; err.stack(2).name'))).toBe(
                '+pkg/laststackfile.m\nlaststackfilelocal\n+pkg/laststackfile.m\nlaststackfile\n',
            );
        });

        it('Should set and reset lasterror with MATLAB/Octave-like structures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('missingForLastErrorSetter;')).toThrow("'missingForLastErrorSetter' undefined.");
            localInterpreter.Execute('previous = lasterror(struct("message", "manual failure", "identifier", "mathjslab:manual")); current = lasterror();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('previous.message; current.message; current.identifier; length(current.stack)'))).toBe(
                "'missingForLastErrorSetter' undefined.\nmanual failure\nmathjslab:manual\n0\n",
            );

            localInterpreter.Execute('previousReset = lasterror("reset"); resetValue = lasterror();');

            expect(
                localInterpreter.Unparse(localInterpreter.Execute('previousReset.message; previousReset.identifier; resetValue.message; resetValue.identifier; length(resetValue.stack)')),
            ).toBe('manual failure\nmathjslab:manual\n\n\n0\n');
            expect(() => localInterpreter.Execute('lasterror("clear")')).toThrow('Invalid call to lasterror.');
            expect(() => localInterpreter.Execute('lasterror(struct("message", 1))')).toThrow('lasterror: error structure message and identifier fields must be strings.');
        });

        it('Should query and set lasterr through the same last-error state.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('missingForLastErr;')).toThrow("'missingForLastErr' undefined.");
            localInterpreter.Execute('[messageBefore, identifierBefore] = lasterr(); [messageSet, identifierSet] = lasterr("manual lasterr", "mathjslab:lasterr"); err = lasterror();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('messageBefore; identifierBefore; messageSet; identifierSet; err.message; err.identifier; length(err.stack)'))).toBe(
                "'missingForLastErr' undefined.\nmissingForLastErr\nmanual lasterr\nmathjslab:lasterr\nmanual lasterr\nmathjslab:lasterr\n0\n",
            );

            localInterpreter.Execute('lasterr("message only"); [messageOnly, identifierOnly] = lasterr();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('messageOnly; identifierOnly'))).toBe('message only\n\n');
            expect(() => localInterpreter.Execute('lasterr(1)')).toThrow('Invalid call to lasterr.');
        });

        it('Should rethrow MATLAB-like caught error structures.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'try',
                    '  try',
                    '    error("mathjslab:inner", "inner failure");',
                    '  catch ME',
                    '    rethrow(ME);',
                    '  end',
                    'catch OUTER',
                    '  msg = OUTER.message;',
                    '  id = OUTER.identifier;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('msg; id'))).toBe('inner failure\nmathjslab:inner\n');
            expect(() => localInterpreter.Execute('rethrow("not an error")')).toThrow("Invalid call to rethrow. Type 'help rethrow' to see correct usage.");
            expect(() => localInterpreter.Execute('rethrow(struct())')).toThrow('rethrow: input must be an error structure.');
        });

        it('Should preserve caught error stacks when rethrowing from another function.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function originalstackleaf()',
                    '  error("mathjslab:original", "original failure");',
                    'end',
                    'function originalstackouter()',
                    '  originalstackleaf();',
                    'end',
                    'function relaystackerror(ME)',
                    '  rethrow(ME);',
                    'end',
                    'try',
                    '  try',
                    '    originalstackouter();',
                    '  catch ME',
                    '    relaystackerror(ME);',
                    '  end',
                    'catch OUTER',
                    '  stackName1 = OUTER.stack(1).name;',
                    '  stackName2 = OUTER.stack(2).name;',
                    '  stackIdentifier = OUTER.identifier;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('stackName1; stackName2; stackIdentifier'))).toBe('originalstackleaf\noriginalstackouter\nmathjslab:original\n');
        });

        it('Should expose uncaught rethrown errors through lasterror.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = rethrowinner()',
                        '  try',
                        '    error("mathjslab:rethrow", "rethrown failure");',
                        '  catch ME',
                        '    rethrow(ME);',
                        '  end',
                        'end',
                        'function y = rethrowouter()',
                        '  y = rethrowinner();',
                        'end',
                        'rethrowouter();',
                    ].join('\n'),
                ),
            ).toThrow('rethrown failure');

            localInterpreter.Execute('err = lasterror();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier; err.stack(1).name; err.stack(2).name'))).toBe(
                'rethrown failure\nmathjslab:rethrow\nrethrowinner\nrethrowouter\n',
            );
        });

        it('Should expose the last uncaught error through lasterror.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('initial = lasterror();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('initial.message; initial.identifier; length(initial.stack)'))).toBe('\n\n0\n');

            expect(() =>
                localInterpreter.Execute(
                    ['function y = lastErrorInner()', '  missingLastErrorValue;', 'end', 'function y = lastErrorOuter()', '  y = lastErrorInner();', 'end', 'lastErrorOuter();'].join('\n'),
                ),
            ).toThrow("'missingLastErrorValue' undefined.");

            localInterpreter.Execute('err = lasterror();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier; err.stack(1).name; err.stack(2).name'))).toBe(
                "'missingLastErrorValue' undefined.\nmissingLastErrorValue\nlastErrorInner\nlastErrorOuter\n",
            );
        });

        it('Should expose the initial last warning state through lastwarn.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('[warnMessage, warnIdentifier] = lastwarn();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('warnMessage; warnIdentifier'))).toBe('\n\n');
        });

        it('Should update lastwarn from warning and lastwarn setters.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('warning("sample warning");');
            expect(localInterpreter.exitStatus).toBe(Interpreter.response.WARNING);
            localInterpreter.Execute('[warnMessage1, warnIdentifier1] = lastwarn();');

            localInterpreter.Execute('warning("mathjslab:test", "identified warning");');
            localInterpreter.Execute('[warnMessage2, warnIdentifier2] = lastwarn();');

            localInterpreter.Execute('lastwarn("manual warning", "mathjslab:manual");');
            localInterpreter.Execute('[warnMessage3, warnIdentifier3] = lastwarn();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('warnMessage1; warnIdentifier1; warnMessage2; warnIdentifier2; warnMessage3; warnIdentifier3'))).toBe(
                'sample warning\n\nidentified warning\nmathjslab:test\nmanual warning\nmathjslab:manual\n',
            );
        });

        it('Should format warning and error diagnostic messages.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('warning("value %d and %s", 12.8, "text");');
            localInterpreter.Execute('[warnMessage1, warnIdentifier1] = lastwarn();');
            localInterpreter.Execute('warning("mathjslab:formatted", "pi %.2f", 3.14159);');
            localInterpreter.Execute('[warnMessage2, warnIdentifier2] = lastwarn();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('warnMessage1; warnIdentifier1; warnMessage2; warnIdentifier2'))).toBe(
                'value 12 and text\n\npi 3.14\nmathjslab:formatted\n',
            );
            expect(() => localInterpreter.Execute('error("mathjslab:formattedError", "bad %s %g", "value", 5)')).toThrow('bad value 5');
            localInterpreter.Execute('err = lasterror();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier'))).toBe('bad value 5\nmathjslab:formattedError\n');
            expect(() => localInterpreter.Execute('warning("bad %d", "text")')).toThrow('diagnostic format argument must be a real numeric scalar.');
        });

        it('Should control warning state by global state, identifier, and last identifier.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('warning("mathjslab:visible", "visible warning");');
            localInterpreter.Execute('previousVisibleState = warning("off", "mathjslab:visible");');
            localInterpreter.Execute('warning("mathjslab:visible", "hidden warning");');
            localInterpreter.Execute('[messageAfterIdOff, identifierAfterIdOff] = lastwarn();');
            localInterpreter.Execute('idStateOff = warning("query", "mathjslab:visible");');

            localInterpreter.Execute('warning(previousVisibleState);');
            localInterpreter.Execute('warning("mathjslab:visible", "visible again");');
            localInterpreter.Execute('[messageAfterIdOn, identifierAfterIdOn] = lastwarn();');
            localInterpreter.Execute('idStateOn = warning("query", "last");');

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'previousVisibleState.identifier; previousVisibleState.state; messageAfterIdOff; identifierAfterIdOff; idStateOff.state; messageAfterIdOn; identifierAfterIdOn; idStateOn.state',
                    ),
                ),
            ).toBe('mathjslab:visible\non\nhidden warning\nmathjslab:visible\noff\nvisible again\nmathjslab:visible\non\n');

            localInterpreter.Execute(
                'initialGlobalState = warning(); previousGlobalState = warning("off"); warning("suppressed globally"); [messageAfterGlobalOff, identifierAfterGlobalOff] = lastwarn(); allStateOff = warning("query");',
            );
            localInterpreter.Execute('warning(previousGlobalState); warning("global visible"); [messageAfterGlobalOn, identifierAfterGlobalOn] = lastwarn(); allStateOn = warning("query");');

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'initialGlobalState(1).identifier; initialGlobalState(1).state; previousGlobalState.identifier; previousGlobalState.state; messageAfterGlobalOff; identifierAfterGlobalOff; allStateOff(1).state; messageAfterGlobalOn; identifierAfterGlobalOn; allStateOn(1).state',
                    ),
                ),
            ).toBe('all\non\nall\non\nsuppressed globally\n\noff\nglobal visible\n\non\n');
            expect(() => localInterpreter.Execute('warning(struct("identifier", "mathjslab:bad", "state", "invalid"))')).toThrow(
                'warning: state structure must contain string identifier and state fields.',
            );
        });

        it('Should promote selected warnings to errors and restore their previous state.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('previousIdState = warning("error", "mathjslab:aserror"); idState = warning("query", "mathjslab:aserror");');
            expect(localInterpreter.Unparse(localInterpreter.Execute('previousIdState.identifier; previousIdState.state; idState.state'))).toBe('mathjslab:aserror\non\nerror\n');
            expect(() => localInterpreter.Execute('warning("mathjslab:aserror", "promoted warning")')).toThrow('promoted warning');

            localInterpreter.Execute('err = lasterror(); [warnMessage, warnIdentifier] = lastwarn();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier; warnMessage; warnIdentifier'))).toBe(
                'promoted warning\nmathjslab:aserror\npromoted warning\nmathjslab:aserror\n',
            );

            localInterpreter.Execute('warning(previousIdState); warning("mathjslab:aserror", "ordinary warning"); [ordinaryMessage, ordinaryIdentifier] = lastwarn();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ordinaryMessage; ordinaryIdentifier; warning("query", "mathjslab:aserror").state'))).toBe(
                'ordinary warning\nmathjslab:aserror\non\n',
            );

            localInterpreter.Execute('previousGlobalState = warning("error"); globalState = warning();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('previousGlobalState.state; globalState(1).state'))).toBe('on\nerror\n');
            expect(() => localInterpreter.Execute('warning("global promoted")')).toThrow('global promoted');
            localInterpreter.Execute('warning(previousGlobalState); restoredGlobalState = warning();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('restoredGlobalState(1).state'))).toBe('on\n');
        });

        it('Should save and restore complete warning state snapshots.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('warning("off", "mathjslab:snapshotOff"); warning("error", "mathjslab:snapshotError"); snapshot = warning();');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'length(snapshot); snapshot(1).identifier; snapshot(1).state; snapshot(2).identifier; snapshot(2).state; snapshot(3).identifier; snapshot(3).state',
                    ),
                ),
            ).toBe('3\nall\non\nmathjslab:snapshotError\nerror\nmathjslab:snapshotOff\noff\n');

            localInterpreter.Execute(
                'warning("on", "mathjslab:snapshotOff"); warning("on", "mathjslab:snapshotError"); warning(snapshot); offState = warning("query", "mathjslab:snapshotOff"); errorState = warning("query", "mathjslab:snapshotError");',
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('offState.state; errorState.state'))).toBe('off\nerror\n');
            expect(() => localInterpreter.Execute('warning("mathjslab:snapshotError", "snapshot promoted")')).toThrow('snapshot promoted');
        });

        it('Should clear last diagnostic state on restart.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('missingBeforeRestart;')).toThrow("'missingBeforeRestart' undefined.");
            localInterpreter.Execute('warning("warning before restart");');
            localInterpreter.Execute('warning("off");');

            localInterpreter.Restart();
            localInterpreter.Execute('err = lasterror(); [warnMessage, warnIdentifier] = lastwarn(); warnState = warning("query");');

            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier; length(err.stack); warnMessage; warnIdentifier; warnState.state'))).toBe(
                '\n\n0\n\n\non\n',
            );
        });

        it('Should let errors thrown by a catch body propagate.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['try', '  missing;', 'catch', '  alsoMissing;', 'end'].join('\n'))).toThrow("'alsoMissing' undefined.");
        });

        it('Should ignore try errors when no catch body is provided.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 1;', 'try', '  missing;', 'end', 'x = x + 1;'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('2\n');
        });

        it('Should remember ignored try errors in the legacy last-error state.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['try', '  missingIgnoredTry;', 'end', 'err = lasterror();'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier'))).toBe("'missingIgnoredTry' undefined.\nmissingIgnoredTry\n");
        });

        it('Should not catch return inside a function.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function y = tryreturn()', '  y = 1;', '  try', '    return', '  catch', '    y = 2;', '  end', '  y = 3;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('tryreturn()'))).toBe('1\n');
        });

        it('Should run unwind cleanup after a successful body.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 'unwind_protect', '  x = 1;', 'unwind_protect_cleanup', '  x = x + 1;', 'end_unwind_protect'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('2\n');
        });

        it('Should run unwind cleanup before propagating a body error.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['x = 0;', 'unwind_protect', '  missing;', 'unwind_protect_cleanup', '  x = 3;', 'end'].join('\n'))).toThrow("'missing' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('3\n');
        });

        it('Should let unwind cleanup errors override body errors.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['unwind_protect', '  missing;', 'unwind_protect_cleanup', '  alsoMissing;', 'end_unwind_protect'].join('\n'))).toThrow(
                "'alsoMissing' undefined.",
            );
        });

        it('Should run unwind cleanup before returning from a function.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['function y = unwindreturn()', '  y = 1;', '  unwind_protect', '    return', '  unwind_protect_cleanup', '    y = y + 1;', '  end', '  y = 10;', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('unwindreturn()'))).toBe('2\n');
        });

        it('Should run unwind cleanup before loop break and continue signals.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'breakCleanup = 0;',
                    'breakSeen = 0;',
                    'for k = 1:3',
                    '  unwind_protect',
                    '    breakSeen = k;',
                    '    break',
                    '  unwind_protect_cleanup',
                    '    breakCleanup = breakCleanup + 1;',
                    '  end',
                    'end',
                    'continueCleanup = 0;',
                    'continueSeen = [];',
                    'for k = 1:3',
                    '  unwind_protect',
                    '    if k == 2',
                    '      continue',
                    '    end',
                    '    continueSeen(end + 1) = k;',
                    '  unwind_protect_cleanup',
                    '    continueCleanup = continueCleanup + 1;',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('breakSeen; breakCleanup; continueSeen; continueCleanup'))).toBe('1\n1\n[1,3]\n3\n');
        });

        it('Should let unwind cleanup control-flow signals override body signals.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'function y = cleanupreturnoverride()',
                    '  y = 0;',
                    '  unwind_protect',
                    '    y = 1;',
                    '    error("mathjslab:body", "body failure");',
                    '  unwind_protect_cleanup',
                    '    y = 2;',
                    '    return',
                    '  end',
                    '  y = 3;',
                    'end',
                    'breakValue = 0;',
                    'for k = 1:3',
                    '  unwind_protect',
                    '    breakValue = 10;',
                    '    error("mathjslab:bodyBreak", "body break failure");',
                    '  unwind_protect_cleanup',
                    '    breakValue = k;',
                    '    break',
                    '  end',
                    '  breakValue = 99;',
                    'end',
                    'continueValues = [];',
                    'for k = 1:3',
                    '  unwind_protect',
                    '    error("mathjslab:bodyContinue", "body continue failure");',
                    '  unwind_protect_cleanup',
                    '    continueValues(end + 1) = k;',
                    '    continue',
                    '  end',
                    '  continueValues(end + 1) = 99;',
                    'end',
                    'returnValue = cleanupreturnoverride();',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('returnValue; breakValue; continueValues'))).toBe('2\n1\n[1,2,3]\n');
        });

        it('Should let unwind cleanup errors override body control flow.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = cleanupreturnerroroverride()',
                        '  y = 1;',
                        '  unwind_protect',
                        '    return',
                        '  unwind_protect_cleanup',
                        '    error("mathjslab:cleanup", "cleanup failure");',
                        '  end',
                        'end',
                        'cleanupreturnerroroverride();',
                    ].join('\n'),
                ),
            ).toThrow('cleanup failure');
            localInterpreter.Execute('err = lasterror();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier'))).toBe('cleanup failure\nmathjslab:cleanup\n');
        });

        it('Should parse and unparse an empty classdef.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef EmptyClass', 'end'].join('\n')))).toBe('CLASSDEF EmptyClass\nENDCLASSDEF\n');
        });

        it('Should parse classdef attributes and superclass lists.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef (Abstract) Child < Base', 'end'].join('\n')))).toBe('CLASSDEF (Abstract) Child < Base\nENDCLASSDEF\n');
        });

        it('Should parse qualified class names and superclass lists.', () => {
            const localInterpreter = Interpreter.Create();
            const source = ['classdef pkg.Child < pkg.Base & handle', 'end'].join('\n');
            const tree = parseList(source);
            const classNode = parseClassDefinition(source);

            expect(localInterpreter.Unparse(tree)).toBe('CLASSDEF pkg.Child < pkg.Base&handle\nENDCLASSDEF\n');
            expect(classNode.id).toBe('pkg.Child');
            expect(classNode.superclasses.map((node) => node.id)).toEqual(['pkg.Base', 'handle']);
        });

        it('Should parse classdef properties sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef Point', '  properties', '    x = 1;', '    y', '  end', 'endclassdef'].join('\n')))).toBe(
                'CLASSDEF Point\nPROPERTIES\nx=1\ny\nENDPROPERTIES\nENDCLASSDEF\n',
            );
        });

        it('Should parse classdef section attributes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Parse(
                        [
                            'classdef Decorated',
                            '  properties (Access = private)',
                            '    x = 1;',
                            '  end',
                            '  methods (Static)',
                            '    function y = f()',
                            '      y = 2;',
                            '    end',
                            '  end',
                            'end',
                        ].join('\n'),
                    ),
                ),
            ).toBe('CLASSDEF Decorated\nPROPERTIES (Access=private)\nx=1\nENDPROPERTIES\nMETHODS (Static)\nFUNCTION y=f()\ny=2\nENDFUNCTION\nENDMETHODS\nENDCLASSDEF\n');
        });

        it('Should expose normalized class attribute tables in the AST.', () => {
            const classNode = parseClassDefinition(
                ['classdef (Abstract, Sealed) AttributeDemo', '  methods (Static, Access = private)', '    function y = f()', '      y = 2;', '    end', '  end', 'end'].join('\n'),
            );
            const methodsSection = classNode.sections[0];

            expect(classNode.attributeTable.Abstract[0].value).toBeNull();
            expect(classNode.attributeTable.Sealed[0].value).toBeNull();
            expect(methodsSection.attributeTable.Static[0].value).toBeNull();
            const accessValue = methodsSection.attributeTable.Access[0].value;
            if (!AST.isNodeIdentifier(accessValue)) {
                throw new Error('expected Access attribute value to be an identifier.');
            }
            expect(accessValue.id).toBe('private');
        });

        it('Should parse classdef methods sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(localInterpreter.Parse(['classdef Counter', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'))),
            ).toBe('CLASSDEF Counter\nMETHODS\nFUNCTION y=value(obj)\ny=1\nENDFUNCTION\nENDMETHODS\nENDCLASSDEF\n');
        });

        it('Should parse classdef method prototypes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(localInterpreter.Parse(['classdef AbstractCounter', '  methods (Abstract)', '    y = value(obj)', '    reset(obj)', '  end', 'end'].join('\n'))),
            ).toBe('CLASSDEF AbstractCounter\nMETHODS (Abstract)\ny=value(obj)\nreset(obj)\nENDMETHODS\nENDCLASSDEF\n');
        });

        it('Should parse classdef events sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef Signal', '  events (ListenAccess = public)', '    Changed', '    Reset', '  end', 'end'].join('\n')))).toBe(
                'CLASSDEF Signal\nEVENTS (ListenAccess=public)\nChanged\nReset\nENDEVENTS\nENDCLASSDEF\n',
            );
        });

        it('Should parse classdef enumeration sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef Color', '  enumeration', '    Red', '    Blue(2)', '  end', 'end'].join('\n')))).toBe(
                'CLASSDEF Color\nENUMERATION\nRed\nBlue(2)\nENDENUMERATION\nENDCLASSDEF\n',
            );
        });

        it('Should evaluate classdef structurally without executing members.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['classdef StoredClass', '  properties', '    x = missing;', '  end', 'end'].join('\n')))).toBe(
                'CLASSDEF StoredClass\nPROPERTIES\nx=missing\nENDPROPERTIES\nENDCLASSDEF\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('StoredClass'))).toBe('CLASSDEF StoredClass\nPROPERTIES\nx=missing\nENDPROPERTIES\nENDCLASSDEF\n');
        });

        it('Should register classdef as a runtime class definition.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef RuntimeClass',
                    '  properties (Access = private)',
                    '    value = 1;',
                    '  end',
                    '  methods (Static)',
                    '    function y = make()',
                    '      y = 1;',
                    '    end',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.value;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            const definition = executeList(localInterpreter, 'RuntimeClass').list[0];

            expect(ClassDefinition.isInstanceOf(definition)).toBe(true);
            if (!ClassDefinition.isInstanceOf(definition)) {
                throw new Error('expected RuntimeClass to evaluate to a ClassDefinition.');
            }
            expect(definition.properties[0].access).toBe('private');
            expect(definition.staticMethods.map((method) => method.name)).toEqual(['make']);
            expect(definition.instanceMethods.map((method) => method.name)).toEqual(['read']);
            expect(definition.methodsByAccess.public.map((method) => method.name)).toEqual(['make', 'read']);
        });

        it('Should instantiate a class with default property values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef Point', '  properties', '    x = 3;', '    y', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = Point()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(p.y)'))).toBe('true\n');
        });

        it('Should evaluate class property defaults when instantiating.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef NeedsDefault', '  properties', '    x = missingDefault;', '  end', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('NeedsDefault()')).toThrow("'missingDefault' undefined.");
        });

        it('Should require class property defaults to evaluate to runtime values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef RuntimeDefaultBoundary', '  properties', '    x = eval("return");', '  end', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('RuntimeDefaultBoundary()')).toThrow("Argument value 'property default' is not a runtime value.");
        });

        it('Should validate class property defaults when instantiating.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ValidDefault', '  properties', '    x (1,2) double {mustBePositive} = [1, 2];', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef InvalidDefault', '  properties', '    x (1,2) double {mustBePositive} = [1, -2];', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('p = ValidDefault(); p.x'))).toBe('p=ValidDefault object with properties: x\n[1,2]\n');
            expect(() => localInterpreter.Execute('InvalidDefault()')).toThrow("property validation failed for 'x': mustBePositive.");
        });

        it('Should validate class properties with parametrized validator calls.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ParamValidatedDefault', '  properties', '    x double {mustBeGreaterThan(x, 0), mustBeLessThan(x, 10)} = 3', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                ['classdef ParamValidatedAssignment', '  properties', '    x double {mustBeGreaterThan(x, 0), mustBeGreaterThan(10, x)} = 5', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(['classdef ExprValidatedProperty', '  properties', '    x double {mustBeGreaterThan(x + 1, 0)} = 1', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef MemberValidatedProperty', '  properties', "    x char {mustBeMember(x, {'a','b'})} = 'a'", '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef InvalidParamValidatedDefault', '  properties', '    x double {mustBeGreaterThan(x, 0)} = -1', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('ParamValidatedDefault().x'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ExprValidatedProperty().x'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('MemberValidatedProperty().x'))).toBe('a\n');
            expect(() => localInterpreter.Execute('InvalidParamValidatedDefault()')).toThrow("property validation failed for 'x': mustBeGreaterThan.");
            localInterpreter.Execute('p = ParamValidatedAssignment(); p.x = 8;');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('8\n');
            expect(() => localInterpreter.Execute('p.x = 11')).toThrow("property validation failed for 'x': mustBeGreaterThan.");
            expect(() => localInterpreter.Execute("m = MemberValidatedProperty(); m.x = 'c';")).toThrow("property validation failed for 'x': mustBeMember.");
        });

        it('Should validate class properties with mustBeA.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef MustBeAPropBase', 'end'].join('\n'));
            localInterpreter.Execute(['classdef MustBeAPropChild < MustBeAPropBase', 'end'].join('\n'));
            localInterpreter.Execute(['classdef MustBeAProperty', '  properties', '    x {mustBeA(x, ["double","MustBeAPropBase"])} = 1', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('p = MustBeAProperty(); p.x = MustBeAPropChild(); class(p.x)'))).toBe(
                'p=MustBeAProperty object with properties: x\np=MustBeAProperty object with properties: x\nMustBeAPropChild\n',
            );
            expect(() => localInterpreter.Execute("p.x = 'bad'")).toThrow("property validation failed for 'x': mustBeA.");
        });

        it('Should assign class instance properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef MutablePoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = MutablePoint()');
            localInterpreter.Execute('p.x = 10');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('10\n');
        });

        it('Should validate class property assignments.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ValidatedPoint', '  properties', '    x (1,2) double {mustBePositive} = [1, 2];', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = ValidatedPoint(); p.x = [3, 4];');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('[3,4]\n');
            expect(() => localInterpreter.Execute('p.x = [3; 4]')).toThrow("property validation failed for 'x': expected size 1x2, got 2x1.");
            expect(() => localInterpreter.Execute('p.x = [-1, 2]')).toThrow("property validation failed for 'x': mustBePositive.");
        });

        it('Should validate class property assignments against user-defined classes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef BaseValue', 'end', 'classdef ChildValue < BaseValue', 'end', 'classdef HolderValue', '  properties', '    item BaseValue', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('h = HolderValue(); h.item = ChildValue();');

            expect(localInterpreter.Unparse(localInterpreter.Execute('class(h.item)'))).toBe('ChildValue\n');
            expect(() => localInterpreter.Execute('h.item = []')).toThrow("property validation failed for 'item': expected class BaseValue, got double.");
            expect(() => localInterpreter.Execute('h.item = 1')).toThrow("property validation failed for 'item': expected class BaseValue, got double.");
        });

        it('Should reject assignment to undeclared class instance properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef StrictPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = StrictPoint()');

            expect(() => localInterpreter.Execute('p.y = 10')).toThrow("unknown property 'y' for class StrictPoint.");
        });

        it('Should run class constructors.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ConstructedPoint',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = ConstructedPoint(x)',
                    '      obj.x = x;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('p = ConstructedPoint(5)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('5\n');
        });

        it('Should run package class constructors declared with the simple class name.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef pkg.PackagedConstructedPoint',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = PackagedConstructedPoint(x)',
                    '      obj.x = x + 1;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('p = pkg.PackagedConstructedPoint(5); p.x'))).toBe('p=pkg.PackagedConstructedPoint object with properties: x\n6\n');
        });

        it('Should run host-provided package class constructors declared with the simple class name.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@ExternalConstructedPoint/ExternalConstructedPoint.m': [
                        'classdef ExternalConstructedPoint',
                        '  properties',
                        '    x = 0;',
                        '  end',
                        '  methods',
                        '    function obj = ExternalConstructedPoint(x)',
                        '      obj.x = x + 2;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('p = pkg.ExternalConstructedPoint(5); p.x'))).toBe('p=pkg.ExternalConstructedPoint object with properties: x\n7\n');
        });

        it('Should reject constructor arguments when no constructor method exists.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef PlainClass', '  properties', '    x = 0;', '  end', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('PlainClass(5)')).toThrow('constructor for class PlainClass accepts no input arguments.');
        });

        it('Should bind constructor arguments blocks and name-value options.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ValidatedConstructedPoint',
                    '  properties',
                    '    x = 0;',
                    '    label = "origin";',
                    '  end',
                    '  methods',
                    '    function obj = ValidatedConstructedPoint(x, opts)',
                    '      arguments',
                    '        x (1,1) double {mustBePositive}',
                    '        opts.label string = "point"',
                    '      end',
                    '      obj.x = x;',
                    '      obj.label = opts.label;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('p = ValidatedConstructedPoint(5)');
            localInterpreter.Execute('q = ValidatedConstructedPoint(6, label = "custom")');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.label'))).toBe('point\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('q.label'))).toBe('custom\n');
            expect(() => localInterpreter.Execute('ValidatedConstructedPoint(-1)')).toThrow("arguments block validation failed for 'x': mustBePositive.");
        });

        it('Should call class instance methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ReadablePoint',
                    '  properties',
                    '    x = 4;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = plusx(obj, n)',
                    '      y = obj.x + n;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('p = ReadablePoint()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.read()'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.plusx(6)'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('read(p)'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('plusx(p, 6)'))).toBe('10\n');
            expect(() => localInterpreter.Execute('missingmethod(p)')).toThrow("unknown method 'missingmethod' for class ReadablePoint.");
        });

        it('Should use value semantics for class instance methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef ValuePoint', '  properties', '    x = 0;', '  end', '  methods', '    function obj = setX(obj, x)', '      obj.x = x;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('p = ValuePoint()');
            localInterpreter.Execute('p.setX(10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('0\n');

            localInterpreter.Execute('p = p.setX(10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('10\n');
        });

        it('Should use reference semantics for handle classes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef HandlePoint < handle', '  properties', '    x = 0;', '  end', '  methods', '    function setX(obj, x)', '      obj.x = x;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('p = HandlePoint()');
            localInterpreter.Execute('q = p');
            localInterpreter.Execute('p.setX(10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('q.x'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(p, 'handle')"))).toBe('true\n');
        });

        it('Should delete handle class instances.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef DisposablePoint < handle', '  properties', '    x = 0;', '  end', '  methods', '    function setX(obj, x)', '      obj.x = x;', '    end', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute('p = DisposablePoint()');
            localInterpreter.Execute('q = p');
            localInterpreter.Execute('delete(p)');

            expect(() => localInterpreter.Execute('p.x')).toThrow('invalid or deleted object for class DisposablePoint.');
            expect(() => localInterpreter.Execute('q.setX(3)')).toThrow('invalid or deleted object for class DisposablePoint.');
            expect(() => localInterpreter.Execute('delete(q)')).toThrow('invalid or deleted object for class DisposablePoint.');
        });

        it('Should call handle class delete methods before invalidating instances.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ThrowingDelete < handle', '  methods', '    function delete(obj)', '      missingDeleteHook();', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute('t = ThrowingDelete()');

            expect(() => localInterpreter.Execute('delete(t)')).toThrow("'missingDeleteHook' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(t, 'ThrowingDelete')"))).toBe('true\n');
        });

        it('Should report handle validity.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ValidHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = ValidHandle()');
            localInterpreter.Execute('q = p');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(p)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p == q'))).toBe('true\n');
            localInterpreter.Execute('delete(p)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(q)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p == q'))).toBe('true\n');
        });

        it('Should report validity for handle arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ValidHandleArray < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = ValidHandleArray()');
            localInterpreter.Execute('q = ValidHandleArray()');
            localInterpreter.Execute('handles = [p, q]');
            localInterpreter.Execute('delete(p)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(handles)'))).toBe('[false,true]\n');
        });

        it('Should delete handle arrays without producing values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef DeletableHandleArray < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = DeletableHandleArray()');
            localInterpreter.Execute('q = DeletableHandleArray()');
            localInterpreter.Execute('handles = [p, q]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('handles.isvalid(); delete(handles); isvalid(handles)'))).toBe('[true,true]\n[false,false]\n');
            localInterpreter.Execute('r = DeletableHandleArray(); s = DeletableHandleArray(); dottedHandles = [r, s]');
            expect(localInterpreter.Unparse(localInterpreter.Execute('dottedHandles.delete(); isvalid(dottedHandles)'))).toBe('[false,false]\n');
        });

        it('Should compare handle arrays by identity.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ComparableHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = ComparableHandle()');
            localInterpreter.Execute('q = ComparableHandle()');
            localInterpreter.Execute('handles = [p, q]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('handles == p'))).toBe('[true,false]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p == handles'))).toBe('[true,false]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('handles ~= q'))).toBe('[true,false]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('handles == 1'))).toBe('[false,false]\n');
        });

        it('Should report objects and compare handles with isequal.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef EqualHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = EqualHandle()');
            localInterpreter.Execute('q = p');
            localInterpreter.Execute('r = EqualHandle()');
            localInterpreter.Execute('handles = [p, r]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(p)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(handles)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(1)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(p, q)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(p, r)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(handles, [p, r])'))).toBe('true\n');
            localInterpreter.Execute('delete(p)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(p, q)'))).toBe('true\n');
        });

        it('Should compare value class instances with isequal.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef EqualValue', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = EqualValue()');
            localInterpreter.Execute('b = EqualValue()');
            localInterpreter.Execute('c = EqualValue()');
            localInterpreter.Execute('c.x = 1');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(a)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(a, b)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(a, c)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal([a, b], [a, b])'))).toBe('true\n');
        });

        it('Should dispatch class equality operator methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef OverloadedEquality',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = eq(obj, other)',
                    "      if isa(other, 'OverloadedEquality')",
                    '        y = obj.x == other.x;',
                    '      else',
                    '        y = obj.x == other;',
                    '      end',
                    '    end',
                    '    function y = ne(obj, other)',
                    '      y = !(obj == other);',
                    '    end',
                    '    function y = plus(obj, other)',
                    "      if isa(other, 'OverloadedEquality')",
                    '        y = obj.x + other.x;',
                    '      else',
                    '        y = obj.x + other;',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = OverloadedEquality()');
            localInterpreter.Execute('b = OverloadedEquality()');
            localInterpreter.Execute('c = OverloadedEquality()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 3');
            localInterpreter.Execute('c.x = 4');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a == b'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a ~= c'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a == 3'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('3 == a'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a + c'))).toBe('7\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('2 + a'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, c] + 1'))).toBe('[4,5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('1 + [a, c]'))).toBe('[4,5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, c] + [b, c]'))).toBe('[6,8]\n');
        });

        it('Should honor InferiorClasses when choosing binary operator methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef LowPriorityOperand',
                    '  properties',
                    '    x = 1;',
                    '  end',
                    '  methods',
                    '    function y = plus(obj, other)',
                    '      y = 100 + obj.x;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef (InferiorClasses = {?LowPriorityOperand}) HighPriorityOperand',
                    '  properties',
                    '    x = 2;',
                    '  end',
                    '  methods',
                    '    function y = plus(obj, other)',
                    "      if isa(other, 'LowPriorityOperand')",
                    '        y = 200 + obj.x + other.x;',
                    '      else',
                    '        y = 200 + obj.x;',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('lo = LowPriorityOperand(); hi = HighPriorityOperand(); lo.x = 5; hi.x = 7;');

            expect(localInterpreter.Unparse(localInterpreter.Execute('lo + hi'))).toBe('212\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('hi + lo'))).toBe('212\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[lo, lo] + hi'))).toBe('[212,212]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('hi + [lo, lo]'))).toBe('[212,212]\n');
        });

        it('Should dispatch class unary operator methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef OverloadedUnary',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = uplus(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = uminus(obj)',
                    '      y = -obj.x;',
                    '    end',
                    '    function y = not(obj)',
                    '      y = obj.x == 0;',
                    '    end',
                    '    function y = transpose(obj)',
                    '      y = obj.x + 10;',
                    '    end',
                    '    function y = ctranspose(obj)',
                    '      y = obj.x + 20;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = OverloadedUnary()');
            localInterpreter.Execute('b = OverloadedUnary()');
            localInterpreter.Execute('z = OverloadedUnary()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');

            expect(localInterpreter.Unparse(localInterpreter.Execute('+a'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('-a'))).toBe('-3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('~a'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("a.'"))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("a'"))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('-[a, b]'))).toBe('[-3,-4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('~[a, z]'))).toBe('[false,true]\n');
        });

        it('Should call methods on class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ArrayMethodPoint < handle',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = add(obj, n)',
                    '      y = obj.x + n;',
                    '    end',
                    '    function touch(obj, n)',
                    '      obj.x = obj.x + n;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = ArrayMethodPoint()');
            localInterpreter.Execute('b = ArrayMethodPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b].x'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b].read()'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b].add(10)'))).toBe('[13,14]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b].touch(2); [a, b].x'))).toBe('[5,6]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('touch([a, b], 3); [a, b].x'))).toBe('[8,9]\n');
        });

        it('Should expand class instance array method calls for multiple outputs.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ArrayMethodListPoint',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = add(obj, n)',
                    '      y = obj.x + n;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = ArrayMethodListPoint()');
            localInterpreter.Execute('b = ArrayMethodListPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('[first, second] = objs.read()');
            localInterpreter.Execute('[plusFirst, plusSecond] = objs.add(10)');
            localInterpreter.Execute('[functionalFirst, functionalSecond] = read(objs)');
            localInterpreter.Execute('[functionalPlusFirst, functionalPlusSecond] = add(objs, 10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.read()'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('first'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('second'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('plusFirst'))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('plusSecond'))).toBe('14\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('functionalFirst; functionalSecond; functionalPlusFirst; functionalPlusSecond'))).toBe('3\n4\n13\n14\n');
            expect(() => localInterpreter.Execute('[one, two, three] = objs.read()')).toThrow('element number 3 undefined in return list');
            expect(() => localInterpreter.Execute('[one, two, three] = read(objs)')).toThrow('element number 3 undefined in return list');
        });

        it('Should expand class instance array properties for multiple outputs.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ArrayPropertyPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = ArrayPropertyPoint()');
            localInterpreter.Execute('b = ArrayPropertyPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('[first, second] = objs.x');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('first'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('second'))).toBe('4\n');
            expect(() => localInterpreter.Execute('[one, two, three] = objs.x')).toThrow('element number 3 undefined in return list');
        });

        it('Should assign class instance array properties element-wise.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ArrayPropertyAssignmentPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = ArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('b = ArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('objs.x = [10, 20]');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[10,20]\n');

            localInterpreter.Execute('objs.x = 7');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[7,7]\n');
            expect(() => localInterpreter.Execute('objs.x = [1, 2, 3]')).toThrow('assignment value count 3 does not match object array length 2.');
        });

        it('Should assign indexed class instance array properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef IndexedArrayPropertyAssignmentPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = IndexedArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('b = IndexedArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('c = IndexedArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('objs = [a, b, c]');

            localInterpreter.Execute('objs(2).x = 20');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[0,20,0]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs(2).x'))).toBe('20\n');

            localInterpreter.Execute('objs([1, 3]).x = [10, 30]');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[10,20,30]\n');

            localInterpreter.Execute('objs([1, 3]).x = 5');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[5,20,5]\n');
            expect(() => localInterpreter.Execute('objs([1, 3]).x = [1, 2, 3]')).toThrow('assignment value count 3 does not match selected object count 2.');
        });

        it('Should expand class instance array property targets for multiple assignment.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef CommaPropertyAssignmentChild', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef CommaPropertyAssignmentPoint', '  properties', '    x = 0;', '    child = CommaPropertyAssignmentChild();', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = CommaPropertyAssignmentPoint()');
            localInterpreter.Execute('b = CommaPropertyAssignmentPoint()');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('[objs.x] = deal(7, 8)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[7,8]\n');

            localInterpreter.Execute('[objs(:).x] = deal(9)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[9,9]\n');

            localInterpreter.Execute('idx = [2, 1]; [objs(idx).x] = deal(20, 10)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[10,20]\n');

            localInterpreter.Execute('[objs.child.x] = deal(30, 40)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.child.x'))).toBe('[30,40]\n');

            localInterpreter.Execute('objs(2).child.x = 50');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.child.x'))).toBe('[30,50]\n');

            localInterpreter.Execute('[objs(idx).child.x] = deal(70, 60)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.child.x'))).toBe('[60,70]\n');
        });

        it('Should assign indexed contents inside nested class properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef IndexedNestedPropertyLeaf', '  properties', '    values = [1, 2, 3];', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef IndexedNestedPropertyHolder', '  properties', '    child = IndexedNestedPropertyLeaf();', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = IndexedNestedPropertyHolder()');
            localInterpreter.Execute('b = IndexedNestedPropertyHolder()');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('a.child.values(2) = 9');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.child.values'))).toBe('[1,9,3]\n');

            localInterpreter.Execute('objs(2).child.values(2) = 8');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.child.values'))).toBe('[[1,2,3],[1,8,3]]\n');

            localInterpreter.Execute('idx = [2, 1]; [objs(idx).child.values] = deal([4, 5, 6], [7, 8, 9])');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.child.values'))).toBe('[[7,8,9],[4,5,6]]\n');

            localInterpreter.Execute('objs(2).child.values([1, 3]) = [10, 30]');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs(2).child.values'))).toBe('[10,5,30]\n');
        });

        it('Should assign nested class properties through structure and object values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef NestedChildValue', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef NestedPropertyBox', '  properties', '    s', '    child = NestedChildValue();', '  end', 'end'].join('\n'));
            localInterpreter.Execute('box = NestedPropertyBox()');

            localInterpreter.Execute('box.s.a = 3');
            localInterpreter.Execute('box.child.x = 7');

            expect(localInterpreter.Unparse(localInterpreter.Execute('box.s.a; box.child.x'))).toBe('3\n7\n');
        });

        it('Should assign nested class properties across object arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef NestedArrayPropertyBox', '  properties', '    s', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = NestedArrayPropertyBox()');
            localInterpreter.Execute('b = NestedArrayPropertyBox()');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('objs.s.a = [10, 20]');
            localInterpreter.Execute('objs.s.b = 5');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.s.a; objs.s.b'))).toBe('10\n20\n5\n5\n');
            expect(() => localInterpreter.Execute('objs.s.c = [1, 2, 3]')).toThrow('assignment value count 3 does not match object array length 2.');
        });

        it('Should concatenate only homogeneous class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef HomogeneousArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef OtherHomogeneousArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = HomogeneousArrayPoint()');
            localInterpreter.Execute('b = HomogeneousArrayPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');

            localInterpreter.Execute('row = [a, b]');
            localInterpreter.Execute('column = [a; b]');
            localInterpreter.Execute('pages = cat(3, a, b)');
            localInterpreter.Execute('page = pages(:, :, 2)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('row.x'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('column.x'))).toBe('[3;\n4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('page.x'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(row)'))).toBe('HomogeneousArrayPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(row, 'HomogeneousArrayPoint')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(row, 'OtherHomogeneousArrayPoint')"))).toBe('false\n');
            expect(() => localInterpreter.Execute('[HomogeneousArrayPoint(), OtherHomogeneousArrayPoint()]')).toThrow('object arrays must contain objects of the same class.');
            expect(() => localInterpreter.Execute('[HomogeneousArrayPoint(); OtherHomogeneousArrayPoint()]')).toThrow('object arrays must contain objects of the same class.');
            expect(() => localInterpreter.Execute('horzcat(HomogeneousArrayPoint(), OtherHomogeneousArrayPoint())')).toThrow(
                'horzcat: object arrays must contain objects of the same class.',
            );
            expect(() => localInterpreter.Execute('vertcat(HomogeneousArrayPoint(), OtherHomogeneousArrayPoint())')).toThrow(
                'vertcat: object arrays must contain objects of the same class.',
            );
            expect(() => localInterpreter.Execute('cat(3, HomogeneousArrayPoint(), OtherHomogeneousArrayPoint())')).toThrow('cat: object arrays must contain objects of the same class.');
        });

        it('Should reshape, repeat, logically index, assign and delete class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ShapeArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = ShapeArrayPoint()');
            localInterpreter.Execute('b = ShapeArrayPoint()');
            localInterpreter.Execute('a.x = 1');
            localInterpreter.Execute('b.x = 2');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('reshaped = reshape(objs, 2, 1)');
            localInterpreter.Execute('picked = objs([true, false])');
            localInterpreter.Execute('objs([false, true]).x = 9');
            localInterpreter.Execute('objs([true, false]) = []');
            localInterpreter.Execute('repeated = repmat(a, 1, 2)');
            localInterpreter.Execute('repeated(2).x = 5');

            expect(localInterpreter.Unparse(localInterpreter.Execute('reshaped.x'))).toBe('[1;\n2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('picked.x'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('numel(objs); objs(1).x'))).toBe('1\n9\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('repeated.x'))).toBe('[1,5]\n');
        });

        it('Should preallocate class instance arrays without numeric holes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef PreallocatedArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('objs(3) = PreallocatedArrayPoint()');
            localInterpreter.Execute('objs(2).x = 5');
            localInterpreter.Execute('grid(2, 2) = PreallocatedArrayPoint()');
            localInterpreter.Execute('grid(1, 1).x = 7');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(objs); objs.x'))).toBe('true\n[0,5,0]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(grid); grid.x'))).toBe('true\n[7,0;\n0,0]\n');
        });

        it('Should dispatch class subsref methods for indexed references.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef IndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    '      if numel(s) == 2',
                    "        if isequal(s(1).type, '()')",
                    '          y = obj.x + s(1).subs{1} + 100;',
                    '        else',
                    '          y = obj.x + s(2).subs{1} + 200;',
                    '        end',
                    "      elseif isequal(s.type, '()')",
                    "        if isequal(s.subs{1}, ':')",
                    '          y = obj.x + 100;',
                    '        else',
                    '          y = obj.x + s.subs{1};',
                    '        end',
                    '      else',
                    '        y = obj.x + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = IndexedValue()');
            localInterpreter.Execute('a.x = 10');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a(5)'))).toBe('15\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a(:)'))).toBe('110\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a{7}'))).toBe('17\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a(5).virtual'))).toBe('115\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.virtual(7)'))).toBe('217\n');
        });

        it('Should apply public subsref descriptors to native values and class overloads.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef PublicSubsrefValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    '      if numel(s) == 2',
                    '        y = obj.x + s(1).subs{1} + 100;',
                    '      elseif isequal(s.type, ".")',
                    '        y = obj.x + 20;',
                    '      else',
                    '        y = obj.x + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [10, 20, 30]; subsref(A, substruct("()", {2}))'))).toBe('A=[10,20,30]\n20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S(1).x = 7; S(2).x = 9; subsref(S, substruct("()", {2}, ".", "x"))'))).toBe(
                'S=[struct {\nx: 7\n}]\nS=[struct {\nx: 7\n},struct {\nx: 9\n}]\n9\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[left, right] = subsref(S, substruct(".", "x")); left; right'))).toBe('left=7\nright=9\n7\n9\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[manualLeft, manualRight] = subsref(S, struct("type", ".", "subs", "x")); manualLeft; manualRight'))).toBe(
                'manualLeft=7\nmanualRight=9\n7\n9\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('Q.x = [1, 2]; subsref(Q, substruct(".", "x"))'))).toBe('Q=struct {\nx: [1,2]\n}\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {4, 5}; subsref(C, substruct("{}", {2}))'))).toBe('C={4,5}\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(A, substruct("()", {[1, 3]}))'))).toBe('[10,30]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('Grid = [1, 2, 3; 4, 5, 6]; subsref(Grid, substruct("()", {":", 2}))'))).toBe('Grid=[1,2,3;\n4,5,6]\n[2;\n5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(Grid, substruct("()", {1, ":"}))'))).toBe('[1,2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(Grid, substruct("()", {":"}))'))).toBe('[1;\n4;\n2;\n5;\n3;\n6]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('Column = [1; 2; 3; 4]; subsref(Column, substruct("()", {[true, false, true, false]}))'))).toBe(
                'Column=[1;\n2;\n3;\n4]\n[1;\n3]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('M = [1, 2; 3, 4]; subsref(M, substruct("()", {[true, false, true, false]}))'))).toBe('M=[1,2;\n3,4]\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(C, substruct("()", {2}))'))).toBe('{5}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(C, substruct("()", {[1, 2]}))'))).toBe('{4,5}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(C, substruct("()", {[true, false]}))'))).toBe('{4}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(C, substruct("()", {2}, "{}", {1}))'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(C, substruct("{}", {":"}))'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[allLeft, allRight] = subsref(C, substruct("{}", {":"})); allLeft; allRight'))).toBe('allLeft=4\nallRight=5\n4\n5\n');
            expect(() => localInterpreter.Execute('[tooManyLeft, tooManyRight, tooManyExtra] = subsref(C, substruct("{}", {":"}))')).toThrow('element number 3 undefined in return list');
            expect(localInterpreter.Unparse(localInterpreter.Execute('NestedCell = {{1, 2}, {3, 4}}; subsref(NestedCell, substruct("()", {2}, "{}", {1}, "{}", {2}))'))).toBe(
                'NestedCell={{1,2},{3,4}}\n4\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('text = "abcd"; subsref(text, substruct("()", {2}))'))).toBe('text=abcd\nb\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(text, substruct("()", {[4, 2]}))'))).toBe('db\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(text, substruct("()", {[true, false, true, false]}))'))).toBe('ac\n');
            expect(() => localInterpreter.Execute('subsref(A, substruct("{}", {1}))')).toThrow('matrix cannot be indexed with {');
            expect(() => localInterpreter.Execute('subsref(text, substruct("{}", {1}))')).toThrow('matrix cannot be indexed with {');
            localInterpreter.Execute('values = {1, 2, 3}');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[first, second] = subsref(values, substruct("{}", {1:2})); first; second'))).toBe('first=1\nsecond=2\n1\n2\n');
            localInterpreter.Execute(['function y = publicsubsrefadd(left, right)', '  y = left + right;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = publicsubsrefsum3(left, middle, right)', '  y = left + middle + right;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('publicsubsrefadd(subsref(values, substruct("{}", {1:2})))'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('publicsubsrefsum3(subsref(values, substruct("{}", {":"})))'))).toBe('6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('wrapped = {subsref(values, substruct("{}", {":"}))}; wrapped'))).toBe('wrapped={1,2,3}\n{1,2,3}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = PublicSubsrefValue(); obj.x = 10; subsref(obj, substruct("()", {5}))'))).toBe(
                'obj=PublicSubsrefValue object with properties: x\nobj=PublicSubsrefValue object with properties: x\n15\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(obj, substruct(".", "virtual"))'))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(obj, substruct("()", {5}, ".", "virtual"))'))).toBe('115\n');
            expect(() => localInterpreter.Execute('subsref(A, struct("type", ".", "subs", {1}))')).toThrow('invalid subsref descriptor.');
            expect(() => localInterpreter.Execute('subsref(A, struct("type", "bad", "subs", {1}))')).toThrow('invalid subsref descriptor.');
        });

        it('Should dispatch class end methods for indexed references.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef EndIndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = end(obj, k, n)',
                    '      y = obj.x + 10 * k + n;',
                    '    end',
                    '    function y = subsref(obj, s)',
                    '      if numel(s.subs) == 1',
                    '        y = s.subs{1};',
                    '      else',
                    '        y = s.subs{2};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = EndIndexedValue()');
            localInterpreter.Execute('a.x = 5');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a(end)'))).toBe('16\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a(1, end)'))).toBe('27\n');
        });

        it('Should dispatch multiple outputs from class subsref using numArgumentsFromSubscript.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef MultiOutputIndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function n = numArgumentsFromSubscript(obj, s, context)',
                    '      if isequal(context, "subsref")',
                    '        n = 2;',
                    '      else',
                    '        n = 1;',
                    '      end',
                    '    end',
                    '    function [a, b] = subsref(obj, s)',
                    '      if numel(s) == 2',
                    '        a = obj.x + s(1).subs{1} + 100;',
                    '        if isequal(s(2).type, ".")',
                    '          b = obj.x + s(1).subs{1} + 200;',
                    '        else',
                    '          b = obj.x + s(2).subs{1} + 200;',
                    '        end',
                    '      else',
                    '        a = obj.x + s.subs{1};',
                    '        b = obj.x + s.subs{1} + 10;',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = MultiOutputIndexedValue()');
            localInterpreter.Execute('a.x = 5');

            localInterpreter.Execute('[first, second] = a(3)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('first'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('second'))).toBe('18\n');

            localInterpreter.Execute('[chainedFirst, chainedSecond] = a(3).virtual');
            expect(localInterpreter.Unparse(localInterpreter.Execute('chainedFirst'))).toBe('108\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('chainedSecond'))).toBe('208\n');

            localInterpreter.Execute('[explicitFirst, explicitSecond] = subsref(a, substruct("()", {3}))');
            expect(localInterpreter.Unparse(localInterpreter.Execute('explicitFirst'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('explicitSecond'))).toBe('18\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, skippedSecond] = a(3); skippedSecond'))).toBe('skippedSecond=18\n18\n');
            expect(() => localInterpreter.Execute('[tooMany1, tooMany2, tooMany3] = subsref(a, substruct("()", {3}))')).toThrow('element number 3 undefined in return list');
        });

        it('Should reject too many class subsref outputs using numArgumentsFromSubscript.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef LimitedOutputIndexedValue',
                    '  methods',
                    '    function n = numArgumentsFromSubscript(obj, s, context)',
                    '      n = 1;',
                    '    end',
                    '    function [a, b] = subsref(obj, s)',
                    '      a = 10;',
                    '      b = 20;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = LimitedOutputIndexedValue()');

            expect(() => localInterpreter.Execute('[first, second] = a(1)')).toThrow('element number 2 undefined in return list');
        });

        it('Should keep caller output masks from leaking into class subsref helper calls.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef MaskedSubsrefOutput',
                    '  methods',
                    '    function n = numArgumentsFromSubscript(obj, s, context)',
                    '      n = 2;',
                    '    end',
                    '    function [a, b] = subsref(obj, s)',
                    '      if isargout(1), a = 1; end',
                    '      b = isargout(1);',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('masked = MaskedSubsrefOutput()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = masked(1); [a, b]'))).toBe('a=1\nb=true\n[1,true]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = masked(1); b'))).toBe('b=false\nfalse\n');
        });

        it('Should dispatch class subsasgn methods for indexed assignments.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef AssignedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = subsasgn(obj, s, value)',
                    '      if numel(s) == 2',
                    "        if isequal(s(1).type, '()')",
                    '          obj.x = value + s(1).subs{1} + 100;',
                    '        else',
                    '          obj.x = value + s(2).subs{1} + 200;',
                    '        end',
                    "      elseif isequal(s.type, '()')",
                    "        if isequal(s.subs{1}, ':')",
                    '          obj.x = value + 100;',
                    '        else',
                    '          obj.x = value + s.subs{1};',
                    '        end',
                    '      else',
                    '        obj.x = value + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = AssignedValue()');

            localInterpreter.Execute('a(5) = 12');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('17\n');

            localInterpreter.Execute('a(:) = 1');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('101\n');

            localInterpreter.Execute('a{7} = 20');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('27\n');

            localInterpreter.Execute('a(5).virtual = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('115\n');

            localInterpreter.Execute('a.virtual(7) = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('217\n');
        });

        it('Should apply public subsasgn descriptors to native values and class overloads.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef PublicSubsasgnValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = subsasgn(obj, s, value)',
                    '      obj.x = value + s.subs{1};',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2, 3]; B = subsasgn(A, substruct("()", {2}), 9); A; B'))).toBe('A=[1,2,3]\nB=[1,9,3]\n[1,2,3]\n[1,9,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S.x = 1; T = subsasgn(S, substruct(".", "y"), 5); isfield(S, "y"); T.y'))).toBe(
                'S=struct {\nx: 1\n}\nT=struct {\nx: 1\ny: 5\n}\nfalse\n5\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('U = subsasgn(S, struct("type", ".", "subs", "z"), 6); U.z'))).toBe('U=struct {\nx: 1\nz: 6\n}\n6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('Created = subsasgn([], substruct(".", "x"), 5); Created.x'))).toBe('Created=struct {\nx: 5\n}\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('Nested = subsasgn([], substruct(".", "x", ".", "y"), 6); Nested.x.y'))).toBe(
                'Nested=struct {\nx: struct {\ny: 6\n}\n}\n6\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('NumericField = subsasgn([], substruct(".", "x", "()", {2}), 7); NumericField.x'))).toBe(
                'NumericField=struct {\nx: [0,7]\n}\n[0,7]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('CellField = subsasgn([], substruct(".", "x", "{}", {2}), 8); CellField.x'))).toBe(
                'CellField=struct {\nx: {[ ](0x0),8}\n}\n{[ ](0x0),8}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {1, 2}; D = subsasgn(C, substruct("{}", {2}), 8); C{2}; D{2}'))).toBe('C={1,2}\nD={1,8}\n2\n8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('E = subsasgn(C, substruct("()", {2}), {9}); E'))).toBe('E={1,9}\n{1,9}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('F = subsasgn(C, substruct("()", {2}, "{}", {1}), 9); F'))).toBe('F={1,9}\n{1,9}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('Pair = {7, 8}; ParenDistributed = subsasgn(C, substruct("()", {1:2}), Pair); ParenDistributed'))).toBe(
                'Pair={7,8}\nParenDistributed={7,8}\n{7,8}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('BraceFilled = subsasgn(C, substruct("{}", {1:2}), 9); BraceFilled'))).toBe('BraceFilled={9,9}\n{9,9}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('BraceDistributed = subsasgn(C, substruct("{}", {1:2}), [10, 20]); BraceDistributed'))).toBe(
                'BraceDistributed={10,20}\n{10,20}\n',
            );
            expect(() => localInterpreter.Execute('subsasgn(C, substruct("{}", {1:2}), subsref(Pair, substruct("{}", {":"})))')).toThrow('Invalid call to subsasgn.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ContentFilled = subsasgn(C, substruct("{}", {":"}), 9); ContentFilled'))).toBe('ContentFilled={9,9}\n{9,9}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ContentCleared = subsasgn(C, substruct("{}", {":"}), []); ContentCleared'))).toBe(
                'ContentCleared={[ ](0x0),[ ](0x0)}\n{[ ](0x0),[ ](0x0)}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('Grid = [1, 2, 3; 4, 5, 6]; ColumnRemoved = subsasgn(Grid, substruct("()", {":", 2}), []); ColumnRemoved'))).toBe(
                'Grid=[1,2,3;\n4,5,6]\nColumnRemoved=[1,3;\n4,6]\n[1,3;\n4,6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('RowRemoved = subsasgn(Grid, substruct("()", {1, ":"}), []); RowRemoved'))).toBe('RowRemoved=[4,5,6]\n[4,5,6]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('Filled = subsasgn(Grid, substruct("()", {":"}), 9); Filled'))).toBe('Filled=[9,9,9;\n9,9,9]\n[9,9,9;\n9,9,9]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ClearedCell = subsasgn(C, substruct("()", {":"}), []); ClearedCell'))).toBe('ClearedCell={ }(1x0)\n{ }(1x0)\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('NestedCell = {{1, 2}, {3, 4}}; NestedUpdated = subsasgn(NestedCell, substruct("()", {2}, "{}", {1}, "{}", {2}), 9); NestedCell; NestedUpdated'),
                ),
            ).toBe('NestedCell={{1,2},{3,4}}\nNestedUpdated={{1,2},{3,9}}\n{{1,2},{3,4}}\n{{1,2},{3,9}}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('text = "abcd"; changed = subsasgn(text, substruct("()", {2}), "X"); text; changed'))).toBe(
                'text=abcd\nchanged=aXcd\nabcd\naXcd\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('numericTextChanged = subsasgn(text, substruct("()", {2}), 88); numericTextChanged'))).toBe(
                'numericTextChanged=aXcd\naXcd\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('pairChanged = subsasgn(text, substruct("()", {[1, 4]}), "XY"); pairChanged'))).toBe('pairChanged=XbcY\nXbcY\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('numericPairChanged = subsasgn(text, substruct("()", {[1, 4]}), [88, 89]); numericPairChanged'))).toBe(
                'numericPairChanged=XbcY\nXbcY\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('extendedText = subsasgn(text, substruct("()", {6}), "F"); extendedText'))).toBe('extendedText=abcd F\nabcd F\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('numericExtendedText = subsasgn(text, substruct("()", {6}), 70); numericExtendedText'))).toBe(
                'numericExtendedText=abcd F\nabcd F\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('logicalTextChanged = subsasgn(text, substruct("()", {[true, false, true, false]}), "XY"); logicalTextChanged'))).toBe(
                'logicalTextChanged=XbYd\nXbYd\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('deletedText = subsasgn(text, substruct("()", {2:3}), []); deletedText'))).toBe('deletedText=ad\nad\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('logicalTextDeleted = subsasgn(text, substruct("()", {[true, false, true, false]}), []); logicalTextDeleted'))).toBe(
                'logicalTextDeleted=bd\nbd\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('Column = [1; 2; 3; 4]; ColumnDeleted = subsasgn(Column, substruct("()", {[true, false, true, false]}), []); ColumnDeleted'),
                ),
            ).toBe('Column=[1;\n2;\n3;\n4]\nColumnDeleted=[2;\n4]\n[2;\n4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('LogicalCell = subsasgn(C, substruct("()", {[true, false]}), {9}); LogicalCell'))).toBe('LogicalCell={9,2}\n{9,2}\n');
            expect(() => localInterpreter.Execute('subsasgn(C, substruct("()", {2}), 9)')).toThrow('cell array assignment requires a cell array value.');
            expect(() => localInterpreter.Execute('subsasgn(text, substruct("{}", {1}), "X")')).toThrow('matrix cannot be indexed with {');
            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = PublicSubsasgnValue(); updated = subsasgn(obj, substruct("()", {5}), 10); obj.x; updated.x'))).toBe(
                'obj=PublicSubsasgnValue object with properties: x\nupdated=PublicSubsasgnValue object with properties: x\n0\n15\n',
            );
            expect(() => localInterpreter.Execute('subsasgn(A, substruct("{}", {1}), 9)')).toThrow('matrix cannot be indexed with {');
            expect(() => localInterpreter.Execute('subsasgn(A, struct("type", ".", "subs", {1}), 9)')).toThrow('invalid subsasgn descriptor.');
            expect(() => localInterpreter.Execute('subsasgn(A, struct("type", "bad", "subs", {1}), 9)')).toThrow('invalid subsasgn descriptor.');
        });

        it('Should dispatch class subsref methods for selected object array elements.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ArrayIndexedOverload',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    '      if numel(s) == 2',
                    '        y = 1000 + s(1).subs{1};',
                    '      else',
                    '        y = 10 + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = ArrayIndexedOverload()');
            localInterpreter.Execute('b = ArrayIndexedOverload()');
            localInterpreter.Execute('a.x = 1');
            localInterpreter.Execute('b.x = 2');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs(2)'))).toBe('12\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs(2).virtual'))).toBe('1002\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(objs, substruct("()", {2}))'))).toBe('12\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(objs, substruct("()", {2}, ".", "virtual"))'))).toBe('1002\n');
        });

        it('Should apply public subsref descriptors to class property chains.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef PublicNestedSubsrefChild', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef PublicNestedSubsrefPoint', '  properties', '    child = PublicNestedSubsrefChild();', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = PublicNestedSubsrefPoint()');
            localInterpreter.Execute('b = PublicNestedSubsrefPoint()');
            localInterpreter.Execute('a.child.x = 3');
            localInterpreter.Execute('b.child.x = 4');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(a, substruct(".", "child", ".", "x"))'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(objs, substruct(".", "child", ".", "x"))'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(objs, substruct("()", {2}, ".", "child", ".", "x"))'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[left, right] = subsref(objs, substruct(".", "child", ".", "x")); left; right'))).toBe('left=3\nright=4\n3\n4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[directLeft, directRight] = objs.child.x; directLeft; directRight'))).toBe('directLeft=3\ndirectRight=4\n3\n4\n');
        });

        it('Should apply public subsref descriptors to indexed nested class properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef PublicIndexedSubsrefChild', '  properties', '    values = [1, 2, 3];', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef PublicIndexedSubsrefPoint', '  properties', '    child = PublicIndexedSubsrefChild();', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = PublicIndexedSubsrefPoint()');
            localInterpreter.Execute('b = PublicIndexedSubsrefPoint()');
            localInterpreter.Execute('a.child.values = [10, 20, 30]');
            localInterpreter.Execute('b.child.values = [40, 50, 60]');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(a, substruct(".", "child", ".", "values", "()", {2}))'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(objs, substruct(".", "child", ".", "values", "()", {2}))'))).toBe('[20,50]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(objs, substruct("()", {2}, ".", "child", ".", "values", "()", {[1, 3]}))'))).toBe('[40,60]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[left, right] = subsref(objs, substruct(".", "child", ".", "values", "()", {2})); left; right'))).toBe(
                'left=20\nright=50\n20\n50\n',
            );
        });

        it('Should dispatch explicit multiple-output subsref for selected object array elements.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ArrayMultiOutputSubsref',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function n = numArgumentsFromSubscript(obj, s, context)',
                    '      n = 2;',
                    '    end',
                    '    function [a, b] = subsref(obj, s)',
                    '      a = obj.x + s.subs{1};',
                    '      b = obj.x + s.subs{1} + 10;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = ArrayMultiOutputSubsref()');
            localInterpreter.Execute('b = ArrayMultiOutputSubsref()');
            localInterpreter.Execute('a.x = 1');
            localInterpreter.Execute('b.x = 2');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('[first, second] = subsref(objs, substruct("()", {2})); first; second'))).toBe('first=4\nsecond=14\n4\n14\n');
        });

        it('Should dispatch class subsasgn methods for selected object array elements.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef ArrayAssignedOverload', '  methods', '    function obj = subsasgn(obj, s, value)', '      obj = value;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('a = ArrayAssignedOverload()');
            localInterpreter.Execute('b = ArrayAssignedOverload()');
            localInterpreter.Execute('objs = [a, b]');

            expect(() => localInterpreter.Execute('objs(2) = 5')).toThrow('subsasgn for class ArrayAssignedOverload must return an object of class ArrayAssignedOverload.');
            expect(() => localInterpreter.Execute('subsasgn(objs, substruct("()", {2}), 5)')).toThrow(
                'subsasgn for class ArrayAssignedOverload must return an object of class ArrayAssignedOverload.',
            );
        });

        it('Should apply public subsasgn descriptors to selected object array elements.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef PublicObjectArraySubsasgnValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = subsasgn(obj, s, value)',
                    '      obj.x = value + s.subs{1};',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = PublicObjectArraySubsasgnValue()');
            localInterpreter.Execute('b = PublicObjectArraySubsasgnValue()');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('updated = subsasgn(objs, substruct("()", {2}), 10); objs.x; updated.x'))).toBe(
                'updated=[PublicObjectArraySubsasgnValue object with properties: x,PublicObjectArraySubsasgnValue object with properties: x]\n[0,0]\n[0,12]\n',
            );
        });

        it('Should dispatch public subsref and subsasgn overloads for selected cell objects.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global cellSubsasgnLastValue; cellSubsasgnLastValue = 0');
            localInterpreter.Execute(
                [
                    'classdef PublicCellObjectOverload',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    '      y = 102;',
                    '    end',
                    '    function obj = subsasgn(obj, s, value)',
                    '      global cellSubsasgnLastValue',
                    '      cellSubsasgnLastValue = value;',
                    '      obj.x = value + 200;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = PublicCellObjectOverload(); b = PublicCellObjectOverload()');
            localInterpreter.Execute('a.x = 1; b.x = 2; C = {a, b}');

            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(C, substruct("{}", {2}, ".", "virtual"))'))).toBe('102\n');
            expect(
                localInterpreter.Unparse(localInterpreter.Execute('updated = subsasgn(C, substruct("{}", {2}, ".", "virtual"), 10); cellSubsasgnLastValue; iscell(updated); numel(updated)')),
            ).toBe('updated={PublicCellObjectOverload object with properties: x,PublicCellObjectOverload object with properties: x}\n10\ntrue\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('subsref(C, substruct("()", {[2, 1]}, "{}", {1}, ".", "virtual"))'))).toBe('102\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'updatedParen = subsasgn(C, substruct("()", {[2, 1]}, "{}", {1}, ".", "virtual"), 20); cellSubsasgnLastValue; iscell(updatedParen); numel(updatedParen)',
                    ),
                ),
            ).toBe('updatedParen={PublicCellObjectOverload object with properties: x,PublicCellObjectOverload object with properties: x}\n20\ntrue\n2\n');
        });

        it('Should dispatch multiple-output public subsref overloads for selected cell objects.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef PublicCellMultiOutputSubsref',
                    '  methods',
                    '    function n = numArgumentsFromSubscript(obj, s, context)',
                    '      n = 2;',
                    '    end',
                    '    function [a, b] = subsref(obj, s)',
                    '      a = 11;',
                    '      b = 22;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('C = {PublicCellMultiOutputSubsref(), PublicCellMultiOutputSubsref()}');

            expect(localInterpreter.Unparse(localInterpreter.Execute('[first, second] = subsref(C, substruct("{}", {2}, ".", "virtual")); first; second'))).toBe(
                'first=11\nsecond=22\n11\n22\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, maskedSecond] = subsref(C, substruct("{}", {1}, ".", "virtual")); maskedSecond'))).toBe('maskedSecond=22\n22\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[subFirst, subSecond] = subsref(C, substruct("()", {[2, 1]}, "{}", {1}, ".", "virtual")); subFirst; subSecond'))).toBe(
                'subFirst=11\nsubSecond=22\n11\n22\n',
            );
            expect(() => localInterpreter.Execute('[one, two, three] = subsref(C, substruct("{}", {2}, ".", "virtual"))')).toThrow('element number 3 undefined in return list');
        });

        it('Should apply public subsasgn descriptors to class property chains.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef PublicNestedSubsasgnChild', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef PublicNestedSubsasgnPoint', '  properties', '    child = PublicNestedSubsasgnChild();', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = PublicNestedSubsasgnPoint()');
            localInterpreter.Execute('b = PublicNestedSubsasgnPoint()');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('scalar = subsasgn(a, substruct(".", "child", ".", "x"), 5); a.child.x; scalar.child.x'))).toBe(
                'scalar=PublicNestedSubsasgnPoint object with properties: child\n0\n5\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('whole = subsasgn(objs, substruct(".", "child", ".", "x"), [30, 40]); objs.child.x; whole.child.x'))).toBe(
                'whole=[PublicNestedSubsasgnPoint object with properties: child,PublicNestedSubsasgnPoint object with properties: child]\n[0,0]\n[30,40]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('indexed = subsasgn(objs, substruct("()", {[2, 1]}, ".", "child", ".", "x"), [70, 60]); indexed.child.x'))).toBe(
                'indexed=[PublicNestedSubsasgnPoint object with properties: child,PublicNestedSubsasgnPoint object with properties: child]\n[60,70]\n',
            );
            localInterpreter.Execute('a.child.x = [1, 2, 3]');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scalarIndexed = subsasgn(a, substruct(".", "child", ".", "x", "()", {2}), 9); a.child.x; scalarIndexed.child.x'))).toBe(
                'scalarIndexed=PublicNestedSubsasgnPoint object with properties: child\n[1,2,3]\n[1,9,3]\n',
            );
            localInterpreter.Execute('[objs.child.x] = deal([1, 2, 3], [4, 5, 6])');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('indexedProperty = subsasgn(objs, substruct("()", {[2, 1]}, ".", "child", ".", "x", "()", {2}), [50, 20]); indexedProperty.child.x'),
                ),
            ).toBe('indexedProperty=[PublicNestedSubsasgnPoint object with properties: child,PublicNestedSubsasgnPoint object with properties: child]\n[[1,20,3],[4,50,6]]\n');
        });

        it('Should apply chained public subsasgn descriptors to selected object array elements.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef PublicObjectArrayChainedSubsasgnValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = subsasgn(obj, s, value)',
                    '      if numel(s) == 2',
                    '        obj.x = value + s(1).subs{1} + 100;',
                    '      else',
                    '        obj.x = value + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = PublicObjectArrayChainedSubsasgnValue()');
            localInterpreter.Execute('b = PublicObjectArrayChainedSubsasgnValue()');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('updated = subsasgn(objs, substruct("()", {2}, ".", "virtual"), 10); objs.x; updated.x'))).toBe(
                'updated=[PublicObjectArrayChainedSubsasgnValue object with properties: x,PublicObjectArrayChainedSubsasgnValue object with properties: x]\n[0,0]\n[0,112]\n',
            );
        });

        it('Should dispatch class subsref and subsasgn methods for dot references.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef DotIndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    "      if isequal(s.type, '.') && isequal(s.subs, 'virtual')",
                    '        y = obj.x + 10;',
                    '      else',
                    '        y = obj.x;',
                    '      end',
                    '    end',
                    '    function obj = subsasgn(obj, s, value)',
                    "      if isequal(s.type, '.') && isequal(s.subs, 'virtual')",
                    '        obj.x = value + 20;',
                    '      else',
                    '        obj.x = value;',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = DotIndexedValue()');
            localInterpreter.Execute('a.x = 3');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.virtual'))).toBe('13\n');
            localInterpreter.Execute('a.virtual = 5');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('25\n');
        });

        it('Should call class static methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef StaticCalculator',
                    '  methods (Static)',
                    '    function y = add(a, b)',
                    '      y = a + b;',
                    '    end',
                    '  end',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = 1;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('StaticCalculator.add(2, 3)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('StaticCalculator.value()')).toThrow("unknown static method 'value' for class StaticCalculator.");
        });

        it('Should create empty class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef EmptyArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('EmptyArrayPoint.empty()'))).toBe('[ ](0x0)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('EmptyArrayPoint.empty(0, 2)'))).toBe('[ ](0x2)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('EmptyArrayPoint.empty([2, 0])'))).toBe('[ ](2x0)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(EmptyArrayPoint.empty(0, 1))'))).toBe('true\n');
            expect(() => localInterpreter.Execute('EmptyArrayPoint.empty(1, 1)')).toThrow('EmptyArrayPoint.empty requires at least one zero dimension.');
            expect(() => localInterpreter.Execute('EmptyArrayPoint.empty(-1, 0)')).toThrow('EmptyArrayPoint.empty dimensions must be nonnegative integer scalars.');
        });

        it('Should enforce private class member access.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef SecretBox',
                    '  properties (Access = private)',
                    '    x = 7;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = reveal(obj)',
                    '      y = obj.hidden();',
                    '    end',
                    '  end',
                    '  methods (Access = private)',
                    '    function y = hidden(obj)',
                    '      y = obj.x + 1;',
                    '    end',
                    '  end',
                    '  methods (Static, Access = private)',
                    '    function y = privateStatic()',
                    '      y = 11;',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function y = publicStatic()',
                    '      y = SecretBox.privateStatic();',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('b = SecretBox()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('b.read()'))).toBe('7\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('b.reveal()'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('SecretBox.publicStatic()'))).toBe('11\n');
            expect(() => localInterpreter.Execute('b.x')).toThrow("property 'x' has private get access for class SecretBox.");
            expect(() => localInterpreter.Execute('b.hidden()')).toThrow("method 'hidden' has private access for class SecretBox.");
            expect(() => localInterpreter.Execute('SecretBox.privateStatic()')).toThrow("method 'privateStatic' has private access for class SecretBox.");
        });

        it('Should allow protected class member access from subclasses.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef BaseProtected',
                    '  properties (Access = protected)',
                    '    x = 5;',
                    '  end',
                    '  methods (Access = protected)',
                    '    function y = hiddenBase(obj)',
                    '      y = obj.x + 1;',
                    '    end',
                    '  end',
                    '  methods (Static, Access = protected)',
                    '    function y = hiddenStatic()',
                    '      y = 13;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef ChildProtected < BaseProtected',
                    '  methods',
                    '    function y = readBase(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = revealBase(obj)',
                    '      y = obj.hiddenBase();',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function y = revealStatic()',
                    '      y = ChildProtected.hiddenStatic();',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = ChildProtected()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.readBase()'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.revealBase()'))).toBe('6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ChildProtected.revealStatic()'))).toBe('13\n');
            expect(() => localInterpreter.Execute('c.x')).toThrow("property 'x' has protected get access for class ChildProtected.");
            expect(() => localInterpreter.Execute('c.hiddenBase()')).toThrow("method 'hiddenBase' has protected access for class ChildProtected.");
            expect(() => localInterpreter.Execute('ChildProtected.hiddenStatic()')).toThrow("method 'hiddenStatic' has protected access for class ChildProtected.");
        });

        it('Should allow class-qualified member access from friend classes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef FriendTarget',
                    '  properties (Access = {?FriendAccessor, ?FriendAuditor})',
                    '    x = 17;',
                    '  end',
                    '  methods (Access = {?FriendAccessor, ?FriendAuditor})',
                    '    function y = hidden(obj)',
                    '      y = obj.x + 1;',
                    '    end',
                    '  end',
                    '  methods (Static, Access = {?FriendAccessor, ?FriendAuditor})',
                    '    function y = hiddenStatic()',
                    '      y = 19;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef FriendAccessor',
                    '  methods',
                    '    function y = read(obj, target)',
                    '      y = target.x;',
                    '    end',
                    '    function y = reveal(obj, target)',
                    '      y = target.hidden();',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function y = revealStatic()',
                    '      y = FriendTarget.hiddenStatic();',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                ['classdef FriendAuditor', '  methods', '    function y = audit(obj, target)', '      y = target.x + target.hidden();', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(['classdef FriendAuditorChild < FriendAuditor', 'end'].join('\n'));
            localInterpreter.Execute('target = FriendTarget()');
            localInterpreter.Execute('friend = FriendAccessor()');
            localInterpreter.Execute('auditor = FriendAuditorChild()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('friend.read(target)'))).toBe('17\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('friend.reveal(target)'))).toBe('18\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('auditor.audit(target)'))).toBe('35\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('FriendAccessor.revealStatic()'))).toBe('19\n');
            expect(() => localInterpreter.Execute('target.x')).toThrow("property 'x' has {?FriendAccessor,?FriendAuditor} get access for class FriendTarget.");
            expect(() => localInterpreter.Execute('target.hidden()')).toThrow("method 'hidden' has {?FriendAccessor,?FriendAuditor} access for class FriendTarget.");
            expect(() => localInterpreter.Execute('FriendTarget.hiddenStatic()')).toThrow("method 'hiddenStatic' has {?FriendAccessor,?FriendAuditor} access for class FriendTarget.");
        });

        it('Should honor negated and false class attributes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef (Abstract = false, Sealed = false) RuntimeFalseAttributes', '  properties (~Dependent, Constant = false, Hidden = false)', '    Value = 1;', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute('obj = RuntimeFalseAttributes()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj.Value'))).toBe('1\n');
            localInterpreter.Execute('obj.Value = 2');
            expect(localInterpreter.Unparse(localInterpreter.Execute('obj.Value'))).toBe('2\n');
        });

        it('Should reject unsupported class and section attributes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef (Imaginary) InvalidRuntimeClassAttribute', 'end'].join('\n'))).toThrow(
                'unsupported Imaginary attribute for class InvalidRuntimeClassAttribute.',
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimePropertyAttribute', '  properties (Static)', '    Value = 1;', '  end', 'end'].join('\n'))).toThrow(
                'unsupported Static attribute for properties section of class InvalidRuntimePropertyAttribute.',
            );
            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeMethodAttribute', '  methods (Dependent)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow('unsupported Dependent attribute for methods section of class InvalidRuntimeMethodAttribute.');
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeEventAttribute', '  events (SetAccess = private)', '    Changed', '  end', 'end'].join('\n'))).toThrow(
                'unsupported SetAccess attribute for events section of class InvalidRuntimeEventAttribute.',
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeEnumerationAttribute', '  enumeration (Access = private)', '    One', '  end', 'end'].join('\n'))).toThrow(
                'unsupported Access attribute for enumeration section of class InvalidRuntimeEnumerationAttribute.',
            );
        });

        it('Should reject duplicate class and section attributes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef (Hidden, Hidden) DuplicateRuntimeClassAttribute', 'end'].join('\n'))).toThrow(
                'duplicate Hidden attribute for class DuplicateRuntimeClassAttribute.',
            );
            expect(() =>
                localInterpreter.Execute(['classdef DuplicateRuntimePropertyAttribute', '  properties (Access = public, Access = private)', '    Value = 1;', '  end', 'end'].join('\n')),
            ).toThrow('duplicate Access attribute for properties section of class DuplicateRuntimePropertyAttribute.');
            expect(() =>
                localInterpreter.Execute(
                    ['classdef DuplicateRuntimeMethodAttribute', '  methods (Static, Static)', '    function y = value()', '      y = 1;', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow('duplicate Static attribute for methods section of class DuplicateRuntimeMethodAttribute.');
            expect(() =>
                localInterpreter.Execute(['classdef DuplicateRuntimeEventAttribute', '  events (ListenAccess = public, ListenAccess = private)', '    Changed', '  end', 'end'].join('\n')),
            ).toThrow('duplicate ListenAccess attribute for events section of class DuplicateRuntimeEventAttribute.');
        });

        it('Should reject non-boolean values for boolean class and section attributes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef (Abstract = 1) InvalidRuntimeClassBoolean', 'end'].join('\n'))).toThrow(
                'invalid boolean Abstract attribute for class InvalidRuntimeClassBoolean.',
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimePropertyBoolean', '  properties (Constant = 1)', '    Value = 1;', '  end', 'end'].join('\n'))).toThrow(
                'invalid boolean Constant attribute for properties section of class InvalidRuntimePropertyBoolean.',
            );
            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeMethodBoolean', '  methods (Static = 1)', '    function y = value()', '      y = 1;', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow('invalid boolean Static attribute for methods section of class InvalidRuntimeMethodBoolean.');
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeEventBoolean', '  events (Hidden = 1)', '    Changed', '  end', 'end'].join('\n'))).toThrow(
                'invalid boolean Hidden attribute for events section of class InvalidRuntimeEventBoolean.',
            );
        });

        it('Should reject invalid class-name-list attribute values.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef (InferiorClasses = 1) InvalidRuntimeInferiorClasses', 'end'].join('\n'))).toThrow(
                'invalid class-name list InferiorClasses attribute for class InvalidRuntimeInferiorClasses.',
            );
            expect(() => localInterpreter.Execute(['classdef (AllowedSubclasses) MissingRuntimeAllowedSubclasses', 'end'].join('\n'))).toThrow(
                'invalid class-name list AllowedSubclasses attribute for class MissingRuntimeAllowedSubclasses.',
            );
            expect(() =>
                localInterpreter.Execute(['classdef InvalidRuntimePartialMatchPriority', '  properties (PartialMatchPriority = 0)', '    Value', '  end', 'end'].join('\n')),
            ).toThrow('invalid positive integer PartialMatchPriority attribute for properties section of class InvalidRuntimePartialMatchPriority.');
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeValueNonCopyable', '  properties (NonCopyable)', '    Value', '  end', 'end'].join('\n'))).toThrow(
                "NonCopyable property 'Value' in class InvalidRuntimeValueNonCopyable requires a handle class.",
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeValueAbortSet', '  properties (AbortSet)', '    Value = 1;', '  end', 'end'].join('\n'))).toThrow(
                "AbortSet property 'Value' in class InvalidRuntimeValueAbortSet requires a handle class.",
            );
            localInterpreter.Execute(['classdef RuntimeHandleAbortSet < handle', '  properties (AbortSet)', '    Value = 1;', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("RuntimeHandleAbortSet").PropertyList(1).AbortSet'))).toBe('true\n');
            expect(() =>
                localInterpreter.Execute(['classdef InvalidRuntimeValuePartialPriority', '  properties (PartialMatchPriority = 2)', '    Value', '  end', 'end'].join('\n')),
            ).toThrow("PartialMatchPriority property 'Value' in class InvalidRuntimeValuePartialPriority requires matlab.mixin.SetGet.");
        });

        it('Should reject invalid class member access attributes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(['classdef InvalidRuntimeAccess', '  methods (Access = 1)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            ).toThrow('invalid Access attribute for methods section of class InvalidRuntimeAccess.');
            expect(() =>
                localInterpreter.Execute(['classdef InvalidRuntimeNotifyAccess < handle', '  events (NotifyAccess = {public, ?FriendRuntime})', '    Changed', '  end', 'end'].join('\n')),
            ).toThrow('invalid NotifyAccess attribute for events section of class InvalidRuntimeNotifyAccess.');
            expect(() =>
                localInterpreter.Execute(['classdef MissingRuntimeAccessValue', '  methods (Access)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            ).toThrow('invalid Access attribute for methods section of class MissingRuntimeAccessValue.');
            expect(() => localInterpreter.Execute(['classdef MissingRuntimeSetAccessValue', '  properties (SetAccess)', '    Value = 1;', '  end', 'end'].join('\n'))).toThrow(
                'invalid SetAccess attribute for properties section of class MissingRuntimeSetAccessValue.',
            );
            expect(() => localInterpreter.Execute(['classdef MissingRuntimeNotifyAccessValue', '  events (NotifyAccess)', '    Changed', '  end', 'end'].join('\n'))).toThrow(
                'invalid NotifyAccess attribute for events section of class MissingRuntimeNotifyAccessValue.',
            );
        });

        it('Should reject incompatible class attribute combinations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef (Abstract, Sealed) InvalidRuntimeAbstractSealed', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeAbstractSealed cannot be both abstract and sealed.',
            );
            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeAbstractSealedMethod', '  methods (Abstract, Sealed)', '    function y = value(obj)', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow('methods section of class InvalidRuntimeAbstractSealedMethod cannot be both abstract and sealed.');
            expect(() => localInterpreter.Execute(['classdef (Sealed) InvalidRuntimeSealedAbstractMethod', '  methods (Abstract)', '    y = value(obj)', '  end', 'end'].join('\n'))).toThrow(
                "sealed class InvalidRuntimeSealedAbstractMethod cannot define abstract method 'value'.",
            );
            expect(() => localInterpreter.Execute(['classdef (Sealed) InvalidRuntimeSealedAbstractProperty', '  properties (Abstract)', '    Value', '  end', 'end'].join('\n'))).toThrow(
                "sealed class InvalidRuntimeSealedAbstractProperty cannot define abstract property 'Value'.",
            );
            localInterpreter.Execute(['classdef RuntimeEnumerationBase', '  enumeration', '    One', '  end', 'end'].join('\n'));
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeEnumerationSubclass < RuntimeEnumerationBase', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeEnumerationSubclass cannot inherit from sealed class RuntimeEnumerationBase.',
            );
        });

        it('Should reject incompatible property attribute combinations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeDependentDefault', '  properties (Dependent)', '    Value = 1;', '  end', 'end'].join('\n'))).toThrow(
                "dependent property 'Value' in class InvalidRuntimeDependentDefault cannot define a default value.",
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeDependentConstant', '  properties (Dependent, Constant)', '    Value', '  end', 'end'].join('\n'))).toThrow(
                "property 'Value' in class InvalidRuntimeDependentConstant cannot be both dependent and constant.",
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeConstantWithoutDefault', '  properties (Constant)', '    Value', '  end', 'end'].join('\n'))).toThrow(
                "constant property 'Value' in class InvalidRuntimeConstantWithoutDefault must define a default value.",
            );
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeAbstractGetMethod',
                        '  properties (Abstract, GetMethod = readValue)',
                        '    Value',
                        '  end',
                        '  methods',
                        '    function y = readValue(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("abstract property 'Value' in class InvalidRuntimeAbstractGetMethod cannot define a GetMethod.");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeAbstractSetMethod',
                        '  properties (Abstract, SetMethod = writeValue)',
                        '    Value',
                        '  end',
                        '  methods',
                        '    function obj = writeValue(obj, value)',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("abstract property 'Value' in class InvalidRuntimeAbstractSetMethod cannot define a SetMethod.");
        });

        it('Should reject class members with class-name conflicts.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeClassNamedProperty', '  properties', '    InvalidRuntimeClassNamedProperty', '  end', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeClassNamedProperty cannot define property with the same name as the class.',
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeClassNamedEvent < handle', '  events', '    InvalidRuntimeClassNamedEvent', '  end', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeClassNamedEvent cannot define event with the same name as the class.',
            );
            expect(() =>
                localInterpreter.Execute(['classdef InvalidRuntimeClassNamedEnumeration', '  enumeration', '    InvalidRuntimeClassNamedEnumeration', '  end', 'end'].join('\n')),
            ).toThrow('class InvalidRuntimeClassNamedEnumeration cannot define enumeration member with the same name as the class.');
        });

        it('Should validate inherited property redefinitions.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef AbstractRuntimePropertyBase', '  properties (Abstract, SetAccess = protected)', '    Value', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                ['classdef ConcreteRuntimePropertyChild < AbstractRuntimePropertyBase', '  properties (SetAccess = protected)', '    Value = 1', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(['classdef PrivateRuntimePropertyBase', '  properties (Access = private)', '    Value = 2', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef PrivateRuntimePropertyChild < PrivateRuntimePropertyBase', '  properties', '    Value = 3', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('ConcreteRuntimePropertyChild().Value'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('PrivateRuntimePropertyChild().Value'))).toBe('3\n');
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeConcretePropertyBase',
                        '  properties',
                        '    Value = 1',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeConcretePropertyChild < InvalidRuntimeConcretePropertyBase',
                        '  properties',
                        '    Value = 2',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("property 'Value' in class InvalidRuntimeConcretePropertyChild cannot redefine inherited property from class InvalidRuntimeConcretePropertyBase.");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeAbstractAccessBase',
                        '  properties (Abstract, SetAccess = protected)',
                        '    Value',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeAbstractAccessChild < InvalidRuntimeAbstractAccessBase',
                        '  properties',
                        '    Value = 1',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow(
                "property 'Value' in class InvalidRuntimeAbstractAccessChild must match inherited GetAccess and SetAccess from abstract property in class InvalidRuntimeAbstractAccessBase.",
            );
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeLeftProperty',
                        '  properties',
                        '    Value = 1',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeRightProperty',
                        '  properties',
                        '    Value = 2',
                        '  end',
                        'end',
                        'classdef InvalidRuntimePropertyDiamond < InvalidRuntimeLeftProperty & InvalidRuntimeRightProperty',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("class InvalidRuntimePropertyDiamond inherits incompatible property 'Value' from multiple superclasses.");
        });

        it('Should validate inherited method overrides.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef RuntimeMethodAccessBase', '  methods (Access = protected)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef RuntimeMethodAccessChild < RuntimeMethodAccessBase',
                    '  methods (Access = protected)',
                    '    function y = value(obj)',
                    '      y = 2;',
                    '    end',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.value();',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                ['classdef RuntimePrivateMethodBase', '  methods (Access = private)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(
                ['classdef RuntimePrivateMethodChild < RuntimePrivateMethodBase', '  methods', '    function y = value(obj)', '      y = 3;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(['classdef RuntimeLeftMethod', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                ['classdef RuntimeRightMethodPrivate', '  methods (Access = private)', '    function y = value(obj)', '      y = 2;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(['classdef RuntimeMethodDiamondPrivate < RuntimeLeftMethod & RuntimeRightMethodPrivate', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('RuntimeMethodAccessChild().read()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('RuntimePrivateMethodChild().value()'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('RuntimeMethodDiamondPrivate().value()'))).toBe('1\n');
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeMethodAccessBase',
                        '  methods (Access = protected)',
                        '    function y = value(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeMethodAccessChild < InvalidRuntimeMethodAccessBase',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 2;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("method 'value' in class InvalidRuntimeMethodAccessChild must match inherited Access from method in class InvalidRuntimeMethodAccessBase.");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeLeftMethod',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeRightMethod',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 2;',
                        '    end',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeMethodDiamond < InvalidRuntimeLeftMethod & InvalidRuntimeRightMethod',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("class InvalidRuntimeMethodDiamond inherits incompatible method 'value' from multiple superclasses.");
            localInterpreter.Execute(
                [
                    'classdef RuntimeLeftOverriddenMethod',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = 1;',
                    '    end',
                    '  end',
                    'end',
                    'classdef RuntimeRightOverriddenMethod',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = 2;',
                    '    end',
                    '  end',
                    'end',
                    'classdef RuntimeMethodDiamondOverride < RuntimeLeftOverriddenMethod & RuntimeRightOverriddenMethod',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = 4;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('RuntimeMethodDiamondOverride().value()'))).toBe('4\n');
        });

        it('Should validate inherited event conflicts.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef RuntimeLeftEvent < handle', '  events', '    Changed', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeRightPrivateEvent < handle', '  events (ListenAccess = private, NotifyAccess = private)', '    Changed', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeEventDiamondPrivate < RuntimeLeftEvent & RuntimeRightPrivateEvent', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeCommonEventBase < handle', '  events', '    Changed', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeLeftCommonEvent < RuntimeCommonEventBase', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeRightCommonEvent < RuntimeCommonEventBase', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeEventDiamondCommon < RuntimeLeftCommonEvent & RuntimeRightCommonEvent', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('events("RuntimeEventDiamondPrivate")'))).toBe('{Changed}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('events("RuntimeEventDiamondCommon")'))).toBe('{Changed}\n');
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeLeftEvent < handle',
                        '  events',
                        '    Changed',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeRightEvent < handle',
                        '  events',
                        '    Changed',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeEventDiamond < InvalidRuntimeLeftEvent & InvalidRuntimeRightEvent',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("class InvalidRuntimeEventDiamond inherits incompatible event 'Changed' from multiple superclasses.");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeLeftEventOverride < handle',
                        '  events',
                        '    Changed',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeRightEventOverride < handle',
                        '  events',
                        '    Changed',
                        '  end',
                        'end',
                        'classdef InvalidRuntimeEventDiamondOverride < InvalidRuntimeLeftEventOverride & InvalidRuntimeRightEventOverride',
                        '  events',
                        '    Changed',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("class InvalidRuntimeEventDiamondOverride inherits incompatible event 'Changed' from multiple superclasses.");
        });

        it('Should reject events in value classes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeValueEvent', '  events', '    Changed', '  end', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeValueEvent cannot define events because it is not a handle class.',
            );
            localInterpreter.Execute(['classdef ValidRuntimeHandleEvent < handle', '  events', '    Changed', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('events("ValidRuntimeHandleEvent")'))).toBe('{Changed}\n');
        });

        it('Should reject abstract methods with method bodies.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeAbstractBody', '  methods (Abstract)', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow("abstract method 'value' in class InvalidRuntimeAbstractBody cannot define a method body.");
        });

        it('Should reject arguments blocks in abstract and delete methods.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeAbstractArguments',
                        '  methods (Abstract)',
                        '    function y = value(obj, x)',
                        '      arguments',
                        '        obj',
                        '        x double',
                        '      end',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("arguments blocks are not allowed in abstract method 'value' of class InvalidRuntimeAbstractArguments.");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef InvalidRuntimeDeleteArguments < handle',
                        '  methods',
                        '    function delete(obj)',
                        '      arguments',
                        '        obj',
                        '      end',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow('arguments blocks are not allowed in delete method of class InvalidRuntimeDeleteArguments.');
            localInterpreter.Execute(
                [
                    'classdef ValidRuntimeConcreteMethodArguments',
                    '  methods',
                    '    function y = value(obj, x)',
                    '      arguments',
                    '        obj',
                    '        x double',
                    '      end',
                    '      y = x;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('ValidRuntimeConcreteMethodArguments().value(4)'))).toBe('4\n');
        });

        it('Should support abstract method prototypes and reject concrete prototype calls.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef AbstractPrototypeShape', '  methods (Abstract)', '    y = area(obj)', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                ['classdef ImplementedPrototypeShape < AbstractPrototypeShape', '  methods', '    function y = area(obj)', '      y = 21;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(['classdef ConcretePrototypeMethod', '  methods', '    y = value(obj)', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef ConcretePrototypeConstructor', '  methods', '    obj = ConcretePrototypeConstructor(x)', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('ImplementedPrototypeShape().area()'))).toBe('21\n');
            expect(() => localInterpreter.Execute('AbstractPrototypeShape()')).toThrow('cannot instantiate abstract class AbstractPrototypeShape: missing implementations for area.');
            expect(() => localInterpreter.Execute('ConcretePrototypeMethod().value()')).toThrow("method 'value' for class ConcretePrototypeMethod is declared without a body.");
            expect(() => localInterpreter.Execute('ConcretePrototypeConstructor(1)')).toThrow(
                "method 'ConcretePrototypeConstructor' for class ConcretePrototypeConstructor is declared without a body.",
            );
        });

        it('Should load external class method files for concrete prototypes.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@ExternalMethodBox/ExternalMethodBox.m': [
                        'classdef ExternalMethodBox',
                        '  properties',
                        '    x = 7;',
                        '  end',
                        '  properties (Dependent)',
                        '    DependentValue',
                        '  end',
                        '  methods',
                        '    y = value(obj, x)',
                        '    [] = touch(obj)',
                        '    y = mismatch(obj)',
                        '    [] = mismatchVoid(obj)',
                        '    y = get.DependentValue(obj)',
                        '    y = plus(obj, other)',
                        '  end',
                        '  methods (Static)',
                        '    y = scale(x)',
                        '  end',
                        'end',
                    ].join('\n'),
                    '+pkg/@ExternalMethodBox/value.m': ['function y = value(obj, x)', '  y = obj.x + localoffset(x);', 'end', 'function z = localoffset(x)', '  z = x + 1;', 'end'].join(
                        '\n',
                    ),
                    '+pkg/@ExternalMethodBox/touch.m': ['function [] = touch(obj)', '  obj.x = 99;', 'end'].join('\n'),
                    '+pkg/@ExternalMethodBox/scale.m': ['function y = scale(x)', '  y = x * 3;', 'end'].join('\n'),
                    '+pkg/@ExternalMethodBox/mismatch.m': ['function [y, extra] = mismatch(obj)', '  y = obj.x;', '  extra = 1;', 'end'].join('\n'),
                    '+pkg/@ExternalMethodBox/mismatchVoid.m': ['function y = mismatchVoid(obj)', '  y = obj.x;', 'end'].join('\n'),
                    '+pkg/@ExternalMethodBox/get.DependentValue.m': ['function y = get.DependentValue(obj)', '  y = obj.x * 10;', 'end'].join('\n'),
                    '+pkg/@ExternalMethodBox/plus.m': ['function y = plus(obj, other)', '  y = obj.x + other;', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('box = pkg.ExternalMethodBox(); box.value(4); pkg.ExternalMethodBox.scale(5); box.DependentValue; box + 6'))).toBe(
                'box=pkg.ExternalMethodBox object with properties: x\n12\n15\n70\n13\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("pkg.ExternalMethodBox.value", "class"); which("pkg.ExternalMethodBox.value")'))).toBe(
                '0\npkg.ExternalMethodBox.value not found\n',
            );
            expect(() => localInterpreter.Execute('localoffset(1)')).toThrow("'localoffset' undefined.");
            expect(() => localInterpreter.Execute('box.mismatch()')).toThrow("method 'mismatch' for class pkg.ExternalMethodBox external definition does not match its classdef prototype.");
            expect(() => localInterpreter.Execute('box.mismatchVoid()')).toThrow(
                "method 'mismatchVoid' for class pkg.ExternalMethodBox external definition does not match its classdef prototype.",
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('box.touch(); box.x'))).toBe('7\n');
        });

        it('Should validate external class method file subfunctions before registration.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '@InvalidExternalMethodSubfunctionBox/InvalidExternalMethodSubfunctionBox.m': [
                        'classdef InvalidExternalMethodSubfunctionBox',
                        '  methods',
                        '    y = value(obj)',
                        '  end',
                        'end',
                    ].join('\n'),
                    '@InvalidExternalMethodSubfunctionBox/value.m': ['function y = value(obj)', '  y = localbad(1, 2);', 'end', 'function z = localbad(x, x)', '  z = x;', 'end'].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute('InvalidExternalMethodSubfunctionBox().value()')).toThrow("duplicate parameter name 'x' in function localbad.");
        });

        it('Should reject duplicate external class method file subfunctions before registration.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '@DuplicateExternalMethodSubfunctionBox/DuplicateExternalMethodSubfunctionBox.m': [
                        'classdef DuplicateExternalMethodSubfunctionBox',
                        '  methods',
                        '    y = value(obj)',
                        '  end',
                        'end',
                    ].join('\n'),
                    '@DuplicateExternalMethodSubfunctionBox/value.m': [
                        'function y = value(obj)',
                        '  y = localdup();',
                        'end',
                        'function z = localdup()',
                        '  z = 1;',
                        'end',
                        'function z = localdup()',
                        '  z = 2;',
                        'end',
                    ].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute('DuplicateExternalMethodSubfunctionBox().value()')).toThrow(
                "duplicate function 'localdup' in method file DuplicateExternalMethodSubfunctionBox.value.",
            );
        });

        it('Should load external class indexed-reference method files for concrete prototypes.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@ExternalIndexedBox/ExternalIndexedBox.m': [
                        'classdef ExternalIndexedBox',
                        '  properties',
                        '    x = 7;',
                        '  end',
                        '  methods',
                        '    n = numArgumentsFromSubscript(obj, s, context)',
                        '    [a, b] = subsref(obj, s)',
                        '    obj = subsasgn(obj, s, value)',
                        '  end',
                        'end',
                    ].join('\n'),
                    '+pkg/@ExternalIndexedBox/numArgumentsFromSubscript.m': [
                        'function n = numArgumentsFromSubscript(obj, s, context)',
                        '  if isequal(context, "subsref") && isequal(s.type, "{}")',
                        '    n = 2;',
                        '  else',
                        '    n = 1;',
                        '  end',
                        'end',
                    ].join('\n'),
                    '+pkg/@ExternalIndexedBox/subsref.m': [
                        'function [a, b] = subsref(obj, s)',
                        '  if isequal(s.type, "()")',
                        '    a = obj.x + s.subs{1};',
                        '  elseif isequal(s.type, "{}")',
                        '    a = obj.x;',
                        '    b = obj.x + 1;',
                        '  else',
                        '    a = obj.x;',
                        '  end',
                        'end',
                    ].join('\n'),
                    '+pkg/@ExternalIndexedBox/subsasgn.m': ['function obj = subsasgn(obj, s, value)', '  if isequal(s.type, "()")', '    obj.x = value + s.subs{1};', '  end', 'end'].join(
                        '\n',
                    ),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('box = pkg.ExternalIndexedBox(); box(3); box(2) = 40; box.x; [a, b] = box{}'))).toBe(
                'box=pkg.ExternalIndexedBox object with properties: x\n10\nbox=pkg.ExternalIndexedBox object with properties: x\n42\na=42\nb=43\n',
            );
        });

        it('Should load inherited external class method files from the declaring superclass.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@ExternalBase/ExternalBase.m': ['classdef ExternalBase', '  properties', '    x = 11;', '  end', '  methods', '    y = value(obj, z)', '  end', 'end'].join('\n'),
                    '+pkg/@ExternalBase/value.m': ['function y = value(obj, z)', '  y = obj.x + z;', 'end'].join('\n'),
                    '+pkg/@ExternalChild/ExternalChild.m': ['classdef ExternalChild < pkg.ExternalBase', 'end'].join('\n'),
                    '+pkg/@ExternalChild/value.m': ['function y = value(obj, z)', '  y = 999;', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('child = pkg.ExternalChild(); child.value(5)'))).toBe('child=pkg.ExternalChild object with properties: x\n16\n');
        });

        it('Should load inherited external static class method files from the declaring superclass.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@ExternalStaticBase/ExternalStaticBase.m': ['classdef ExternalStaticBase', '  methods (Static)', '    y = scale(x)', '  end', 'end'].join('\n'),
                    '+pkg/@ExternalStaticBase/scale.m': ['function y = scale(x)', '  y = x * 4;', 'end'].join('\n'),
                    '+pkg/@ExternalStaticChild/ExternalStaticChild.m': ['classdef ExternalStaticChild < pkg.ExternalStaticBase', 'end'].join('\n'),
                    '+pkg/@ExternalStaticChild/scale.m': ['function y = scale(x)', '  y = 999;', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.ExternalStaticBase.scale(2); pkg.ExternalStaticChild.scale(3)'))).toBe('8\n12\n');
        });

        it('Should reject static and abstract constructors.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeStaticConstructor', '  methods (Static)', '    function obj = InvalidRuntimeStaticConstructor()', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow('constructor for class InvalidRuntimeStaticConstructor cannot be static.');
            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeAbstractConstructor', '  methods (Abstract)', '    function obj = InvalidRuntimeAbstractConstructor()', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow('constructor for class InvalidRuntimeAbstractConstructor cannot be abstract.');
        });

        it('Should reject constructors without exactly one output.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeNoOutputConstructor', '  methods', '    function InvalidRuntimeNoOutputConstructor()', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow('constructor for class InvalidRuntimeNoOutputConstructor must declare exactly one output.');
            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeMultiOutputConstructor', '  methods', '    function [obj, extra] = InvalidRuntimeMultiOutputConstructor()', '    end', '  end', 'end'].join(
                        '\n',
                    ),
                ),
            ).toThrow('constructor for class InvalidRuntimeMultiOutputConstructor must declare exactly one output.');
        });

        it('Should require ConstructOnLoad constructors to accept zero inputs.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef (ConstructOnLoad) RuntimeConstructOnLoadNoInput', '  methods', '    function obj = RuntimeConstructOnLoadNoInput()', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute(
                ['classdef (ConstructOnLoad) RuntimeConstructOnLoadDefault', '  methods', '    function obj = RuntimeConstructOnLoadDefault(value = 1)', '    end', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute(
                ['classdef (ConstructOnLoad) RuntimeConstructOnLoadVarargin', '  methods', '    function obj = RuntimeConstructOnLoadVarargin(varargin)', '    end', '  end', 'end'].join(
                    '\n',
                ),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeConstructOnLoadNoInput).ConstructOnLoad'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeConstructOnLoadDefault).ConstructOnLoad'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeConstructOnLoadVarargin).ConstructOnLoad'))).toBe('true\n');
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef (ConstructOnLoad) InvalidRuntimeConstructOnLoadRequired',
                        '  methods',
                        '    function obj = InvalidRuntimeConstructOnLoadRequired(value)',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow('ConstructOnLoad class InvalidRuntimeConstructOnLoadRequired constructor must support zero input arguments.');
        });

        it('Should reject invalid property accessor methods.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(['classdef InvalidRuntimeAccessorProperty', '  methods', '    function y = get.Missing(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n')),
            ).toThrow("get accessor 'get.Missing' in class InvalidRuntimeAccessorProperty does not match a class property.");
            expect(() =>
                localInterpreter.Execute(
                    ['classdef InvalidRuntimeSetterSignature', '  properties', '    Value', '  end', '  methods', '    function obj = set.Value(obj)', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow("set accessor 'set.Value' in class InvalidRuntimeSetterSignature must declare two inputs and one output.");
        });

        it('Should reject duplicate direct class members.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef DuplicateRuntimeProperty', '  properties', '    Value = 1;', '    Value = 2;', '  end', 'end'].join('\n'))).toThrow(
                "duplicate property 'Value' in class DuplicateRuntimeProperty.",
            );
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef DuplicateRuntimeMethod',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 1;',
                        '    end',
                        '    function y = value(obj)',
                        '      y = 2;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("duplicate method 'value' in class DuplicateRuntimeMethod.");
            expect(() => localInterpreter.Execute(['classdef DuplicateRuntimeEvent', '  events', '    Changed', '    Changed', '  end', 'end'].join('\n'))).toThrow(
                "duplicate event 'Changed' in class DuplicateRuntimeEvent.",
            );
        });

        it('Should reject cross-kind direct class member name conflicts.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef RuntimePropertyMethodConflict',
                        '  properties',
                        '    Value = 1;',
                        '  end',
                        '  methods',
                        '    function y = Value(obj)',
                        '      y = 2;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("class RuntimePropertyMethodConflict has conflicting property and method named 'Value'.");
            expect(() =>
                localInterpreter.Execute(['classdef RuntimePropertyEventConflict', '  properties', '    Changed', '  end', '  events', '    Changed', '  end', 'end'].join('\n')),
            ).toThrow("class RuntimePropertyEventConflict has conflicting property and event named 'Changed'.");
            expect(() =>
                localInterpreter.Execute(['classdef RuntimePropertyEnumerationConflict', '  properties', '    One = 1;', '  end', '  enumeration', '    One', '  end', 'end'].join('\n')),
            ).toThrow("class RuntimePropertyEnumerationConflict has conflicting property and enumeration member named 'One'.");
        });

        it('Should reject direct class self-inheritance.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeSelfInheritance < InvalidRuntimeSelfInheritance', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeSelfInheritance cannot inherit from itself.',
            );
        });

        it('Should call superclass constructors from subclass constructors.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef BaseConstructed', '  properties', '    x = 0;', '  end', '  methods', '    function obj = BaseConstructed(x)', '      obj.x = x;', '    end', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute(
                [
                    'classdef ChildConstructed < BaseConstructed',
                    '  properties',
                    '    y = 0;',
                    '  end',
                    '  methods',
                    '    function obj = ChildConstructed(x, y)',
                    '      obj = obj@BaseConstructed(x);',
                    '      obj.y = y;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = ChildConstructed(4, 9)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.x'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.y'))).toBe('9\n');
            expect(() => localInterpreter.Execute('c@BaseConstructed(1)')).toThrow("superclass constructor 'BaseConstructed' is only accessible from class methods.");
        });

        it('Should override inherited methods and call superclass methods explicitly.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef BaseOverride', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'classdef ChildOverride < BaseOverride',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = 2;',
                    '    end',
                    '    function y = baseValue(obj)',
                    '      y = value@BaseOverride(obj);',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = ChildOverride()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.value()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.baseValue()'))).toBe('1\n');
            expect(() => localInterpreter.Execute('value@BaseOverride(c)')).toThrow("superclass method 'value' is only accessible from class methods.");
        });

        it('Should parse and resolve MATLAB-like ampersand superclass lists.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef LeftAmpersandBase',
                    '  properties',
                    '    leftValue = 2;',
                    '  end',
                    '  methods',
                    '    function y = left(obj)',
                    '      y = obj.leftValue;',
                    '    end',
                    '  end',
                    'end',
                    'classdef RightAmpersandBase',
                    '  properties',
                    '    rightValue = 3;',
                    '  end',
                    '  methods',
                    '    function y = right(obj)',
                    '      y = obj.rightValue;',
                    '    end',
                    '  end',
                    'end',
                    'classdef AmpersandChild < LeftAmpersandBase & RightAmpersandBase',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('c = AmpersandChild(); c.left() + c.right()'))).toBe(
                'c=AmpersandChild object with properties: leftValue,rightValue\n5\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('superclasses("AmpersandChild")'))).toBe('{LeftAmpersandBase;\nRightAmpersandBase}\n');
        });

        it('Should enforce abstract and sealed class attributes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef (Abstract) AbstractShape', '  methods (Abstract)', '    function y = area(obj)', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef CircleShape < AbstractShape', '  methods', '    function y = area(obj)', '      y = 12;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef PendingShape < AbstractShape', 'end'].join('\n'));
            localInterpreter.Execute(['classdef StaticAreaShape < AbstractShape', '  methods (Static)', '    function y = area()', '      y = 99;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef (Sealed) FinalShape', 'end'].join('\n'));
            localInterpreter.Execute(['classdef (AllowedSubclasses = {?AllowedRuntimeShape}) RestrictedShape', 'end'].join('\n'));
            localInterpreter.Execute(['classdef AllowedRuntimeShape < RestrictedShape', 'end'].join('\n'));
            localInterpreter.Execute(['classdef (AllowedSubclasses = {}) EmptyAllowedRuntimeShape', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('AbstractShape()')).toThrow('cannot instantiate abstract class AbstractShape: missing implementations for area.');
            expect(() => localInterpreter.Execute('PendingShape()')).toThrow('cannot instantiate abstract class PendingShape: missing implementations for area.');
            expect(() => localInterpreter.Execute('StaticAreaShape()')).toThrow('cannot instantiate abstract class StaticAreaShape: missing implementations for area.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('CircleShape().area()'))).toBe('12\n');
            expect(() => localInterpreter.Execute(['classdef IllegalShape < FinalShape', 'end'].join('\n'))).toThrow('class IllegalShape cannot inherit from sealed class FinalShape.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('AllowedRuntimeShape()'))).toBe('AllowedRuntimeShape object\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc = metaclass(EmptyAllowedRuntimeShape); mc.Sealed; mc.RestrictsSubclassing'))).toBe(
                'mc=meta.class EmptyAllowedRuntimeShape\ntrue\ntrue\n',
            );
            expect(() => localInterpreter.Execute(['classdef IllegalEmptyAllowedShape < EmptyAllowedRuntimeShape', 'end'].join('\n'))).toThrow(
                'class IllegalEmptyAllowedShape cannot inherit from sealed class EmptyAllowedRuntimeShape.',
            );
            expect(() => localInterpreter.Execute(['classdef IllegalRuntimeShape < RestrictedShape', 'end'].join('\n'))).toThrow(
                'class IllegalRuntimeShape cannot inherit from class RestrictedShape: subclass is not listed in AllowedSubclasses.',
            );
        });

        it('Should enforce handle-compatible class hierarchies.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef (HandleCompatible) RuntimeHandleUtility', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimePlainValueBase', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeHandleCompatibleChild < handle & RuntimeHandleUtility', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RuntimeValueCompatibleChild < RuntimeHandleUtility', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeHandleUtility).HandleCompatible'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeHandleCompatibleChild).HandleCompatible; isa(RuntimeHandleCompatibleChild(), "handle")'))).toBe(
                'true\ntrue\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeValueCompatibleChild).HandleCompatible; isa(RuntimeValueCompatibleChild(), "handle")'))).toBe(
                'false\nfalse\n',
            );
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeHandleCompatibleChild < handle & RuntimePlainValueBase', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeHandleCompatibleChild cannot combine handle semantics with non-handle-compatible superclass RuntimePlainValueBase.',
            );
            expect(() => localInterpreter.Execute(['classdef (HandleCompatible) InvalidRuntimeHandleUtility < RuntimePlainValueBase', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeHandleUtility cannot combine handle semantics with non-handle-compatible superclass RuntimePlainValueBase.',
            );
            expect(() => localInterpreter.Execute(['classdef (HandleCompatible = false) InvalidRuntimeFalseHandleCompatible < handle', 'end'].join('\n'))).toThrow(
                'class InvalidRuntimeFalseHandleCompatible cannot set HandleCompatible to false while inheriting from a handle class.',
            );
        });

        it('Should enforce abstract class properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef AbstractPropertyShape', '  properties (Abstract)', '    Sides', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef PendingPropertyShape < AbstractPropertyShape', 'end'].join('\n'));
            localInterpreter.Execute(['classdef ConcretePropertyShape < AbstractPropertyShape', '  properties', '    Sides = 4;', '  end', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('AbstractPropertyShape()')).toThrow('cannot instantiate abstract class AbstractPropertyShape: missing implementations for Sides.');
            expect(() => localInterpreter.Execute('PendingPropertyShape()')).toThrow('cannot instantiate abstract class PendingPropertyShape: missing implementations for Sides.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ConcretePropertyShape().Sides'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(AbstractPropertyShape).PropertyList(1).Abstract'))).toBe('true\n');
            expect(() => localInterpreter.Execute(['classdef InvalidRuntimeAbstractPropertyDefault', '  properties (Abstract)', '    Value = 1;', '  end', 'end'].join('\n'))).toThrow(
                "abstract property 'Value' in class InvalidRuntimeAbstractPropertyDefault cannot define a default value.",
            );
        });

        it('Should reject overrides of sealed class methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef SealedMethodBase',
                    '  methods (Sealed)',
                    '    function y = value(obj)',
                    '      y = 1;',
                    '    end',
                    '  end',
                    '  methods (Static, Sealed)',
                    '    function y = make()',
                    '      y = 2;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(() =>
                localInterpreter.Execute(
                    ['classdef IllegalInstanceOverride < SealedMethodBase', '  methods', '    function y = value(obj)', '      y = 3;', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow("method 'value' in class IllegalInstanceOverride cannot override sealed method from class SealedMethodBase.");
            expect(() =>
                localInterpreter.Execute(
                    ['classdef IllegalStaticOverride < SealedMethodBase', '  methods (Static)', '    function y = make()', '      y = 4;', '    end', '  end', 'end'].join('\n'),
                ),
            ).toThrow("method 'make' in class IllegalStaticOverride cannot override sealed method from class SealedMethodBase.");
            localInterpreter.Execute(['classdef LeftNonsealedRuntimeBase', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef RightSealedRuntimeBase', '  methods (Sealed)', '    function y = value(obj)', '      y = 2;', '    end', '  end', 'end'].join('\n'));
            expect(() =>
                localInterpreter.Execute(
                    [
                        'classdef IllegalLaterSealedRuntimeOverride < LeftNonsealedRuntimeBase & RightSealedRuntimeBase',
                        '  methods',
                        '    function y = value(obj)',
                        '      y = 3;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("method 'value' in class IllegalLaterSealedRuntimeOverride cannot override sealed method from class RightSealedRuntimeBase.");
            localInterpreter.Execute(['classdef SealedMethodChild < SealedMethodBase', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('SealedMethodChild().value()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('SealedMethodChild.make()'))).toBe('2\n');
        });

        it('Should support constant class properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ConstantsBase',
                    '  properties (Constant)',
                    '    Answer = 42;',
                    '  end',
                    '  properties (Constant, Access = private)',
                    '    Secret = 7;',
                    '  end',
                    '  methods (Static)',
                    '    function y = reveal()',
                    '      y = ConstantsBase.Secret;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef ConstantsChild < ConstantsBase', 'end'].join('\n'));
            localInterpreter.Execute('c = ConstantsChild()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('ConstantsBase.Answer'))).toBe('42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ConstantsChild.Answer'))).toBe('42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Answer'))).toBe('42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ConstantsBase.reveal()'))).toBe('7\n');
            expect(() => localInterpreter.Execute('ConstantsBase.Secret')).toThrow("property 'Secret' has private get access for class ConstantsBase.");
            expect(() => localInterpreter.Execute('c.Answer = 10')).toThrow("cannot assign to constant property 'Answer' for class ConstantsChild.");
        });

        it('Should enforce independent GetAccess and SetAccess property attributes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef AccessControlledValue < handle',
                    '  properties (GetAccess = private, SetAccess = public)',
                    '    HiddenValue = 1;',
                    '  end',
                    '  properties (GetAccess = public, SetAccess = private)',
                    '    LockedValue = 2;',
                    '  end',
                    '  methods',
                    '    function y = readHidden(obj)',
                    '      y = obj.HiddenValue;',
                    '    end',
                    '    function y = writeLocked(obj, value)',
                    '      obj.LockedValue = value;',
                    '      y = obj.LockedValue;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = AccessControlledValue()');

            expect(() => localInterpreter.Execute('a.HiddenValue')).toThrow("property 'HiddenValue' has private get access for class AccessControlledValue.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.readHidden()'))).toBe('1\n');

            localInterpreter.Execute('a.HiddenValue = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.readHidden()'))).toBe('10\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a.LockedValue'))).toBe('2\n');
            expect(() => localInterpreter.Execute('a.LockedValue = 20')).toThrow("property 'LockedValue' has private set access for class AccessControlledValue.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.writeLocked(30)'))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.LockedValue'))).toBe('30\n');
        });

        it('Should allow class-qualified GetAccess and SetAccess from friend classes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef FriendPropertyTarget < handle', '  properties (GetAccess = ?FriendPropertyAccessor, SetAccess = ?FriendPropertyAccessor)', '    Value = 8;', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute(
                [
                    'classdef FriendPropertyAccessor',
                    '  methods',
                    '    function y = read(obj, target)',
                    '      y = target.Value;',
                    '    end',
                    '    function y = write(obj, target, value)',
                    '      target.Value = value;',
                    '      y = target.Value;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('target = FriendPropertyTarget()');
            localInterpreter.Execute('friend = FriendPropertyAccessor()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('friend.read(target)'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('friend.write(target, 21)'))).toBe('21\n');
            expect(() => localInterpreter.Execute('target.Value')).toThrow("property 'Value' has ?FriendPropertyAccessor get access for class FriendPropertyTarget.");
            expect(() => localInterpreter.Execute('target.Value = 34')).toThrow("property 'Value' has ?FriendPropertyAccessor set access for class FriendPropertyTarget.");
        });

        it('Should notify class event and observable property listeners.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global eventCount alternateCount recursiveCount lastEvent lastEventClass lastPropertyName lastAffectedClass savedEventData');
            localInterpreter.Execute('eventCount = 0; alternateCount = 0; recursiveCount = 0');
            localInterpreter.Execute(
                [
                    'function recordEvent(src, eventData)',
                    '  global eventCount lastEvent lastEventClass savedEventData',
                    '  eventCount = eventCount + 1;',
                    '  lastEvent = eventData.EventName;',
                    '  lastEventClass = class(eventData);',
                    '  savedEventData = eventData;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordAlternateEvent(src, eventData)',
                    '  global alternateCount lastEvent',
                    '  alternateCount = alternateCount + 1;',
                    '  lastEvent = eventData.EventName;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordRecursiveEvent(src, eventData)',
                    '  global recursiveCount',
                    '  recursiveCount = recursiveCount + 1;',
                    '  if recursiveCount < 3',
                    '    notify(src, eventData.EventName);',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordPropertyEvent(src, eventData)',
                    '  global eventCount lastEvent lastEventClass lastPropertyName lastAffectedClass',
                    '  eventCount = eventCount + 1;',
                    '  lastEvent = eventData.EventName;',
                    '  lastEventClass = class(eventData);',
                    '  lastPropertyName = eventData.PropertyName;',
                    '  lastAffectedClass = class(eventData.AffectedObject);',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef EventSource < handle',
                    '  events',
                    '    Changed',
                    '    Forwarded',
                    '  end',
                    '  properties (GetObservable, SetObservable)',
                    '    Value = 0;',
                    '  end',
                    '  methods',
                    '    function fire(obj)',
                    '      notify(obj, "Changed");',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef NoChangedEventSource < handle', 'end'].join('\n'));
            localInterpreter.Execute('s = EventSource()');
            localInterpreter.Execute('other = EventSource()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('listener = addlistener(s, "Changed", @recordEvent)'))).toBe('listener=event.listener EventSource.Changed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(listener)'))).toBe('event.listener\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(listener)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('listener.Enabled'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('listener.EventName; listener.Callback; listener.Recursive; listener.Source.Value'))).toBe(
                'Changed\n@recordEvent\nfalse\n0\n',
            );
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEvent'))).toBe('Changed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEventClass'))).toBe('event.EventData\n');

            localInterpreter.Execute('listener.Enabled = false');
            expect(localInterpreter.Unparse(localInterpreter.Execute('listener.Enabled'))).toBe('false\n');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('1\n');
            localInterpreter.Execute('listener.Enabled = true');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('2\n');
            expect(() => localInterpreter.Execute('listener.Enabled.Value = true')).toThrow("cannot assign nested property 'Enabled.Value' for event.listener.");
            localInterpreter.Execute('listener.Callback = @recordAlternateEvent; listener.EventName = "Forwarded"');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount; alternateCount'))).toBe('2\n0\n');
            localInterpreter.Execute('notify(s, "Forwarded")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount; alternateCount; lastEvent; listener.EventName; listener.Callback'))).toBe(
                '2\n1\nForwarded\nForwarded\n@recordAlternateEvent\n',
            );
            expect(() => localInterpreter.Execute('listener.EventName = "Missing"')).toThrow("unknown event 'Missing' for class EventSource.");
            expect(() => localInterpreter.Execute('listener.EventName = "Value"')).toThrow('event listener EventName must name a class event.');
            expect(() => localInterpreter.Execute('listener.Callback = 1')).toThrow('event listener Callback must be a function handle.');
            localInterpreter.Execute('movedListener = addlistener(s, "Changed", @recordEvent)');
            localInterpreter.Execute('movedListener.Source = other; notify(s, "Changed"); notify(other, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount; class(movedListener.Source)'))).toBe('3\nEventSource\n');
            expect(() => localInterpreter.Execute('movedListener.Source = 1')).toThrow('event listener Source must be a class instance.');
            expect(() => localInterpreter.Execute('movedListener.Source = NoChangedEventSource()')).toThrow("unknown event 'Changed' for class NoChangedEventSource.");
            localInterpreter.Execute('delete(movedListener)');
            localInterpreter.Execute('recursiveListener = addlistener(s, "Changed", @recordRecursiveEvent)');
            localInterpreter.Execute('recursiveCount = 0; notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('recursiveCount'))).toBe('1\n');
            localInterpreter.Execute('recursiveListener.Recursive = true; recursiveCount = 0; notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('recursiveCount; recursiveListener.Recursive'))).toBe('3\ntrue\n');
            localInterpreter.Execute('delete(recursiveListener)');
            localInterpreter.Execute('forwardedListener = addlistener(s, "Forwarded", @recordEvent)');
            localInterpreter.Execute('notify(s, "Forwarded", savedEventData)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount; lastEvent; class(savedEventData); savedEventData.EventName'))).toBe(
                '4\nForwarded\nevent.EventData\nForwarded\n',
            );
            expect(() => localInterpreter.Execute('notify(s, "Forwarded", 1)')).toThrow('notify: event data must be an event.EventData object.');
            localInterpreter.Execute('delete(listener)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(listener)'))).toBe('false\n');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('4\n');
            expect(() => localInterpreter.Execute('listener.Enabled')).toThrow('invalid or deleted event listener.');

            localInterpreter.Execute('propertyListener = addlistener(s, "Value", @recordPropertyEvent)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(propertyListener)'))).toBe('event.proplistener\n');
            localInterpreter.Execute('propertyListener.Source = other; s.Value; other.Value');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount; class(propertyListener.Source); lastAffectedClass'))).toBe('5\nEventSource\nEventSource\n');
            localInterpreter.Execute('propertyListener.Source = s');
            localInterpreter.Execute('s.Value');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEvent'))).toBe('Value\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEventClass'))).toBe('event.PropertyEvent\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastPropertyName'))).toBe('Value\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastAffectedClass'))).toBe('EventSource\n');

            localInterpreter.Execute('s.Value = 5');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('7\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEvent'))).toBe('Value\n');
            expect(() => localInterpreter.Execute('addlistener(s, "Missing", @recordEvent)')).toThrow("unknown event 'Missing' for class EventSource.");
        });

        it('Should support named observable property listener phases.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global preGetCount postGetCount preSetCount postSetCount lastPhase lastPhaseProperty lastMetaClass lastMetaName lastSourceName lastPropertyEventData');
            localInterpreter.Execute('preGetCount = 0; postGetCount = 0; preSetCount = 0; postSetCount = 0');
            localInterpreter.Execute(
                [
                    'function recordPreGet(metaProperty, eventData)',
                    '  global preGetCount lastPhase lastPhaseProperty lastMetaClass lastMetaName lastSourceName',
                    '  preGetCount = preGetCount + 1;',
                    '  lastPhase = eventData.EventName;',
                    '  lastPhaseProperty = eventData.PropertyName;',
                    '  lastMetaClass = class(metaProperty);',
                    '  lastMetaName = metaProperty.Name;',
                    '  lastSourceName = eventData.Source.Name;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordPostGet(metaProperty, eventData)',
                    '  global postGetCount lastPhase lastPhaseProperty lastMetaClass lastMetaName lastSourceName',
                    '  postGetCount = postGetCount + 1;',
                    '  lastPhase = eventData.EventName;',
                    '  lastPhaseProperty = eventData.PropertyName;',
                    '  lastMetaClass = class(metaProperty);',
                    '  lastMetaName = metaProperty.Name;',
                    '  lastSourceName = eventData.Source.Name;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordPreSet(metaProperty, eventData)',
                    '  global preSetCount lastPhase lastPhaseProperty lastMetaClass lastMetaName lastSourceName',
                    '  preSetCount = preSetCount + 1;',
                    '  lastPhase = eventData.EventName;',
                    '  lastPhaseProperty = eventData.PropertyName;',
                    '  lastMetaClass = class(metaProperty);',
                    '  lastMetaName = metaProperty.Name;',
                    '  lastSourceName = eventData.Source.Name;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordPostSet(metaProperty, eventData)',
                    '  global postSetCount lastPhase lastPhaseProperty lastMetaClass lastMetaName lastSourceName lastPropertyEventData',
                    '  postSetCount = postSetCount + 1;',
                    '  lastPhase = eventData.EventName;',
                    '  lastPhaseProperty = eventData.PropertyName;',
                    '  lastMetaClass = class(metaProperty);',
                    '  lastMetaName = metaProperty.Name;',
                    '  lastSourceName = eventData.Source.Name;',
                    '  lastPropertyEventData = eventData;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef PropertyPhaseSource < handle',
                    '  properties (GetObservable, SetObservable)',
                    '    Value = 1;',
                    '  end',
                    '  properties (GetObservable)',
                    '    ReadOnlyEvent = 2;',
                    '  end',
                    '  properties (SetObservable)',
                    '    WriteOnlyEvent = 3;',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef OtherPropertyPhaseSource < handle', '  properties (SetObservable)', '    Value = 9;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('s = PropertyPhaseSource()');
            localInterpreter.Execute('preGet = addlistener(s, "Value", "PreGet", @recordPreGet)');
            localInterpreter.Execute('postGet = addlistener(s, "Value", "PostGet", @recordPostGet)');
            localInterpreter.Execute('preSet = addlistener(s, "Value", "PreSet", @recordPreSet)');
            localInterpreter.Execute('postSet = addlistener(s, "Value", "PostSet", @recordPostSet)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('preGet.EventName; postSet.EventName'))).toBe('PreGet\nPostSet\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(preGet); isa(preGet, "event.proplistener"); isa(preGet, "event.listener")'))).toBe(
                'event.proplistener\ntrue\ntrue\n',
            );
            expect(() => localInterpreter.Execute('preGet.EventName.Value = "x"')).toThrow("cannot assign nested property 'EventName.Value' for event.proplistener.");
            expect(() => localInterpreter.Execute('preGet.EventName = "AroundGet"')).toThrow("unknown property event 'AroundGet' for class PropertyPhaseSource.");
            expect(() => localInterpreter.Execute('preGet.Missing')).toThrow("unknown property 'Missing' for event.proplistener.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('s.Value'))).toBe('1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('preGetCount; postGetCount; preSetCount; postSetCount; lastPhase; lastPhaseProperty; lastMetaClass; lastMetaName; lastSourceName'),
                ),
            ).toBe('1\n1\n0\n0\nPostGet\nValue\nmeta.property\nValue\nValue\n');
            localInterpreter.Execute('s.Value = 5');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('preGetCount; postGetCount; preSetCount; postSetCount; lastPhase; lastPhaseProperty; lastMetaClass; lastMetaName; lastSourceName'),
                ),
            ).toBe('1\n1\n1\n1\nPostSet\nValue\nmeta.property\nValue\nValue\n');
            localInterpreter.Execute('propertyMeta = meta.class.fromName("PropertyPhaseSource").PropertyList(1)');
            localInterpreter.Execute('metaPostSet = addlistener(s, propertyMeta, "PostSet", @recordPostSet)');
            localInterpreter.Execute('s.Value = 6');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(metaPostSet); metaPostSet.EventName; preSetCount; postSetCount; lastMetaName; lastSourceName'))).toBe(
                'event.proplistener\nPostSet\n2\n3\nValue\nValue\n',
            );
            expect(() => localInterpreter.Execute('lastPropertyEventData.PropertyName = "Other"')).toThrow("cannot assign to read-only property 'PropertyName' for event.PropertyEvent.");
            expect(() => localInterpreter.Execute('lastPropertyEventData.Source.Name = "Other"')).toThrow("cannot assign nested property 'Source.Name' for event.PropertyEvent.");
            localInterpreter.Execute('otherPropertyMeta = meta.class.fromName("OtherPropertyPhaseSource").PropertyList(1)');
            expect(() => localInterpreter.Execute('addlistener(s, otherPropertyMeta, "PostSet", @recordPostSet)')).toThrow(
                "property 'Value' is not a property of class PropertyPhaseSource.",
            );
            expect(() => localInterpreter.Execute('addlistener(s, "ReadOnlyEvent", "PreSet", @recordPreSet)')).toThrow(
                "property 'ReadOnlyEvent' is not SetObservable for class PropertyPhaseSource.",
            );
            expect(() => localInterpreter.Execute('addlistener(s, "WriteOnlyEvent", "PostGet", @recordPostGet)')).toThrow(
                "property 'WriteOnlyEvent' is not GetObservable for class PropertyPhaseSource.",
            );
            expect(() => localInterpreter.Execute('addlistener(s, "Value", "AroundSet", @recordPostSet)')).toThrow("unknown property event 'AroundSet' for class PropertyPhaseSource.");
        });

        it('Should create explicit event and property listeners with listener.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global explicitEventCount explicitPropertyCount explicitLastSource explicitLastEvent');
            localInterpreter.Execute('explicitEventCount = 0; explicitPropertyCount = 0');
            localInterpreter.Execute(
                [
                    'function recordExplicitEvent(src, eventData)',
                    '  global explicitEventCount explicitLastSource explicitLastEvent',
                    '  explicitEventCount = explicitEventCount + 1;',
                    '  explicitLastSource = class(src);',
                    '  explicitLastEvent = eventData.EventName;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordExplicitProperty(metaProperty, eventData)',
                    '  global explicitPropertyCount explicitLastSource explicitLastEvent',
                    '  explicitPropertyCount = explicitPropertyCount + 1;',
                    '  explicitLastSource = metaProperty.Name;',
                    '  explicitLastEvent = eventData.EventName;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                ['classdef ExplicitListenerSource < handle', '  events', '    Changed', '  end', '  properties (SetObservable)', '    Value = 1;', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('s = ExplicitListenerSource()');
            localInterpreter.Execute('eventListener = listener(s, "Changed", @recordExplicitEvent)');
            localInterpreter.Execute('propertyListener = listener(s, "Value", "PostSet", @recordExplicitProperty)');
            localInterpreter.Execute('propertyMeta = meta.class.fromName("ExplicitListenerSource").PropertyList(1)');
            localInterpreter.Execute('metaPropertyListener = listener(s, propertyMeta, "PostSet", @recordExplicitProperty)');
            localInterpreter.Execute('qualifiedEventListener = event.listener(s, "Changed", @recordExplicitEvent)');
            localInterpreter.Execute('qualifiedPropertyListener = event.proplistener(s, propertyMeta, "PostSet", @recordExplicitProperty)');
            localInterpreter.Execute('dottedEventListener = s.addlistener("Changed", @recordExplicitEvent)');
            localInterpreter.Execute('dottedPropertyListener = s.addlistener("Value", "PostSet", @recordExplicitProperty)');
            localInterpreter.Execute('dottedMetaPropertyListener = s.addlistener(propertyMeta, "PostSet", @recordExplicitProperty)');

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'class(eventListener); class(propertyListener); class(metaPropertyListener); class(qualifiedEventListener); class(qualifiedPropertyListener); class(dottedEventListener); class(dottedPropertyListener); class(dottedMetaPropertyListener)',
                    ),
                ),
            ).toBe('event.listener\nevent.proplistener\nevent.proplistener\nevent.listener\nevent.proplistener\nevent.listener\nevent.proplistener\nevent.proplistener\n');
            localInterpreter.Execute('s.notify("Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('explicitEventCount; explicitLastSource; explicitLastEvent'))).toBe('3\nExplicitListenerSource\nChanged\n');
            localInterpreter.Execute('s.Value = 2');
            expect(localInterpreter.Unparse(localInterpreter.Execute('explicitPropertyCount; explicitLastSource; explicitLastEvent'))).toBe('5\nValue\nPostSet\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('dottedEventListener.isvalid(); dottedPropertyListener.isvalid(); dottedMetaPropertyListener.isvalid()'))).toBe(
                'true\ntrue\ntrue\n',
            );
            localInterpreter.Execute('dottedEventListener.delete(); s.notify("Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('explicitEventCount; dottedEventListener.isvalid()'))).toBe('5\nfalse\n');
            localInterpreter.Execute('delete(propertyListener)');
            localInterpreter.Execute('s.Value = 3');
            expect(localInterpreter.Unparse(localInterpreter.Execute('explicitPropertyCount'))).toBe('9\n');
            expect(() => localInterpreter.Execute('listener(1, "Changed", @recordExplicitEvent)')).toThrow('listener: source must be a class instance.');
            expect(() => localInterpreter.Execute('event.listener(s, "Value", @recordExplicitEvent)')).toThrow('event.listener: event name must name a class event.');
            expect(() => localInterpreter.Execute('event.proplistener(s, propertyMeta, @recordExplicitProperty)')).toThrow('Invalid call to event.proplistener.');
        });

        it('Should create listener arrays for source object arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global sourceArrayEventTotal sourceArrayPropertyTotal');
            localInterpreter.Execute('sourceArrayEventTotal = 0; sourceArrayPropertyTotal = 0');
            localInterpreter.Execute(
                ['function recordSourceArrayEvent(src, eventData)', '  global sourceArrayEventTotal', '  sourceArrayEventTotal = sourceArrayEventTotal + src.Value;', 'end'].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordSourceArrayProperty(metaProperty, eventData)',
                    '  global sourceArrayPropertyTotal',
                    '  sourceArrayPropertyTotal = sourceArrayPropertyTotal + eventData.AffectedObject.Value;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef SourceArrayListenerSource < handle',
                    '  events',
                    '    Changed',
                    '  end',
                    '  properties (SetObservable)',
                    '    Value = 0;',
                    '  end',
                    '  methods',
                    '    function obj = SourceArrayListenerSource(value = 0)',
                    '      obj.Value = value;',
                    '    end',
                    '    function fire(obj)',
                    '      notify(obj, "Changed");',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('sources = [SourceArrayListenerSource(1), SourceArrayListenerSource(2)]');
            localInterpreter.Execute('eventListeners = addlistener(sources, "Changed", @recordSourceArrayEvent)');
            localInterpreter.Execute('qualifiedEventListeners = event.listener(sources, "Changed", @recordSourceArrayEvent)');
            localInterpreter.Execute('sources(1).fire(); sources(2).fire()');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'class(eventListeners(1)); class(eventListeners(2)); class(qualifiedEventListeners(1)); class(qualifiedEventListeners(2)); sourceArrayEventTotal',
                    ),
                ),
            ).toBe('event.listener\nevent.listener\nevent.listener\nevent.listener\n6\n');
            localInterpreter.Execute('delete(eventListeners(1)); delete(qualifiedEventListeners(1)); sources(1).fire(); sources(2).fire()');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sourceArrayEventTotal; isvalid(eventListeners); isvalid(qualifiedEventListeners)'))).toBe(
                '10\n[false,true]\n[false,true]\n',
            );
            localInterpreter.Execute('notify(sources, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sourceArrayEventTotal'))).toBe('14\n');
            localInterpreter.Execute('delete(eventListeners); delete(qualifiedEventListeners); notify(sources, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sourceArrayEventTotal; isvalid(eventListeners); isvalid(qualifiedEventListeners)'))).toBe(
                '14\n[false,false]\n[false,false]\n',
            );
            localInterpreter.Execute('dottedListeners = addlistener(sources, "Changed", @recordSourceArrayEvent)');
            localInterpreter.Execute('dottedListeners.delete(); notify(sources, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sourceArrayEventTotal; isvalid(dottedListeners)'))).toBe('14\n[false,false]\n');
            localInterpreter.Execute('inheritedListeners = sources.addlistener("Changed", @recordSourceArrayEvent)');
            localInterpreter.Execute('sources.notify("Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sourceArrayEventTotal; inheritedListeners.isvalid()'))).toBe('17\n[true,true]\n');
            localInterpreter.Execute('inheritedListeners.delete()');

            localInterpreter.Execute('propertyListeners = listener(sources, "Value", "PostSet", @recordSourceArrayProperty)');
            localInterpreter.Execute('qualifiedPropertyListeners = event.proplistener(sources, "Value", "PostSet", @recordSourceArrayProperty)');
            localInterpreter.Execute('sources(1).Value = 10; sources(2).Value = 20');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'class(propertyListeners(1)); class(propertyListeners(2)); class(qualifiedPropertyListeners(1)); class(qualifiedPropertyListeners(2)); sourceArrayPropertyTotal',
                    ),
                ),
            ).toBe('event.proplistener\nevent.proplistener\nevent.proplistener\nevent.proplistener\n60\n');
            localInterpreter.Execute('delete(propertyListeners); delete(qualifiedPropertyListeners); sources(1).Value = 30; sources(2).Value = 40');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sourceArrayPropertyTotal; isvalid(propertyListeners); isvalid(qualifiedPropertyListeners)'))).toBe(
                '60\n[false,false]\n[false,false]\n',
            );
            expect(() => localInterpreter.Execute('addlistener({SourceArrayListenerSource(), 1}, "Changed", @recordSourceArrayEvent)')).toThrow(
                'addlistener: source array must contain class instances.',
            );
            expect(() => localInterpreter.Execute('event.listener({SourceArrayListenerSource(), 1}, "Changed", @recordSourceArrayEvent)')).toThrow(
                'event.listener: source array must contain class instances.',
            );
            expect(() => localInterpreter.Execute('notify({SourceArrayListenerSource(), 1}, "Changed")')).toThrow('notify: source array must contain class instances.');
        });

        it('Should create property listener arrays for property name lists.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global propertyListTotal');
            localInterpreter.Execute('propertyListTotal = 0');
            localInterpreter.Execute(
                [
                    'function recordPropertyList(metaProperty, eventData)',
                    '  global propertyListTotal',
                    '  propertyListTotal = propertyListTotal + eventData.AffectedObject.First + eventData.AffectedObject.Second;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef PropertyListListenerSource < handle', '  properties (SetObservable)', '    First = 1;', '    Second = 2;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('s = PropertyListListenerSource()');
            localInterpreter.Execute('cellListeners = addlistener(s, {"First", "Second"}, "PostSet", @recordPropertyList)');
            localInterpreter.Execute('metaProps = meta.class.fromName("PropertyListListenerSource").PropertyList');
            localInterpreter.Execute('metaListeners = event.proplistener(s, metaProps, "PostSet", @recordPropertyList)');
            localInterpreter.Execute('s.First = 3; s.Second = 4');

            expect(
                localInterpreter.Unparse(localInterpreter.Execute('class(cellListeners(1)); class(cellListeners(2)); class(metaListeners(1)); class(metaListeners(2)); propertyListTotal')),
            ).toBe('event.proplistener\nevent.proplistener\nevent.proplistener\nevent.proplistener\n24\n');
            expect(() => localInterpreter.Execute('addlistener(s, {"First", 2}, "PostSet", @recordPropertyList)')).toThrow('addlistener: property name must be a string or meta.property.');
            expect(() => localInterpreter.Execute('addlistener([s, s], {"First", "Second"}, "PostSet", @recordPropertyList)')).toThrow(
                'addlistener: property name must be a string or meta.property.',
            );
        });

        it('Should pass custom event.EventData subclasses through notify.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global customEventClass customEventIsData customEventIsHandle customEventName customEventSource customEventPayload baseEventName baseEventSource');
            localInterpreter.Execute(
                [
                    'function recordCustomEvent(src, eventData)',
                    '  global customEventClass customEventIsData customEventIsHandle customEventName customEventSource customEventPayload',
                    '  customEventClass = class(eventData);',
                    '  customEventIsData = isa(eventData, "event.EventData");',
                    '  customEventIsHandle = isa(eventData, "handle");',
                    '  customEventName = eventData.EventName;',
                    '  customEventSource = class(eventData.Source);',
                    '  customEventPayload = eventData.Payload;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordBaseEvent(src, eventData)',
                    '  global baseEventName baseEventSource',
                    '  baseEventName = eventData.EventName;',
                    '  baseEventSource = class(eventData.Source);',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef CustomEventSource < handle',
                    '  events',
                    '    Changed',
                    '  end',
                    '  methods',
                    '    function fire(obj, data)',
                    '      notify(obj, "Changed", data);',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef CustomNotifySource < handle', '  methods', '    function y = notify(obj)', '      y = 99;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'classdef (ConstructOnLoad) CustomEventPayload < event.EventData',
                    '  properties',
                    '    Payload = 0;',
                    '  end',
                    '  methods',
                    '    function obj = CustomEventPayload(value = 0)',
                    '      obj.Payload = value;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('s = CustomEventSource(); data = CustomEventPayload(42); customListener = addlistener(s, "Changed", @recordCustomEvent); s.fire(data)');

            expect(
                localInterpreter.Unparse(localInterpreter.Execute('customEventClass; customEventIsData; customEventIsHandle; customEventName; customEventSource; customEventPayload')),
            ).toBe('CustomEventPayload\ntrue\ntrue\nChanged\nCustomEventSource\n42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('data.EventName; class(data.Source)'))).toBe('Changed\nCustomEventSource\n');
            expect(() => localInterpreter.Execute('CustomEventPayload(1).EventName')).toThrow('event data EventName is not assigned until notify dispatch.');
            expect(() => localInterpreter.Execute('data.Source = s')).toThrow("cannot assign to read-only property 'Source' for class CustomEventPayload.");
            localInterpreter.Execute('delete(customListener); addlistener(s, "Changed", @recordBaseEvent); baseData = event.EventData(); notify(s, "Changed", baseData)');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('class(baseData); isa(baseData, "event.EventData"); baseData.EventName; class(baseData.Source); baseEventName; baseEventSource'),
                ),
            ).toBe('event.EventData\ntrue\nChanged\nCustomEventSource\nChanged\nCustomEventSource\n');
            expect(() => localInterpreter.Execute('event.EventData().EventName')).toThrow('event data EventName is not assigned until notify dispatch.');
            expect(() => localInterpreter.Execute('baseData.EventName = "Other"')).toThrow("cannot assign to read-only property 'EventName' for event.EventData.");
            expect(() => localInterpreter.Execute('baseData.Source.Value = 1')).toThrow("cannot assign nested property 'Source.Value' for event.EventData.");
            localInterpreter.Execute('dotData = CustomEventPayload(7); s.notify("Changed", dotData)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('dotData.EventName; class(dotData.Source); baseEventName; baseEventSource'))).toBe(
                'Changed\nCustomEventSource\nChanged\nCustomEventSource\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('CustomNotifySource().notify()'))).toBe('99\n');
            expect(() => localInterpreter.Execute('classdef InvalidCustomEventPayload < event.EventData; end')).toThrow(
                'class InvalidCustomEventPayload must set ConstructOnLoad because it subclasses event.EventData.',
            );
            expect(() => localInterpreter.Execute('classdef (ConstructOnLoad) InvalidCustomEventSourceProperty < event.EventData; properties; Source; end; end')).toThrow(
                "class InvalidCustomEventSourceProperty cannot redefine inherited event.EventData property 'Source'.",
            );
            expect(() => localInterpreter.Execute('classdef InvalidPropertyEventChild < event.PropertyEvent; end')).toThrow(
                'class InvalidPropertyEventChild cannot inherit from sealed class event.PropertyEvent.',
            );
        });

        it('Should abort identical property assignments with AbortSet.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global abortSetCount');
            localInterpreter.Execute('abortSetCount = 0');
            localInterpreter.Execute(['function recordAbortSetEvent(src, eventData)', '  global abortSetCount', '  abortSetCount = abortSetCount + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['classdef AbortSetSource < handle', '  properties (AbortSet, SetObservable)', '    Value = 1;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('s = AbortSetSource(); addlistener(s, "Value", @recordAbortSetEvent)');

            localInterpreter.Execute('s.Value = 1');
            expect(localInterpreter.Unparse(localInterpreter.Execute('abortSetCount'))).toBe('0\n');
            localInterpreter.Execute('s.Value = 2');
            expect(localInterpreter.Unparse(localInterpreter.Execute('abortSetCount'))).toBe('1\n');
            localInterpreter.Execute('s.Value = 2');
            expect(localInterpreter.Unparse(localInterpreter.Execute('abortSetCount'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s.Value'))).toBe('2\n');
        });

        it('Should allow class-qualified ListenAccess and NotifyAccess from friend classes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global friendEventCount');
            localInterpreter.Execute('friendEventCount = 0');
            localInterpreter.Execute(['function recordFriendEvent(src, eventData)', '  global friendEventCount', '  friendEventCount = friendEventCount + 1;', 'end'].join('\n'));
            localInterpreter.Execute(
                ['classdef FriendEventSource < handle', '  events (ListenAccess = ?FriendEventAccessor, NotifyAccess = ?FriendEventAccessor)', '    HiddenChanged', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute(
                [
                    'classdef FriendEventAccessor',
                    '  methods',
                    '    function listener = attach(obj, source)',
                    '      listener = addlistener(source, "HiddenChanged", @recordFriendEvent);',
                    '    end',
                    '    function fire(obj, source)',
                    '      notify(source, "HiddenChanged");',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('source = FriendEventSource()');
            localInterpreter.Execute('friend = FriendEventAccessor()');
            localInterpreter.Execute('listener = friend.attach(source)');
            localInterpreter.Execute('friend.fire(source)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('friendEventCount'))).toBe('1\n');
            expect(() => localInterpreter.Execute('addlistener(source, "HiddenChanged", @recordFriendEvent)')).toThrow(
                "event 'HiddenChanged' has ?FriendEventAccessor listen access for class FriendEventSource.",
            );
            expect(() => localInterpreter.Execute('notify(source, "HiddenChanged")')).toThrow("event 'HiddenChanged' has ?FriendEventAccessor notify access for class FriendEventSource.");
            localInterpreter.Execute('delete(listener)');
        });

        it('Should read dependent properties through get accessors.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef DependentCircle',
                    '  properties',
                    '    Radius = 3;',
                    '  end',
                    '  properties (Dependent)',
                    '    Area',
                    '  end',
                    '  methods',
                    '    function y = get.Area(obj)',
                    '      y = obj.Radius * obj.Radius;',
                    '    end',
                    '    function obj = set.Area(obj, value)',
                    '      obj.Radius = value / 2;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef ReadOnlyDependentCircle',
                    '  properties (Dependent)',
                    '    Area',
                    '  end',
                    '  methods',
                    '    function y = get.Area(obj)',
                    '      y = 1;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = DependentCircle()');
            localInterpreter.Execute('r = ReadOnlyDependentCircle()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Area'))).toBe('9\n');
            localInterpreter.Execute('c.Area = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Radius'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Area'))).toBe('25\n');
            expect(() => localInterpreter.Execute('r.Area = 10')).toThrow("cannot assign to dependent property 'Area' for class ReadOnlyDependentCircle without a set accessor.");
        });

        it('Should read and write properties through explicit GetMethod and SetMethod attributes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ExplicitAccessorValue',
                    '  properties',
                    '    Storage = 3;',
                    '  end',
                    '  properties (GetMethod = readValue, SetMethod = writeValue, SetObservable)',
                    '    Value',
                    '  end',
                    '  methods',
                    '    function y = readValue(obj)',
                    '      y = obj.Storage * 2;',
                    '    end',
                    '    function obj = writeValue(obj, value)',
                    '      obj.Storage = value + 1;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('obj = ExplicitAccessorValue()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj.Value'))).toBe('6\n');
            localInterpreter.Execute('obj.Value = 9');
            expect(localInterpreter.Unparse(localInterpreter.Execute('obj.Storage'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('obj.Value'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("ExplicitAccessorValue").PropertyList(2).GetMethod'))).toBe('readValue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("ExplicitAccessorValue").PropertyList(2).SetMethod'))).toBe('writeValue\n');
        });

        it('Should load external explicit GetMethod and SetMethod accessors.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@ExternalAccessorValue/ExternalAccessorValue.m': [
                        'classdef ExternalAccessorValue',
                        '  properties',
                        '    Storage = 4;',
                        '  end',
                        '  properties (GetMethod = readValue, SetMethod = writeValue)',
                        '    Value',
                        '  end',
                        '  methods',
                        '    y = readValue(obj)',
                        '    obj = writeValue(obj, value)',
                        '  end',
                        'end',
                    ].join('\n'),
                    '+pkg/@ExternalAccessorValue/readValue.m': ['function y = readValue(obj)', '  y = obj.Storage * 3;', 'end'].join('\n'),
                    '+pkg/@ExternalAccessorValue/writeValue.m': ['function obj = writeValue(obj, value)', '  obj.Storage = value + 2;', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = pkg.ExternalAccessorValue(); obj.Value; obj.Value = 8; obj.Storage; obj.Value'))).toBe(
                'obj=pkg.ExternalAccessorValue object with properties: Storage,Value\n12\nobj=pkg.ExternalAccessorValue object with properties: Storage,Value\n10\n30\n',
            );
        });

        it('Should resolve class enumeration values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ColorChoice', '  enumeration', '    Red', '    Blue(2)', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('ColorChoice.Red'))).toBe('ColorChoice.Red\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ColorChoice.Blue'))).toBe('ColorChoice.Blue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(ColorChoice.Red)'))).toBe('ColorChoice\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(ColorChoice.Red, 'ColorChoice')"))).toBe('true\n');
        });

        it('Should introspect class members.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef IntrospectionBase < handle',
                    '  properties',
                    '    baseValue = 1;',
                    '  end',
                    '  methods',
                    '    function y = baseMethod(obj)',
                    '      y = obj.baseValue;',
                    '    end',
                    '  end',
                    '  events',
                    '    BaseChanged',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef IntrospectionChild < IntrospectionBase',
                    '  properties',
                    '    childValue = 2;',
                    '  end',
                    '  properties (Hidden)',
                    '    hiddenValue = 3;',
                    '  end',
                    '  methods',
                    '    function y = childMethod(obj)',
                    '      y = obj.childValue;',
                    '    end',
                    '  end',
                    '  methods (Hidden)',
                    '    function y = hiddenMethod(obj)',
                    '      y = 0;',
                    '    end',
                    '  end',
                    '  events',
                    '    ChildChanged',
                    '  end',
                    '  events (Hidden)',
                    '    HiddenChanged',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef IntrospectionHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute(['classdef IntrospectionEnum', '  enumeration', '    Red', '    Blue', '  end', '  enumeration (Hidden)', '    HiddenRed', '  end', 'end'].join('\n'));
            localInterpreter.Execute('obj = IntrospectionChild()');

            localInterpreter.Execute('p = properties(obj)');
            localInterpreter.Execute('fp = fieldnames(obj)');
            localInterpreter.Execute('m = methods(obj)');
            localInterpreter.Execute('e = events(obj)');
            localInterpreter.Execute('n = enumeration(IntrospectionEnum.Red)');
            localInterpreter.Execute('s.z = 1; s.a = 2; fs = fieldnames(s)');
            localInterpreter.Execute('sa = [s, s]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p{1}; p{2}'))).toBe('baseValue\nchildValue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fp{1}; fp{2}'))).toBe('baseValue\nchildValue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fs{1}; fs{2}'))).toBe('a\nz\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fieldnames(sa); isfield(sa, "a"); isfield(sa, "missing"); isfield(sa, {"z", "missing", "a"})'))).toBe(
                '{a;\nz}\ntrue\nfalse\n[true,false,true]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('m{1}; m{2}'))).toBe('baseMethod\nchildMethod\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('e{1}; e{2}'))).toBe('BaseChanged\nChildChanged\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('n{1}; n{2}'))).toBe('Blue\nRed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('properties(IntrospectionChild)'))).toBe('{baseValue;\nchildValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fieldnames("IntrospectionChild")'))).toBe('{baseValue;\nchildValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('methods("IntrospectionChild")'))).toBe('{baseMethod;\nchildMethod}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("events('IntrospectionChild')"))).toBe('{BaseChanged;\nChildChanged}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('enumeration("IntrospectionEnum")'))).toBe('{Blue;\nRed}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("IntrospectionEnum").EnumerationMemberList(3).Hidden'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('superclasses("IntrospectionChild")'))).toBe('{IntrospectionBase}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('superclasses(IntrospectionHandle())'))).toBe('{handle}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop(obj, "baseValue")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop("IntrospectionChild", "childValue")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop("IntrospectionChild", "missingValue")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop([IntrospectionChild(), IntrospectionChild()], "baseValue")'))).toBe('[true,true]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop([IntrospectionChild(); IntrospectionChild()], "missingValue")'))).toBe('[false;\nfalse]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop(obj, 1); isprop([IntrospectionChild(), IntrospectionChild()], {"baseValue"})'))).toBe('false\nfalse\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod(obj, "baseMethod")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod("IntrospectionChild", "childMethod")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod("IntrospectionChild", "missingMethod")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isfield(s, "a"); isfield(s, "missing"); isfield(s, {"z", "missing", "a"})'))).toBe('true\nfalse\n[true,false,true]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isfield(obj, "baseValue"); isfield(obj, {"baseValue", "missingValue"})'))).toBe('false\n[false,false]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isfield(1, 1); isfield(obj, 1); isfield(obj, [1, 2])'))).toBe('false\nfalse\nfalse\n');
            expect(() => localInterpreter.Execute('isfield(s, 1)')).toThrow('isfield: FIELD must be a string or cell array of strings.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc = metaclass(obj); properties(mc)'))).toBe('mc=meta.class IntrospectionChild\n{baseValue;\nchildValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('methods(mc)'))).toBe('{baseMethod;\nchildMethod}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('events(mc)'))).toBe('{BaseChanged;\nChildChanged}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('properties([obj, obj])'))).toBe('{baseValue;\nchildValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop(mc, "baseValue")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod(mc, "childMethod")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(mc)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject({obj}); isprop({obj}, "baseValue")'))).toBe('false\nfalse\n');
            expect(() => localInterpreter.Execute('properties({obj})')).toThrow('properties: input must be a class object.');
            expect(() => localInterpreter.Execute('properties([obj, 1])')).toThrow('properties: input must be a class object.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(1 == 1)'))).toBe('logical\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class([true, false])'))).toBe('logical\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(1 == 1, 'logical')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa([true, false], 'logical')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(true, 'double')"))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(mc, 'meta.class')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("IntrospectionChild")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("double")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("handle")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("event.listener"); isclass("event.proplistener")'))).toBe('true\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("MissingIntrospectionClass")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("IntrospectionChild", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("handle", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("IntrospectionChild")'))).toBe('IntrospectionChild is a class\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("handle")'))).toBe('handle is a class\n');
            expect(() => localInterpreter.Execute('properties(1)')).toThrow('properties: input must be a class object.');
            expect(() => localInterpreter.Execute('properties("MissingIntrospectionClass")')).toThrow("properties: class 'MissingIntrospectionClass' is not defined.");
            expect(() => localInterpreter.Execute('isprop("MissingIntrospectionClass", "x")')).toThrow("isprop: class 'MissingIntrospectionClass' is not defined.");
        });

        it('Should list only public non-hidden class members in introspection helpers.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef PublicIntrospectionFilter < handle',
                    '  properties',
                    '    PublicValue = 1;',
                    '  end',
                    '  properties (GetAccess = private)',
                    '    PrivateValue = 2;',
                    '  end',
                    '  properties (GetAccess = protected)',
                    '    ProtectedValue = 3;',
                    '  end',
                    '  properties (Hidden)',
                    '    HiddenValue = 4;',
                    '  end',
                    '  methods',
                    '    function y = publicMethod(obj)',
                    '      y = obj.PublicValue;',
                    '    end',
                    '  end',
                    '  methods (Access = private)',
                    '    function y = privateMethod(obj)',
                    '      y = 2;',
                    '    end',
                    '  end',
                    '  methods (Access = protected)',
                    '    function y = protectedMethod(obj)',
                    '      y = 3;',
                    '    end',
                    '  end',
                    '  methods (Hidden)',
                    '    function y = hiddenMethod(obj)',
                    '      y = 4;',
                    '    end',
                    '  end',
                    '  events',
                    '    PublicChanged',
                    '  end',
                    '  events (ListenAccess = private)',
                    '    PrivateChanged',
                    '  end',
                    '  events (ListenAccess = protected)',
                    '    ProtectedChanged',
                    '  end',
                    '  events (Hidden)',
                    '    HiddenChanged',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('obj = PublicIntrospectionFilter()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('properties(obj)'))).toBe('{PublicValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fieldnames(obj)'))).toBe('{PublicValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('methods(obj)'))).toBe('{publicMethod}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('events(obj)'))).toBe('{PublicChanged}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop(obj, "PrivateValue"); isprop(obj, "HiddenValue")'))).toBe('true\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod(obj, "publicMethod"); ismethod(obj, "privateMethod"); ismethod(obj, "hiddenMethod")'))).toBe(
                'true\nfalse\nfalse\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("PublicIntrospectionFilter").PropertyList(4).Hidden'))).toBe('true\n');
        });

        it('Should list duplicate inherited class member names once by superclass precedence.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef LeftDuplicateRuntime < handle',
                    '  properties',
                    '    Value = 1;',
                    '  end',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = obj.Value;',
                    '    end',
                    '  end',
                    '  events',
                    '    Changed',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef RightDuplicateRuntime < handle',
                    '  properties (Access = private)',
                    '    Value = 2;',
                    '  end',
                    '  methods (Access = private)',
                    '    function y = value(obj)',
                    '      y = 99;',
                    '    end',
                    '  end',
                    '  events (ListenAccess = private, NotifyAccess = private)',
                    '    Changed',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef DuplicateRuntimeChild < LeftDuplicateRuntime & RightDuplicateRuntime', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = DuplicateRuntimeChild(); properties(obj); methods(obj); events(obj); obj.value()'))).toBe(
                'obj=DuplicateRuntimeChild object with properties: Value\n{Value}\n{value}\n{Changed}\n1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("DuplicateRuntimeChild").MethodList(1).DefiningClass'))).toBe('meta.class LeftDuplicateRuntime\n');
        });

        it('Should support MATLAB SetGet get and set methods with partial property matching.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef SetGetPlanet < matlab.mixin.SetGet',
                    '  properties',
                    '    Diameter = 0;',
                    '    EarthMass = 0;',
                    '  end',
                    '  properties (PartialMatchPriority = 2)',
                    '    DistanceFromSun = 0;',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef SetGetVersion < matlab.mixin.SetGet',
                    '  properties',
                    '    Verbosity = 0;',
                    '  end',
                    '  properties (PartialMatchPriority = 2)',
                    '    Version = 0;',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef SetGetAmbiguous < matlab.mixin.SetGet', '  properties', '    Alpha = 0;', '    Altitude = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'classdef SetGetOptions < matlab.mixin.SetGet',
                    '  properties',
                    '    PublicValue = 0;',
                    '  end',
                    '  properties (SetAccess = private)',
                    '    ReadOnly = 1;',
                    '  end',
                    '  properties (Constant)',
                    '    Fixed = 2;',
                    '  end',
                    '  properties (Hidden)',
                    '    HiddenValue = 3;',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                ['classdef ExactSetGetPlanet < matlab.mixin.SetGetExactNames', '  properties', '    Diameter = 0;', '    DistanceFromSun = 0;', '  end', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('p = SetGetPlanet(); set(p, "Di", 6792); get(p, "Diameter"); p.DistanceFromSun'))).toBe(
                'p=SetGetPlanet object with properties: Diameter,EarthMass,DistanceFromSun\n6792\n0\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(p, "Distance", 108); get(p, "distancefromsun"); get(p)'))).toBe(
                '108\nstruct {\nDiameter: 6792\nEarthMass: 0\nDistanceFromSun: 108\n}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('v = SetGetVersion(); set(v, "Ver", 10); get(v, "Verbosity"); get(v, "Version")'))).toBe(
                'v=SetGetVersion object with properties: Verbosity,Version\n10\n0\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('e = ExactSetGetPlanet(); set(e, "Diameter", 42); get(e, "Diameter")'))).toBe(
                'e=ExactSetGetPlanet object with properties: Diameter,DistanceFromSun\n42\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = SetGetPlanet(); b = SetGetPlanet(); objs = [a, b]; set(objs, "Di", [10, 20]); get(objs, "diameter")'))).toBe(
                'a=SetGetPlanet object with properties: Diameter,EarthMass,DistanceFromSun\nb=SetGetPlanet object with properties: Diameter,EarthMass,DistanceFromSun\nobjs=[SetGetPlanet object with properties: Diameter,EarthMass,DistanceFromSun,SetGetPlanet object with properties: Diameter,EarthMass,DistanceFromSun]\n{10,20}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(objs, "Distance", 9); get(objs, "DistanceFromSun"); get(objs, {"Diameter", "EarthMass"})'))).toBe(
                '{9,9}\n{10,0;\n20,0}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('info = get(objs); info.Diameter; info.DistanceFromSun'))).toBe(
                'info=[struct {\nDiameter: 10\nEarthMass: 0\nDistanceFromSun: 9\n};\nstruct {\nDiameter: 20\nEarthMass: 0\nDistanceFromSun: 9\n}]\n10\n20\n9\n9\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(p, {"Diameter", "EarthMass"}, {11, 12}); get(p, {"Diameter", "EarthMass"})'))).toBe('{11,12}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(objs, {"Diameter", "EarthMass"}, {21, 22; 31, 32}); get(objs, {"Diameter", "EarthMass"})'))).toBe(
                '{21,22;\n31,32}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(p, struct("Diameter", 41), "EarthMass", 42); get(p, {"Diameter", "EarthMass"})'))).toBe('{41,42}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(objs, {"Diameter"}, {51; 61}, "EarthMass", [52, 62]); get(objs, {"Diameter", "EarthMass"})'))).toBe(
                '{51,52;\n61,62}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(p, Diameter=71, EarthMass=72); get(p, {"Diameter", "EarthMass"}); exist("Diameter", "var")'))).toBe('{71,72}\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(objs, struct("Diameter", [81, 91]), EarthMass=[82, 92]); get(objs, {"Diameter", "EarthMass"})'))).toBe(
                '{81,82;\n91,92}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('set(objs, {"Diameter"}, {101; 111}, EarthMass=[102, 112]); get(objs, {"Diameter", "EarthMass"})'))).toBe(
                '{101,102;\n111,112}\n',
            );
            localInterpreter.Execute('o = SetGetOptions(); options = set(o);');
            expect(localInterpreter.Unparse(localInterpreter.Execute('options; set(o, "Public"); set(o, struct("PublicValue", 5)); get(o, "PublicValue")'))).toBe(
                'struct {\nPublicValue: { }(0x0)\n}\n{ }(0x0)\n5\n',
            );
            localInterpreter.Execute('o1 = SetGetOptions(); o2 = SetGetOptions();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('set([o1, o2], struct("PublicValue", [6, 7])); get([o1, o2], "PublicValue")'))).toBe('{6,7}\n');
            expect(() => localInterpreter.Execute('set(SetGetAmbiguous(), "A", 1)')).toThrow("set: ambiguous partial property name 'A' for class SetGetAmbiguous.");
            expect(() => localInterpreter.Execute('set(objs, {"Diameter"; "EarthMass"}, {1, 2; 3, 4})')).toThrow('set: property name cell array must be 1-by-N.');
            expect(() => localInterpreter.Execute('set(objs, {"Diameter", "EarthMass"}, {1, 2})')).toThrow('set: property value cell array must be 2-by-2.');
            expect(() => localInterpreter.Execute('set(objs, "EarthMass", [1, 2, 3])')).toThrow('assignment value count 3 does not match object array length 2.');
            expect(() => localInterpreter.Execute('set(SetGetOptions(), "ReadOnly", 9)')).toThrow("set: property 'ReadOnly' is not publicly settable for class SetGetOptions.");
            expect(() => localInterpreter.Execute('set(e, "Di", 1)')).toThrow("set: unknown property 'Di' for class ExactSetGetPlanet.");
            expect(() => localInterpreter.Execute('get(e, "diameter")')).toThrow("get: unknown property 'diameter' for class ExactSetGetPlanet.");
            expect(() => localInterpreter.Execute('set(SetGetPlanet(), "Missing", 1)')).toThrow("set: unknown property 'Missing' for class SetGetPlanet.");
            expect(() => localInterpreter.Execute('get(1, "Diameter")')).toThrow('get: first argument must be a matlab.mixin.SetGet object.');
        });

        it('Should lazily load class definitions from configured class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    ExternalPoint: [
                        'classdef ExternalPoint',
                        '  properties',
                        '    x = 4;',
                        '  end',
                        '  methods',
                        '    function y = read(obj)',
                        '      y = obj.x;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ExternalPoint", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("ExternalPoint")'))).toBe('ExternalPoint is a class\n');

            localInterpreter.Execute('p = ExternalPoint()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.read()'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('properties("ExternalPoint")'))).toBe('{x}\n');
        });

        it('Should reject invalid definition placement in host-provided class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    InvalidExternalPlacementClass: [
                        'classdef InvalidExternalPlacementClass',
                        '  methods',
                        '    function y = value(obj)',
                        '      if false',
                        '        function z = hiddenexternalmethodlocal()',
                        '          z = 1;',
                        '        end',
                        '      end',
                        '      y = 1;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute('InvalidExternalPlacementClass()')).toThrow("function definition 'hiddenexternalmethodlocal' is not allowed inside a control block.");
        });

        it('Should reject locally invalid host-provided class sources from lookup probes.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    InvalidExternalAttributeClass: ['classdef (Imaginary) InvalidExternalAttributeClass', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("InvalidExternalAttributeClass", "class"); which("InvalidExternalAttributeClass")'))).toBe(
                '0\nInvalidExternalAttributeClass not found\n',
            );
            expect(() => localInterpreter.Execute('InvalidExternalAttributeClass()')).toThrow('unsupported Imaginary attribute for class InvalidExternalAttributeClass.');
        });

        it('Should lazily load class superclasses from configured class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    ExternalBase: ['classdef ExternalBase', '  properties', '    baseValue = 3;', '  end', 'end'].join('\n'),
                    ExternalChild: [
                        'classdef ExternalChild < ExternalBase',
                        '  properties',
                        '    childValue = 5;',
                        '  end',
                        '  methods',
                        '    function y = total(obj)',
                        '      y = obj.baseValue + obj.childValue;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            localInterpreter.Execute('obj = ExternalChild()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj.total()'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('superclasses("ExternalChild")'))).toBe('{ExternalBase}\n');
        });

        it('Should lazily load class definitions from a host class source provider.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'ProvidedPoint'
                        ? {
                              name,
                              source: ['classdef ProvidedPoint', '  properties', '    x = 6;', '  end', 'end'].join('\n'),
                          }
                        : undefined,
            });

            localInterpreter.Execute('p = ProvidedPoint()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ProvidedPoint", "class")'))).toBe('8\n');
        });

        it('Should inspect class-provider names without registering class definitions.', () => {
            let providedValue = 7;
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'LazyIsClassPoint'
                        ? {
                              name,
                              source: ['classdef LazyIsClassPoint', '  properties', `    x = ${providedValue};`, '  end', 'end'].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("LazyIsClassPoint"); which("LazyIsClassPoint")'))).toBe('true\nLazyIsClassPoint is a class\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("LazyIsClassPoint"); exist("LazyIsClassPoint", "class"); exist("LazyIsClassPoint", "file")'))).toBe('8\n8\n2\n');
            providedValue = 8;
            expect(localInterpreter.Unparse(localInterpreter.Execute('p = LazyIsClassPoint(); p.x'))).toBe('p=LazyIsClassPoint object with properties: x\n8\n');
        });

        it('Should keep malformed class-provider sources out of source-only lookup.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'MalformedProviderClass'
                        ? {
                              name,
                              source: ['classdef MalformedProviderClass', '  properties', '    x =', '  end', 'end'].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("MalformedProviderClass", "class"); which("MalformedProviderClass")'))).toBe(
                '0\nMalformedProviderClass not found\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("MalformedProviderClass")'))).toBe('false\n');
            expect(() => localInterpreter.Execute('MalformedProviderClass()')).toThrow('syntax error');
        });

        it('Should expose MATLAB-like class metadata objects.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef (Hidden, ConstructOnLoad, HandleCompatible, InferiorClasses = {?LowPriorityMetaPoint, ?pkg.OtherLowMetaPoint}, AllowedSubclasses = {?MetaPointChild}) MetaPoint < handle',
                    '  properties (SetObservable, NonCopyable)',
                    '    x = 1;',
                    '  end',
                    '  methods (Static, Sealed)',
                    '    function [y,z] = make(x)',
                    '      arguments',
                    '        x (1,1) double = 2',
                    '      end',
                    '      y = x;',
                    '      z = x;',
                    '    end',
                    '  end',
                    '  events (ListenAccess = private, NotifyAccess = protected)',
                    '    Changed',
                    '  end',
                    '  enumeration',
                    '    One(1)',
                    '  end',
                    'end',
                ].join('\n'),
            );

            localInterpreter.Execute('mc = metaclass(MetaPoint())');

            expect(localInterpreter.Unparse(localInterpreter.Execute('class(mc)'))).toBe('meta.class\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(mc, 'meta.class')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.Name'))).toBe('MetaPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.Sealed'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.Hidden'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.ConstructOnLoad'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.RestrictsSubclassing'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.InferiorClasses{1}; mc.InferiorClasses{2}'))).toBe('LowPriorityMetaPoint\npkg.OtherLowMetaPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.AllowedSubclasses{1}'))).toBe('MetaPointChild\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.HandleCompatible'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).Name'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).NonCopyable'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).PartialMatchPriority'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).SetObservable'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).HasDefault'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).Name'))).toBe('make\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).Static'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).Sealed'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).InputNames{1}'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).OutputNames{1}; mc.MethodList(1).OutputNames{2}'))).toBe('y\nz\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).InputValidation{1}.Name'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EventList(1).Name'))).toBe('Changed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EventList(1).ListenAccess'))).toBe('private\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EventList(1).NotifyAccess'))).toBe('protected\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EnumerationMemberList(1).Name'))).toBe('One\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EnumerationMemberList(1).ConstructorArguments{1}'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass("MetaPoint").Name'))).toBe('MetaPoint\n');
        });

        it('Should parse and evaluate MATLAB-like metaclass literals.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef LiteralMetaPoint', '  properties', '    x = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Parse('?LiteralMetaPoint'))).toBe('?LiteralMetaPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc = ?LiteralMetaPoint; mc.Name'))).toBe('mc=meta.class LiteralMetaPoint\nLiteralMetaPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(?LiteralMetaPoint, 'meta.class')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('?LiteralMetaPoint.PropertyList(1).Name'))).toBe('x\n');
        });

        it('Should resolve qualified class names from the class source provider.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'pkg.sub.ProvidedPoint'
                        ? {
                              name,
                              source: [
                                  'classdef ProvidedPoint',
                                  '  properties',
                                  '    x = 9;',
                                  '  end',
                                  '  methods (Static)',
                                  '    function y = make()',
                                  '      y = 11;',
                                  '    end',
                                  '  end',
                                  'end',
                              ].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.sub.ProvidedPoint().x'))).toBe('9\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.sub.ProvidedPoint.make()'))).toBe('11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('?pkg.sub.ProvidedPoint.Name'))).toBe('pkg.sub.ProvidedPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('?pkg.sub.ProvidedPoint.ContainingPackage'))).toBe('pkg.sub\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("pkg.sub.ProvidedPoint").PropertyList(1).Name'))).toBe('x\n');
        });

        it('Should resolve explicitly imported class names from host class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.alias.ImportedPoint': [
                        'classdef ImportedPoint',
                        '  properties',
                        '    x = 12;',
                        '  end',
                        '  methods (Static)',
                        '    function y = make()',
                        '      y = 13;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(['import pkg.alias.ImportedPoint', 'p = ImportedPoint();', 'p.x', 'ImportedPoint.make()', '?ImportedPoint.Name'].join('\n')),
                ),
            ).toBe('p=pkg.alias.ImportedPoint object with properties: x\n12\n13\npkg.alias.ImportedPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ImportedPoint", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("ImportedPoint")'))).toBe('ImportedPoint is a class\n');
        });

        it('Should call explicitly imported static class methods.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    makeImportedScaleHandle: ['function h = makeImportedScaleHandle()', '  import pkg.alias.StaticTools.scale', '  h = @scale;', 'end'].join('\n'),
                    makeImportedScaleStringHandle: ['function h = makeImportedScaleStringHandle()', '  import pkg.alias.StaticTools.scale', '  h = str2func("scale");', 'end'].join('\n'),
                },
                classSourceTable: {
                    'pkg.alias.StaticTools': {
                        sourceName: '+pkg/+alias/@StaticTools/StaticTools.m',
                        source: ['classdef StaticTools', '  methods (Static)', '    function y = scale(x)', '      y = x * 3;', '    end', '  end', 'end'].join('\n'),
                    },
                },
            });

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        [
                            'import pkg.alias.StaticTools.scale',
                            'scale(5)',
                            'feval("scale", 6)',
                            'f = @scale;',
                            'f(7)',
                            'feval(f, 8)',
                            'nargin(f)',
                            'nargout(f)',
                            'g = makeImportedScaleHandle();',
                            'g(9)',
                            'feval(g, 10)',
                            'k = makeImportedScaleStringHandle();',
                            'k(11)',
                            'feval(k, 12)',
                            'which(k)',
                        ].join('\n'),
                    ),
                ),
            ).toBe('15\n18\nf=@scale\n21\n24\n1\n1\ng=@scale\n27\n30\nk=@scale\n33\n36\npkg.alias.StaticTools.scale is a static method\n');
            const info = executeList(localInterpreter, 'functions(k)').list[0] as Structure;
            expect((info.field.type as CharString).str).toBe('simple');
            expect((info.field.file as CharString).str).toBe('+pkg/+alias/@StaticTools/StaticTools.m');
            expect(MultiArray.isEmpty(info.field.workspace)).toBe(true);
        });

        it('Should resolve qualified static class methods through handles, feval, arity, and lookup.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.qualified.StaticTools': {
                        sourceName: '+pkg/+qualified/@StaticTools/StaticTools.m',
                        source: ['classdef StaticTools', '  methods (Static)', '    function y = scale(x)', '      y = x * 5;', '    end', '  end', 'end'].join('\n'),
                    },
                },
            });

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        [
                            'direct = pkg.qualified.StaticTools.scale(2);',
                            'f = @pkg.qualified.StaticTools.scale;',
                            'fromHandle = f(3);',
                            'g = str2func("pkg.qualified.StaticTools.scale");',
                            'fromStringHandle = g(4);',
                            'fromFeval = feval("pkg.qualified.StaticTools.scale", 5);',
                            'arity = [nargin(f), nargout(g), nargin("pkg.qualified.StaticTools.scale"), nargout("pkg.qualified.StaticTools.scale")];',
                            'whichF = which(f);',
                            'whichName = which("pkg.qualified.StaticTools.scale");',
                            'result = [direct, fromHandle, fromStringHandle, fromFeval];',
                        ].join('\n'),
                    ),
                ),
            ).toBe(
                'direct=10\nf=@pkg.qualified.StaticTools.scale\nfromHandle=15\ng=@pkg.qualified.StaticTools.scale\nfromStringHandle=20\nfromFeval=25\narity=[1,1,1,1]\nwhichF=pkg.qualified.StaticTools.scale is a static method\nwhichName=pkg.qualified.StaticTools.scale is a static method\nresult=[10,15,20,25]\n',
            );
            const info = executeList(localInterpreter, 'functions(f)').list[0] as Structure;
            expect((info.field.type as CharString).str).toBe('simple');
            expect((info.field.file as CharString).str).toBe('+pkg/+qualified/@StaticTools/StaticTools.m');
            expect(MultiArray.isEmpty(info.field.workspace)).toBe(true);
        });

        it('Should apply function imports to the entire function scope.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.scope.ImportedBeforeUse': ['classdef ImportedBeforeUse', '  properties', '    x = 14;', '  end', 'end'].join('\n'),
                    'pkg.scope.Tools': ['classdef Tools', '  methods (Static)', '    function y = scale(x)', '      y = x * 4;', '    end', '  end', 'end'].join('\n'),
                },
            });

            localInterpreter.Execute(
                [
                    'function [x, y] = importscopeprobe()',
                    '  obj = ImportedBeforeUse();',
                    '  x = obj.x;',
                    '  y = scale(5);',
                    '  import pkg.scope.ImportedBeforeUse',
                    '  import pkg.scope.Tools.scale',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = importscopeprobe()'))).toBe('x=14\ny=20\n');
        });

        it('Should apply script imports to the whole script without leaking them to the caller.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    importscope: ['obj = ScriptImportedBeforeUse();', 'scriptImportValue = obj.x;', 'import pkg.script.ScriptImportedBeforeUse'].join('\n'),
                },
                classSourceTable: {
                    'pkg.script.ScriptImportedBeforeUse': ['classdef ScriptImportedBeforeUse', '  properties', '    x = 16;', '  end', 'end'].join('\n'),
                },
            });

            localInterpreter.RunScriptFile('importscope');

            expect(localInterpreter.Unparse(localInterpreter.Execute('scriptImportValue; exist("ScriptImportedBeforeUse", "class"); which("ScriptImportedBeforeUse")'))).toBe(
                '16\n0\nScriptImportedBeforeUse not found\n',
            );
        });

        it('Should query visible imports with bare import.', () => {
            const localInterpreter = Interpreter.Create();
            const result = executeList(localInterpreter, ['import pkg.query.ImportedThing', 'import pkg.query.*', 'import'].join('\n')).list[0];

            expect(MultiArray.isInstanceOf(result)).toBe(true);
            expect((result as MultiArray).isCell).toBe(true);
            expect((result as MultiArray).dimension).toEqual([2, 1]);
            expect(MultiArray.linearize(result as MultiArray).map((value) => (value as CharString).str)).toEqual(['pkg.query.ImportedThing', 'pkg.query.*']);
        });

        it('Should assign import query results from expression position.', () => {
            const localInterpreter = Interpreter.Create();
            const source = ['import pkg.query.ImportedThing', 'import pkg.query.*', 'L = import;', 'if true', '  M = import;', 'end', 'M'].join('\n');
            const result = executeList(localInterpreter, source).list.find((value) => MultiArray.isInstanceOf(value));

            expect(MultiArray.isInstanceOf(result)).toBe(true);
            expect((result as MultiArray).isCell).toBe(true);
            expect((result as MultiArray).dimension).toEqual([2, 1]);
            expect(MultiArray.linearize(result as MultiArray).map((value) => (value as CharString).str)).toEqual(['pkg.query.ImportedThing', 'pkg.query.*']);
        });

        it('Should clear base imports but reject clear import in function and script scopes.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    invalidclearimportscript: ['import pkg.clearimport.ScriptClass', 'clear import', 'scriptClearImportValue = 1;'].join('\n'),
                },
                classSourceTable: {
                    'pkg.clearimport.BaseClass': ['classdef BaseClass', '  properties', '    x = 1;', '  end', 'end'].join('\n'),
                    'pkg.clearimport.ScriptClass': ['classdef ScriptClass', '  properties', '    x = 2;', '  end', 'end'].join('\n'),
                },
            });

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(['import pkg.clearimport.BaseClass', 'exist("BaseClass", "class")', 'clear import', 'exist("BaseClass", "class")'].join('\n')),
                ),
            ).toBe('8\n0\n');
            localInterpreter.Execute(['function y = invalidclearimportfunction()', '  import pkg.clearimport.BaseClass', '  clear import', '  y = 1;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('invalidclearimportfunction()')).toThrow('clear import is not allowed inside a function or script.');
            expect(() => localInterpreter.RunScriptFile('invalidclearimportscript')).toThrow('clear import is not allowed inside a function or script.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ScriptClass", "class"); exist("scriptClearImportValue", "var")'))).toBe('0\n0\n');
        });

        it('Should reject imports inside executable control blocks.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    invalidimportscope: ['if false', '  import pkg.invalid.Hidden', 'end', 'x = 1;'].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute(['function y = invalidfunctionimport()', '  if false', '    import pkg.invalid.Hidden', '  end', '  y = 1;', 'end'].join('\n'))).toThrow(
                'import declaration is not allowed inside a control block.',
            );
            expect(() => localInterpreter.RunScriptFile('invalidimportscope')).toThrow('import declaration is not allowed inside a control block.');
            expect(() => localInterpreter.Execute('eval("try; import pkg.invalid.Hidden; catch; x = 1; end")')).toThrow('import declaration is not allowed inside a control block.');
        });

        it('Should reject ambiguous explicitly imported static class methods.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.left.StaticTools': ['classdef StaticTools', '  methods (Static)', '    function y = pick(x)', '      y = x + 1;', '    end', '  end', 'end'].join('\n'),
                    'pkg.right.StaticTools': ['classdef StaticTools', '  methods (Static)', '    function y = pick(x)', '      y = x + 2;', '    end', '  end', 'end'].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute(['import pkg.left.StaticTools.pick', 'import pkg.right.StaticTools.pick', 'pick(5)'].join('\n'))).toThrow(
                "imported name 'pick' is ambiguous: pkg.left.StaticTools.pick, pkg.right.StaticTools.pick.",
            );
            expect(() => localInterpreter.Execute(['import pkg.left.StaticTools.pick', 'import pkg.right.StaticTools.pick', 'feval("pick", 5)'].join('\n'))).toThrow(
                "imported name 'pick' is ambiguous: pkg.left.StaticTools.pick, pkg.right.StaticTools.pick.",
            );
            expect(() => localInterpreter.Execute(['import pkg.left.StaticTools.pick', 'import pkg.right.StaticTools.pick', 'f = @pick;', 'f(5)'].join('\n'))).toThrow(
                "imported name 'pick' is ambiguous: pkg.left.StaticTools.pick, pkg.right.StaticTools.pick.",
            );
        });

        it('Should enforce access for explicitly imported static class methods.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.alias.HiddenStaticTools': [
                        'classdef HiddenStaticTools',
                        '  methods (Static, Access = private)',
                        '    function y = hidden(x)',
                        '      y = x;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute(['import pkg.alias.HiddenStaticTools.hidden', 'hidden(5)'].join('\n'))).toThrow(
                "method 'hidden' has private access for class pkg.alias.HiddenStaticTools.",
            );
            expect(() => localInterpreter.Execute(['import pkg.alias.HiddenStaticTools.hidden', 'feval("hidden", 5)'].join('\n'))).toThrow(
                "method 'hidden' has private access for class pkg.alias.HiddenStaticTools.",
            );
        });

        it('Should resolve wildcard imported class names from host class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'pkg.wild.WildPoint'
                        ? {
                              name,
                              source: ['classdef WildPoint', '  properties', '    x = 21;', '  end', 'end'].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.wild.*', 'p = WildPoint();', 'p.x', '?WildPoint.ContainingPackage'].join('\n')))).toBe(
                'p=pkg.wild.WildPoint object with properties: x\n21\npkg.wild\n',
            );
        });

        it('Should resolve imported class sources keyed by MATLAB package paths.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@PathPoint/PathPoint.m': [
                        'classdef PathPoint',
                        '  properties',
                        '    x = 31;',
                        '  end',
                        '  methods (Static)',
                        '    function y = make()',
                        '      y = 32;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                    '+pkg/+wild/@WildPathPoint/WildPathPoint.m': ['classdef WildPathPoint', '  properties', '    x = 41;', '  end', 'end'].join('\n'),
                },
            });

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        ['import pkg.PathPoint', 'p = PathPoint();', 'p.x', 'PathPoint.make()', '?PathPoint.ContainingPackage', 'exist("PathPoint", "class")', 'which("PathPoint")'].join(
                            '\n',
                        ),
                    ),
                ),
            ).toBe('p=pkg.PathPoint object with properties: x\n31\n32\npkg\n8\nPathPoint is a class\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.wild.*', 'w = WildPathPoint();', 'w.x', '?WildPathPoint.Name'].join('\n')))).toBe(
                'w=pkg.wild.WildPathPoint object with properties: x\n41\npkg.wild.WildPathPoint\n',
            );
        });

        it('Should prefer directly defined classes over wildcard imports.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.shadow.ShadowPoint': ['classdef ShadowPoint', '  properties', '    x = 99;', '  end', 'end'].join('\n'),
                },
            });

            localInterpreter.Execute(['classdef ShadowPoint', '  properties', '    x = 7;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.shadow.*', 'p = ShadowPoint();', 'p.x'].join('\n')))).toBe('p=ShadowPoint object with properties: x\n7\n');
        });

        it('Should resolve meta.class.fromName through the runtime class registry.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'ProvidedMetaPoint'
                        ? {
                              name,
                              source: ['classdef ProvidedMetaPoint', '  properties', '    x = 9;', '  end', 'end'].join('\n'),
                          }
                        : undefined,
            });

            localInterpreter.Execute(['classdef FromNamePoint', '  properties', '    x = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("FromNamePoint").Name'))).toBe('FromNamePoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("ProvidedMetaPoint").PropertyList(1).Name'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(meta.class.fromName("MissingMetaPoint"))'))).toBe('true\n');
        });

        it('Should evaluate class property default values in runtime metadata.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef RuntimeDefaultMetaPoint', '  properties', '    x = 1 + 2;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeDefaultMetaPoint()).PropertyList(1).DefaultValue'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('?RuntimeDefaultMetaPoint.PropertyList(1).DefaultValue'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("RuntimeDefaultMetaPoint").PropertyList(1).Validation{1}.DefaultValue'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass(RuntimeDefaultMetaPoint()).PropertyList(1).DefiningClass.PropertyList(1).DefaultValue'))).toBe('3\n');
        });

        /**
         * Error handling regressions.
         */
        it('Should preserve the interpreter stack trace across nested function calls.', () => {
            const localInterpreter = Interpreter.Create();
            const input = [
                'function y = f(x) % start stack trace error test',
                '  y = g(x);',
                'end',
                '',
                'function z = g(x)',
                '  z = h(x);',
                'end',
                '',
                'function w = h(x)',
                '  w = x + unknownVar;',
                'end',
                '',
                'f(2) % error: show stack trace',
            ].join('\n');

            let errorText = '';
            try {
                localInterpreter.Execute(input);
            } catch (e: unknown) {
                errorText = String(e);
            }

            expect(errorText).toContain("Error: 'unknownVar' undefined.");
            expect(errorText).toContain('Error in h');
            expect(errorText).toContain('Error in g');
            expect(errorText).toContain('Error in f');
        });

        it('Should register and later resolve a local forward reference when enabled.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            expect(() => localInterpreter.Execute('a = b')).toThrow("'b' undefined.");
            localInterpreter.Execute('b = 2');
            const value = localInterpreter.Execute('a');

            expect(localInterpreter.Unparse(value)).toBe('2\n');
        });

        it('Should not treat propagated nested function errors as forward references.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;
            const input = [
                'function y = f(x)',
                '  y = g(x);',
                'end',
                '',
                'function z = g(x)',
                '  z = h(x);',
                'end',
                '',
                'function w = h(x)',
                '  w = x + unknownVar;',
                'end',
                '',
                'f(2)',
            ].join('\n');

            let errorText = '';
            try {
                localInterpreter.Execute(input);
            } catch (e: unknown) {
                errorText = String(e);
            }

            expect(errorText).toContain("Error: 'unknownVar' undefined.");
            expect(errorText).toContain('Error in h');
            expect(errorText).toContain('Error in g');
            expect(errorText).toContain('Error in f');
            expect(localInterpreter.context.currentScope.resolveName('y')).toBeUndefined();
            expect(localInterpreter.context.currentScope.resolveName('z')).toBeUndefined();
        });

        it('Should report a circular dependency between two forward references.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            expect(() => localInterpreter.Execute('A = B + 1')).toThrow("'B' undefined.");
            expect(() => localInterpreter.Execute('B = A + 1')).toThrow('Circular reference detected: A → B → A');
        });

        it('Should report a circular dependency chain across multiple forward references.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            expect(() => localInterpreter.Execute('A = B + 1')).toThrow("'B' undefined.");
            expect(() => localInterpreter.Execute('B = C + 1')).toThrow("'C' undefined.");
            expect(() => localInterpreter.Execute('C = A + 1')).toThrow('Circular reference detected: A → B → C → A');
        });

        it('Should include stack trace for invalid function calls reported by AST helpers.', () => {
            const localInterpreter = Interpreter.Create();
            const input = ['function y = f(x)', '  y = sin;', 'end', '', 'f(2)'].join('\n');

            let errorText = '';
            try {
                localInterpreter.Execute(input);
            } catch (e: unknown) {
                errorText = String(e);
            }

            expect(errorText).toContain('Invalid call to sin.');
            expect(errorText).toContain('Error in f');
        });

        it('Should capture anonymous function variables when the handle is created.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute('a = 10; f = @(x) x + a; a = 20; f(1)');

            expect(localInterpreter.Unparse(value)).toBe('a=10\nf=@(x) x+a\na=20\n11\n');
        });

        it('Should preserve anonymous function closures when handles are copied.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute('a = 10; f = @(x) x + a; g = f; a = 20; g(1)');

            expect(localInterpreter.Unparse(value)).toBe('a=10\nf=@(x) x+a\ng=@(x) x+a\na=20\n11\n');
        });

        it('Should copy anonymous function handle AST nodes independently.', () => {
            const localInterpreter = Interpreter.Create();
            const value = executeList(localInterpreter, 'f = @(x) x + 1; g = f; g(2)');
            const fAssignment = value.list[0];
            const gAssignment = value.list[1];
            if (!AST.isNodeBinaryOperation(fAssignment) || !AST.isNodeBinaryOperation(gAssignment)) {
                throw new Error('expected anonymous function assignments.');
            }
            const f = fAssignment.right;
            const g = gAssignment.right;
            if (!FunctionHandle.isInstanceOf(f) || !FunctionHandle.isInstanceOf(g)) {
                throw new Error('expected copied anonymous function handles.');
            }
            if (!f.expression || !g.expression || !AST.isNodeBinaryOperation(f.expression) || !AST.isNodeBinaryOperation(g.expression)) {
                throw new Error('expected copied anonymous function handle expressions.');
            }

            expect(localInterpreter.Unparse(value)).toBe('f=@(x) x+1\ng=@(x) x+1\n3\n');
            expect(f).not.toBe(g);
            expect(f.parameter[0]).not.toBe(g.parameter[0]);
            expect(f.expression).not.toBe(g.expression);
            expect(f.parameter[0].parent).toBe(f);
            expect(g.parameter[0].parent).toBe(g);
            expect(f.expression.parent).toBe(f);
            expect(g.expression.parent).toBe(g);
            expect(f.expression.left.parent).toBe(f.expression);
            expect(g.expression.left.parent).toBe(g.expression);
            expect(f.expression.right.parent).toBe(f.expression);
            expect(g.expression.right.parent).toBe(g.expression);
        });

        it('Should let returned anonymous functions keep their defining function scope.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['function f = makeAdder(a)', '  f = @(x) x + a;', 'end', '', 'add10 = makeAdder(10);', 'add10(1)'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('add10=@(x) x+a\n11\n');
        });

        it('Should call nested functions before their textual definition.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outercallbefore(x)', '  a = 10;', '  y = inner(x);', '  function z = inner(t)', '    z = t + a;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outercallbefore(5)'))).toBe('15\n');
        });

        it('Should reject arguments blocks in nested functions.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['function y = outernestedarguments()', '  function z = inner(x)', '    arguments', '      x double', '    end', '    z = x;', '  end', '  y = inner(1);', 'end'].join('\n'),
            );
            expect(() => localInterpreter.Execute('outernestedarguments()')).toThrow('arguments blocks are not allowed in nested function inner.');
            localInterpreter.Execute(
                ['function y = lateouternestedarguments()', '  y = inner(1);', '  function z = inner(x)', '    arguments', '      x double', '    end', '    z = x;', '  end', 'end'].join(
                    '\n',
                ),
            );
            expect(() => localInterpreter.Execute('lateouternestedarguments()')).toThrow('arguments blocks are not allowed in nested function inner.');
        });

        it('Should let nested functions update existing outer workspace variables.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outerwrite()', '  a = 1;', '  inner();', '  y = a;', '  function inner()', '    a = 5;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerwrite()'))).toBe('5\n');
        });

        it('Should keep nested function parameters local while reading outer variables.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = outershadow()', '  a = 10;', '  y = inner(3) + a;', '  function z = inner(a)', '    a = a + 1;', '    z = a;', '  end', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('outershadow()'))).toBe('14\n');
        });

        it('Should not leak nested functions into the caller scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outernoleak()', '  y = inner();', '  function z = inner()', '    z = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outernoleak()'))).toBe('1\n');
            expect(() => localInterpreter.Execute('inner()')).toThrow("'inner' undefined.");
        });

        it('Should allow nested functions to update outer return values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outerreturnupdate()', '  y = 1;', '  bump();', '  function bump()', '    y = y + 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerreturnupdate()'))).toBe('2\n');
        });

        it('Should let returned nested function handles keep their outer workspace.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(
                ['function f = makenested(a)', '  function z = inner(x)', '    z = x + a;', '  end', '  f = @inner;', 'end', '', 'h = makenested(10);', 'h(5)'].join('\n'),
            );

            expect(localInterpreter.Unparse(value)).toBe('h=@inner\n15\n');
        });

        it('Should preserve mutable outer workspace state in returned nested function handles.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(
                [
                    'function f = makecounter()',
                    '  c = 0;',
                    '  function z = bump()',
                    '    c = c + 1;',
                    '    z = c;',
                    '  end',
                    '  f = @bump;',
                    'end',
                    '',
                    'h = makecounter();',
                    'h()',
                    'h()',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(value)).toBe('h=@bump\n1\n2\n');
        });

        it('Should keep returned nested function handle workspaces independent.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makecounter()', '  c = 0;', '  function z = bump()', '    c = c + 1;', '    z = c;', '  end', '  f = @bump;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('h1 = makecounter(); h2 = makecounter(); h1(); h1(); h2()'))).toBe('h1=@bump\nh2=@bump\n1\n2\n1\n');
        });

        it('Should convert function handles to strings.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('func2str(@sin)'))).toBe('sin\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('func2str(@(x) x + 1)'))).toBe('@(x) x+1\n');
        });

        it('Should support ignored parameters in anonymous and user functions.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function y = ignorefirst(~, x)', '  y = nargin + x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Parse('@(~, x) x'))).toBe('@(~,x) x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(~, x) x + nargin; f(99, 3)'))).toBe('f=@(~,x) x+nargin\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@(~, x) x)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ignorefirst(99, 3)'))).toBe('5\n');
        });

        it('Should parse and call qualified function names and handles.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function y = pkg.double(x)', '  y = 2 * x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Parse('@pkg.double'))).toBe('@pkg.double\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.double(4)'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @pkg.double; func2str(f); f(5)'))).toBe('f=@pkg.double\npkg.double\n10\n');
        });

        it('Should convert strings to callable function handles.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('f = str2func("sin"); f(0)'))).toBe('f=@sin\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = str2func("@(x) x + 1"); g(4)'))).toBe('g=@(x) x+1\n5\n');
            expect(() => localInterpreter.Execute('str2func("   ")')).toThrow('str2func: function name cannot be empty.');
        });

        it('Should defer source-provider loading when creating named function handles.', () => {
            let directValue = 1;
            let stringValue = 3;
            let importedValue = 5;
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) => {
                    if (name === 'lazyhandleprobe') {
                        return { sourceName: 'virtual/lazyhandleprobe.m', source: ['function y = lazyhandleprobe()', `  y = ${directValue};`, 'end'].join('\n') };
                    }
                    if (name === 'lazystringhandleprobe') {
                        return { sourceName: 'virtual/lazystringhandleprobe.m', source: ['function y = lazystringhandleprobe()', `  y = ${stringValue};`, 'end'].join('\n') };
                    }
                    if (name === 'pkg.lazy.importedhandleprobe') {
                        return { name, sourceName: '+pkg/+lazy/importedhandleprobe.m', source: ['function y = importedhandleprobe()', `  y = ${importedValue};`, 'end'].join('\n') };
                    }
                    return undefined;
                },
            });

            localInterpreter.Execute('f = @lazyhandleprobe; g = str2func("lazystringhandleprobe"); which(f); functions(g);');
            expect(localInterpreter.Unparse(localInterpreter.Execute('functions(f).file; functions(g).file'))).toBe('virtual/lazyhandleprobe.m\nvirtual/lazystringhandleprobe.m\n');
            directValue = 2;
            stringValue = 4;
            expect(localInterpreter.Unparse(localInterpreter.Execute('f(); g()'))).toBe('2\n4\n');

            localInterpreter.Execute(['function h = makeimportedlazyhandle()', '  import pkg.lazy.importedhandleprobe', '  h = @importedhandleprobe;', 'end'].join('\n'));
            localInterpreter.Execute('h = makeimportedlazyhandle(); which(h); functions(h);');
            expect(localInterpreter.Unparse(localInterpreter.Execute('functions(h).file'))).toBe('+pkg/+lazy/importedhandleprobe.m\n');
            importedValue = 6;
            expect(localInterpreter.Unparse(localInterpreter.Execute('h()'))).toBe('6\n');
        });

        it('Should keep named function handles bound to resolved user functions after clear.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['function y = sin(x)', '  y = x + 10;', 'end', 'f = @sin;', 'clear sin', 'which(f)', 'f(1)', 'which("sin")', 'sin(0)'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('f=@sin\nsin is a user-defined function\n11\nsin is a built-in function\n0\n');
        });

        it('Should call built-in functions explicitly with builtin when names are shadowed.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = sin(x)', '  y = x + 10;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('sin(1); builtin("sin", 0); builtin("which", "sin")'))).toBe('11\n0\nsin is a user-defined function\n');
            expect(() => localInterpreter.Execute('builtin("missing_builtin")')).toThrow("builtin: 'missing_builtin' is not a built-in function.");
            expect(() => localInterpreter.Execute('builtin("   ")')).toThrow('builtin: function name cannot be empty.');
        });

        it('Should report basic function handle metadata.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = simplemeta(x)', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function f = makenestedmeta(a)', '  function z = inner(x)', '    z = x + a;', '  end', '  f = @inner;', 'end'].join('\n'));
            const firstResult = (source: string) => executeList(localInterpreter, source).list[0];

            const simpleInfo = firstResult('functions(@sin)') as Structure;
            expect((simpleInfo.field.function as CharString).str).toBe('sin');
            expect((simpleInfo.field.type as CharString).str).toBe('simple');
            expect((simpleInfo.field.file as CharString).str).toBe('');
            expect((simpleInfo.field.workspace as MultiArray).isCell).toBe(true);
            expect(MultiArray.isEmpty(simpleInfo.field.workspace)).toBe(true);

            localInterpreter.Execute('a = 10;');
            const simpleUserInfo = firstResult('functions(@simplemeta)') as Structure;
            expect((simpleUserInfo.field.type as CharString).str).toBe('simple');
            expect(MultiArray.isEmpty(simpleUserInfo.field.workspace)).toBe(true);

            const anonymousInfo = firstResult('functions(@(x) x + a)') as Structure;
            const anonymousWorkspace = (anonymousInfo.field.workspace as MultiArray).array[0][0] as Structure;
            expect((anonymousInfo.field.type as CharString).str).toBe('anonymous');
            expect((anonymousInfo.field.file as CharString).str).toBe('');
            expect(Complex.realToNumber(anonymousWorkspace.field.a as ComplexType)).toBe(10);

            localInterpreter.Execute('h = makenestedmeta(10);');
            const nestedInfo = firstResult('functions(h)') as Structure;
            const nestedWorkspace = (nestedInfo.field.workspace as MultiArray).array[0][0] as Structure;
            expect((nestedInfo.field.type as CharString).str).toBe('nested');
            expect(Complex.realToNumber(nestedWorkspace.field.a as ComplexType)).toBe(10);
        });

        it('Should expose only own captured bindings in function handle workspace metadata.', () => {
            const localInterpreter = Interpreter.Create();
            const harness = localInterpreter as unknown as InterpreterBuiltInHarness;
            const handle = FunctionHandle.create('workspaceprobe');
            const closure = Scope.create();
            closure.defineName('own', Complex.create(7));
            Object.setPrototypeOf(closure.nameTable, { inherited: { node: Complex.create(9) } });
            handle.closure = closure;

            const workspace = harness.functionHandleWorkspaceInfo(handle);
            const fields = workspace.array[0][0] as Structure;

            expect(Complex.realToNumber(fields.field.own as ComplexType)).toBe(7);
            expect(Structure.hasField(fields, 'inherited')).toBe(false);
        });

        it('Should report virtual source files in functions(handle) metadata.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    handlefileprobe: {
                        sourceName: '+pkg/handlefileprobe.m',
                        source: [
                            'function [simpleFile, localFile, localKind] = handlefileprobe()',
                            '  simpleInfo = functions(@handlefileprobe);',
                            '  localHandle = localfunctions(){1};',
                            '  localInfo = functions(localHandle);',
                            '  simpleFile = simpleInfo.file;',
                            '  localFile = localInfo.file;',
                            '  localKind = localInfo.type;',
                            'end',
                            'function y = localhelper()',
                            '  y = 1;',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('[simpleFile, localFile, localKind] = handlefileprobe()'))).toBe(
                'simpleFile=+pkg/handlefileprobe.m\nlocalFile=+pkg/handlefileprobe.m\nlocalKind=simple\n',
            );
        });

        it('Should report virtual source files for returned nested function handles.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    '+pkg/makenestedfilehandle.m': {
                        source: ['function h = makenestedfilehandle(a)', '  function y = inner(x)', '    y = x + a;', '  end', '  h = @inner;', 'end'].join('\n'),
                    },
                },
            });
            const firstResult = (source: string) => executeList(localInterpreter, source).list[0];

            localInterpreter.Execute('h = pkg.makenestedfilehandle(10);');
            const info = firstResult('functions(h)') as Structure;

            expect((info.field.type as CharString).str).toBe('nested');
            expect((info.field.file as CharString).str).toBe('+pkg/makenestedfilehandle.m');
            expect(localInterpreter.Unparse(localInterpreter.Execute('h(5)'))).toBe('15\n');
        });

        it('Should report virtual source files for anonymous handles created in function files.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    '+pkg/anonfilemeta.m': [
                        'function [simple, full, infoFile, stackFile] = anonfilemeta()',
                        '  f = @() mfilename();',
                        '  g = @() mfilename("fullpath");',
                        '  sfun = @() dbstack();',
                        '  info = functions(sfun);',
                        '  simple = f();',
                        '  full = g();',
                        '  infoFile = info.file;',
                        '  s = sfun();',
                        '  stackFile = s(1).file;',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('[simple, full, infoFile, stackFile] = pkg.anonfilemeta()'))).toBe(
                'simple=anonfilemeta\nfull=+pkg/anonfilemeta.m\ninfoFile=+pkg/anonfilemeta.m\nstackFile=+pkg/anonfilemeta.m\n',
            );
        });

        it('Should report virtual source files for anonymous handles created in scripts.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    'folder/anonscript.m': [
                        'scriptAnonName = @() mfilename();',
                        'scriptAnonFull = @() mfilename("fullpath");',
                        'scriptAnonStack = @() dbstack();',
                        'scriptAnonInfo = functions(scriptAnonStack);',
                    ].join('\n'),
                },
            });

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'run("anonscript"); simple = scriptAnonName(); full = scriptAnonFull(); infoFile = scriptAnonInfo.file; s = scriptAnonStack(); stackFile = s(1).file;',
                    ),
                ),
            ).toBe(
                [
                    'scriptAnonName=@() mfilename()',
                    'scriptAnonFull=@() mfilename(fullpath)',
                    'scriptAnonStack=@() dbstack()',
                    'scriptAnonInfo=struct {',
                    'function: @() dbstack()',
                    'type: anonymous',
                    'file: folder/anonscript.m',
                    'workspace: {struct {',
                    'false: false',
                    'true: true',
                    'i: i',
                    'I: i',
                    'j: i',
                    'J: i',
                    'e: 2.718281828459045235',
                    'pi: 3.141592653589793238',
                    'inf: &infin;',
                    'Inf: &infin;',
                    'nan: NaN',
                    'NaN: NaN',
                    'scriptAnonName: @() mfilename()',
                    'scriptAnonFull: @() mfilename(fullpath)',
                    '}}',
                    '}',
                    'simple=anonscript',
                    'full=folder/anonscript.m',
                    'infoFile=folder/anonscript.m',
                    's=[struct {',
                    'file: folder/anonscript.m',
                    'name: @anonymous function handle',
                    'line: 1',
                    '}]',
                    'stackFile=folder/anonscript.m',
                    '',
                ].join('\n'),
            );
        });

        it('Should return handles for functions defined in the current scope with localfunctions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = localfirst(x)', '  y = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = localsecond(x)', '  y = x + 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('c = localfunctions(); func2str(c{1}); feval(c{2}, 5)'))).toBe('c={@localfirst;\n@localsecond}\nlocalfirst\n7\n');
        });

        it('Should pre-register script local functions before their textual definitions.', () => {
            const localInterpreter = Interpreter.Create();
            const source = [
                'first = localadd(2);',
                'second = localother(2);',
                'visible = localfunctions();',
                'scriptValue = 5;',
                'workspaceVisible = localscriptworkspace();',
                'function y = localadd(x)',
                '  y = x + 1;',
                'end',
                'function y = localother(x)',
                '  y = localadd(x) + 1;',
                'end',
                'function y = localscriptworkspace()',
                '  y = exist("scriptValue", "var");',
                'end',
            ].join('\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute(source))).toBe(
                'first=3\nsecond=4\nvisible={@localadd;\n@localother;\n@localscriptworkspace}\nscriptValue=5\nworkspaceVisible=1\n',
            );
        });

        it('Should load function-file sources with private subfunctions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('baseValue = 10');
            localInterpreter.LoadFunctionFile(
                'fileprimary',
                [
                    'function y = fileprimary(x)',
                    '  y = filehelper(x) + fileother(x) + exist("baseValue", "var");',
                    'end',
                    'function z = filehelper(x)',
                    '  z = x + 1;',
                    'end',
                    'function z = fileother(x)',
                    '  z = filehelper(x) + 1;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('fileprimary(3)'))).toBe('9\n');
            expect(() => localInterpreter.Execute('filehelper(3)')).toThrow("'filehelper' undefined.");
        });

        it('Should expose function-file private subfunctions through localfunctions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.LoadFunctionFile(
                'filelocals',
                [
                    'function [names, value] = filelocals(x)',
                    '  c = localfunctions();',
                    '  names = {func2str(c{1}), func2str(c{2})};',
                    '  value = feval(c{1}, x) + feval(c{2}, x);',
                    'end',
                    'function y = filehelpera(x)',
                    '  y = x + 1;',
                    'end',
                    'function y = filehelperb(x)',
                    '  y = x + 2;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[names, value] = filelocals(5)'))).toBe('names={filehelpera,filehelperb}\nvalue=13\n');
            expect(() => localInterpreter.Execute('filehelpera(5)')).toThrow("'filehelpera' undefined.");
        });

        it('Should lazily load function-file sources from host providers.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) =>
                    name === 'lazyprimary'
                        ? {
                              source: [
                                  'function y = lazyprimary(x)',
                                  '  y = lazysub(x) + lazyrecursive(2);',
                                  'end',
                                  'function z = lazysub(x)',
                                  '  z = x * 2;',
                                  'end',
                                  'function z = lazyrecursive(n)',
                                  '  if n <= 0',
                                  '    z = 0;',
                                  '    return',
                                  '  end',
                                  '  z = 1 + lazyrecursive(n - 1);',
                                  'end',
                              ].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('lazyprimary(4)'))).toBe('10\n');
            expect(() => localInterpreter.Execute('lazysub(4)')).toThrow("'lazysub' undefined.");
        });

        it('Should apply MATLAB-like precedence across variables, lazy functions, handles, and subfunctions.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) =>
                    name === 'lazyresolve'
                        ? {
                              source: ['function y = lazyresolve(x)', '  y = lazysubresolve(x) + 1;', 'end', 'function z = lazysubresolve(x)', '  z = x * 2;', 'end'].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("lazyresolve", "file"); which("lazyresolve"); which("lazysubresolve")'))).toBe(
                '2\nlazyresolve is a user-defined function\nlazysubresolve not found\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = str2func("lazyresolve"); f(3); feval("lazyresolve", 4)'))).toBe('f=@lazyresolve\n7\n9\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lazyresolve = 99; which("lazyresolve"); which(f); f(5)'))).toBe(
                'lazyresolve=99\nlazyresolve is a variable\nlazyresolve is a user-defined function\n11\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("lazyresolve", "var"); exist("lazyresolve", "file")'))).toBe('1\n2\n');
        });

        it('Should inspect function-provider sources without loading them.', () => {
            let directValue = 1;
            let importedValue = 10;
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) => {
                    if (name === 'inspectlazy') {
                        return { source: ['function y = inspectlazy()', `  y = ${directValue};`, 'end'].join('\n') };
                    }
                    if (name === 'pkg.inspect.lazy') {
                        return { name, source: ['function y = lazy()', `  y = ${importedValue};`, 'end'].join('\n') };
                    }
                    return undefined;
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("inspectlazy", "file"); which("inspectlazy")'))).toBe('2\ninspectlazy is a user-defined function\n');
            directValue = 2;
            expect(localInterpreter.Unparse(localInterpreter.Execute('inspectlazy()'))).toBe('2\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.inspect.lazy', 'exist("lazy", "function"); which("lazy")'].join('\n')))).toBe(
                '2\nlazy is a user-defined function\n',
            );
            importedValue = 20;
            expect(localInterpreter.Unparse(localInterpreter.Execute('lazy()'))).toBe('20\n');
        });

        it('Should keep malformed function-provider sources out of source-only lookup.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) => {
                    if (name === 'malformedfunctionprobe') {
                        return { source: ['function y = malformedfunctionprobe()', '  y =', 'end'].join('\n') };
                    }
                    if (name === 'wrongprimaryprobe') {
                        return { source: ['function y = otherprimaryprobe()', '  y = 1;', 'end'].join('\n') };
                    }
                    return undefined;
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("malformedfunctionprobe", "function"); which("malformedfunctionprobe")'))).toBe(
                '0\nmalformedfunctionprobe not found\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("wrongprimaryprobe", "function"); which("wrongprimaryprobe")'))).toBe('0\nwrongprimaryprobe not found\n');
            expect(() => localInterpreter.Execute('malformedfunctionprobe()')).toThrow('syntax error');
            expect(() => localInterpreter.Execute('wrongprimaryprobe()')).toThrow(
                "function 'wrongprimaryprobe' could not be loaded: source does not contain primary function wrongprimaryprobe.",
            );
        });

        it('Should resolve qualified package function sources.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    'pkg.math.addtwice': ['function y = addtwice(x)', '  y = addhelper(x) + addhelper(x);', 'end', 'function z = addhelper(x)', '  z = x + 1;', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.math.addtwice(4)'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("pkg.math.addtwice")'))).toBe('pkg.math.addtwice is a user-defined function\n');
            expect(() => localInterpreter.Execute('addhelper(4)')).toThrow("'addhelper' undefined.");
        });

        it('Should reject invalid definition placement in host-provided function sources.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    invalidplacementfunction: [
                        'function y = invalidplacementfunction()',
                        '  if false',
                        '    function z = hiddenexternallocal()',
                        '      z = 1;',
                        '    end',
                        '  end',
                        '  y = 1;',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("invalidplacementfunction", "function"); which("invalidplacementfunction")'))).toBe(
                '0\ninvalidplacementfunction not found\n',
            );
            expect(() => localInterpreter.Execute('invalidplacementfunction()')).toThrow("function definition 'hiddenexternallocal' is not allowed inside a control block.");
        });

        it('Should reject semantically invalid host-provided function sources from lookup probes.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    invalidsignaturefunction: ['function y = invalidsignaturefunction(x, x)', '  y = x;', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("invalidsignaturefunction", "function"); which("invalidsignaturefunction")'))).toBe(
                '0\ninvalidsignaturefunction not found\n',
            );
            expect(() => localInterpreter.Execute('invalidsignaturefunction(1, 2)')).toThrow("duplicate parameter name 'x' in function invalidsignaturefunction.");
        });

        it('Should reject duplicate host-provided function-file subfunctions from lookup probes.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    duplicateexternalsubfunctions: [
                        'function y = duplicateexternalsubfunctions()',
                        '  y = localdup();',
                        'end',
                        'function z = localdup()',
                        '  z = 1;',
                        'end',
                        'function z = localdup()',
                        '  z = 2;',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("duplicateexternalsubfunctions", "function"); which("duplicateexternalsubfunctions")'))).toBe(
                '0\nduplicateexternalsubfunctions not found\n',
            );
            expect(() => localInterpreter.Execute('duplicateexternalsubfunctions()')).toThrow("duplicate function 'localdup' in function file duplicateexternalsubfunctions.");
        });

        it('Should resolve imported package function sources.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) =>
                    name === 'pkg.ops.scale'
                        ? {
                              name,
                              source: ['function y = scale(x)', '  y = x * 3;', 'end'].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.ops.scale', 'scale(5)', 'f = @scale;', 'f(6)', 'feval("scale", 7)'].join('\n')))).toBe(
                '15\nf=@scale\n18\n21\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("scale", "file"); which("scale")'))).toBe('2\nscale is a user-defined function\n');
        });

        it('Should reject ambiguous explicit imported function sources.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    'pkg.one.dupe': ['function y = dupe()', '  y = 1;', 'end'].join('\n'),
                    'pkg.two.dupe': ['function y = dupe()', '  y = 2;', 'end'].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute(['import pkg.one.dupe', 'import pkg.two.dupe', 'dupe()'].join('\n'))).toThrow(
                "imported name 'dupe' is ambiguous: pkg.one.dupe, pkg.two.dupe.",
            );
            expect(() => localInterpreter.Execute(['import pkg.one.dupe', 'import pkg.two.dupe', 'exist("dupe", "function")'].join('\n'))).toThrow(
                "imported name 'dupe' is ambiguous: pkg.one.dupe, pkg.two.dupe.",
            );
            expect(() => localInterpreter.Execute(['import pkg.one.dupe', 'import pkg.two.dupe', 'which("dupe")'].join('\n'))).toThrow(
                "imported name 'dupe' is ambiguous: pkg.one.dupe, pkg.two.dupe.",
            );
            expect(() => localInterpreter.Execute(['import pkg.one.dupe', 'import pkg.two.dupe', 'f = @dupe'].join('\n'))).toThrow(
                "imported name 'dupe' is ambiguous: pkg.one.dupe, pkg.two.dupe.",
            );
        });

        it('Should reject ambiguous explicit imported class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.one.ImportedBox': ['classdef ImportedBox', '  properties', '    x = 1;', '  end', 'end'].join('\n'),
                    'pkg.two.ImportedBox': ['classdef ImportedBox', '  properties', '    x = 2;', '  end', 'end'].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute(['import pkg.one.ImportedBox', 'import pkg.two.ImportedBox', 'ImportedBox()'].join('\n'))).toThrow(
                "imported name 'ImportedBox' is ambiguous: pkg.one.ImportedBox, pkg.two.ImportedBox.",
            );
            expect(() => localInterpreter.Execute(['import pkg.one.ImportedBox', 'import pkg.two.ImportedBox', 'exist("ImportedBox", "class")'].join('\n'))).toThrow(
                "imported name 'ImportedBox' is ambiguous: pkg.one.ImportedBox, pkg.two.ImportedBox.",
            );
            expect(() => localInterpreter.Execute(['import pkg.one.ImportedBox', 'import pkg.two.ImportedBox', 'which("ImportedBox")'].join('\n'))).toThrow(
                "imported name 'ImportedBox' is ambiguous: pkg.one.ImportedBox, pkg.two.ImportedBox.",
            );
            expect(() => localInterpreter.Execute(['import pkg.one.ImportedBox', 'import pkg.two.ImportedBox', 'isclass("ImportedBox")'].join('\n'))).toThrow(
                "imported name 'ImportedBox' is ambiguous: pkg.one.ImportedBox, pkg.two.ImportedBox.",
            );
        });

        it('Should reject ambiguous wildcard imported function sources.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    'pkg.first.pick': ['function y = pick()', '  y = 10;', 'end'].join('\n'),
                    'pkg.second.pick': ['function y = pick()', '  y = 20;', 'end'].join('\n'),
                },
            });

            expect(() => localInterpreter.Execute(['import pkg.first.*', 'import pkg.second.*', 'pick()'].join('\n'))).toThrow(
                "imported name 'pick' is ambiguous: pkg.first.pick, pkg.second.pick.",
            );
        });

        it('Should reject unqualified imports.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('import Target')).toThrow('import: imported name must be qualified.');
        });

        it('Should resolve wildcard imported package function sources.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) =>
                    name === 'pkg.tools.shift'
                        ? {
                              name,
                              source: ['function y = shift(x)', '  y = x + 8;', 'end'].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.tools.*', 'shift(2)', 'h = str2func("shift");', 'h(3)'].join('\n')))).toBe('10\nh=@shift\n11\n');
        });

        it('Should resolve imported function sources keyed by MATLAB package paths.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    '+pkg/+path/scale.m': ['function y = scale(x)', '  y = x * 2;', 'end'].join('\n'),
                    '+pkg/+path/shift.m': ['function y = shift(x)', '  y = x + 9;', 'end'].join('\n'),
                },
            });

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        ['import pkg.path.scale', 'scale(3)', 'f = @scale;', 'f(4)', 'g = str2func("scale");', 'g(5)', 'exist("scale", "file")', 'which("scale")'].join('\n'),
                    ),
                ),
            ).toBe('6\nf=@scale\n8\ng=@scale\n10\n2\nscale is a user-defined function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.path.*', 'shift(1)', 'h = str2func("shift");', 'h(2)', 'which("shift")'].join('\n')))).toBe(
                '10\nh=@shift\n11\nshift is a user-defined function\n',
            );
        });

        it('Should prefer local functions over wildcard imported package functions.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    'pkg.shadow.choose': ['function y = choose()', '  y = 99;', 'end'].join('\n'),
                },
            });

            localInterpreter.Execute(['function y = choose()', '  y = 5;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute(['import pkg.shadow.*', 'choose()'].join('\n')))).toBe('5\n');
        });

        it('Should run script-file sources with private local functions.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    localscript: [
                        'seenBefore = exist("localscripthelper", "file");',
                        'scriptValue = localscripthelper(2);',
                        'scriptHandle = @localscripthelper;',
                        'function y = localscripthelper(x)',
                        '  y = x + 1;',
                        'end',
                    ].join('\n'),
                },
            });

            localInterpreter.RunScriptFile('localscript');

            expect(localInterpreter.Unparse(localInterpreter.Execute('seenBefore; scriptValue; scriptHandle(4); which("localscripthelper")'))).toBe('2\n3\n5\nlocalscripthelper not found\n');
            expect(() => localInterpreter.Execute('localscripthelper(4)')).toThrow("'localscripthelper' undefined.");
        });

        it('Should reject invalid definition placement in host-provided script sources.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    invalidplacementscript: ['if false', '  function y = hiddenscriptlocal()', '    y = 1;', '  end', 'end', 'scriptValue = 7;'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("invalidplacementscript", "file"); which("invalidplacementscript")'))).toBe(
                '0\ninvalidplacementscript not found\n',
            );
            expect(() => localInterpreter.RunScriptFile('invalidplacementscript')).toThrow("function definition 'hiddenscriptlocal' is not allowed inside a control block.");
        });

        it('Should reject persistent declarations in host-provided script sources.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    invalidpersistentscript: ['if false', '  persistent hiddenScriptPersistent', 'end', 'scriptValue = 7;'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("invalidpersistentscript", "file"); which("invalidpersistentscript")'))).toBe(
                '0\ninvalidpersistentscript not found\n',
            );
            expect(() => localInterpreter.RunScriptFile('invalidpersistentscript')).toThrow('persistent declaration is only valid inside a function.');
        });

        it('Should attach virtual script source names to script-local functions.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    'folder/localsourcemeta.m': [
                        '[scriptLocalName, scriptLocalFull, scriptLocalStackFile] = localsourcemetahelper();',
                        'scriptLocalHandle = @localsourcemetahelper;',
                        'scriptLocalInfo = functions(scriptLocalHandle);',
                        'function [name, full, stackFile] = localsourcemetahelper()',
                        '  name = mfilename();',
                        '  full = mfilename("fullpath");',
                        '  s = dbstack();',
                        '  stackFile = s(1).file;',
                        'end',
                    ].join('\n'),
                },
            });

            localInterpreter.RunScriptFile('localsourcemeta');

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'scriptLocalName; scriptLocalFull; scriptLocalStackFile; scriptLocalInfo.file; [handleName, handleFull, handleStackFile] = scriptLocalHandle(); exist("localsourcemetahelper", "file")',
                    ),
                ),
            ).toBe(
                'localsourcemeta\nfolder/localsourcemeta.m\nfolder/localsourcemeta.m\nfolder/localsourcemeta.m\nhandleName=localsourcemeta\nhandleFull=folder/localsourcemeta.m\nhandleStackFile=folder/localsourcemeta.m\n0\n',
            );
        });

        it('Should return early from host-provided scripts.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    returnscript: [
                        'beforeReturn = scripthelper(2);',
                        'try',
                        '  return',
                        'catch',
                        '  caughtReturn = 1;',
                        'end',
                        'afterReturn = 99;',
                        'function y = scripthelper(x)',
                        '  y = x + 1;',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.RunScriptFile('returnscript'))).toBe('');
            expect(localInterpreter.Unparse(localInterpreter.Execute('beforeReturn; exist("caughtReturn", "var"); exist("afterReturn", "var"); which("scripthelper")'))).toBe(
                '3\n0\n0\nscripthelper not found\n',
            );
        });

        it('Should expose run and source for host-provided script sources.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceProvider: (name) => {
                    switch (name) {
                        case 'callerScript':
                            return {
                                source: ['x = 10;', 'y = callerhelper(x);', 'function z = callerhelper(v)', '  z = v + 2;', 'end'].join('\n'),
                            };
                        case 'baseScript':
                            return { source: 'baseOnly = 44;' };
                        default:
                            return undefined;
                    }
                },
            });
            localInterpreter.Execute(['function y = runscriptcaller()', '  run("callerScript");', '  y = x + y;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = sourcebasecaller()', '  source("baseScript", "base");', '  y = exist("baseOnly", "var");', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('runscriptcaller(); sourcebasecaller(); baseOnly'))).toBe('22\n1\n44\n');
            expect(() => localInterpreter.Execute('callerhelper(1)')).toThrow("'callerhelper' undefined.");
        });

        it('Should expose run and source as command-form script loaders without hiding variables.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    commandScript: 'commandValue = 31;',
                    commandBaseScript: 'commandBaseValue = 41;',
                },
            });
            localInterpreter.Execute(['function y = sourcecommandbase()', '  source commandBaseScript base', '  y = evalin("base", "commandBaseValue");', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('run commandScript\ncommandValue'))).toBe('commandValue=31\n31\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sourcecommandbase()'))).toBe('41\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('source = 10; source += 2; source'))).toBe('source=10\nsource=12\n12\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('run = 3; run += 4; run'))).toBe('run=3\nrun=7\n7\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('clear = 5; clear += 6; clear'))).toBe('clear=5\nclear=11\n11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which = 7; which *= 3; which'))).toBe('which=7\nwhich=21\n21\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist = 4; exist += 5; exist'))).toBe('exist=4\nexist=9\n9\n');
            expect(() => localInterpreter.Execute('source commandScript base extra')).toThrow('Invalid call to source.');

            expect(() => Interpreter.Create().Execute('run')).toThrow('Invalid call to run.');
        });

        it('Should expose exist through command-form syntax.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist sin'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist sin builtin'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1; exist x var'))).toBe('x=1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist missing_symbol'))).toBe('0\n');
            expect(() => localInterpreter.Execute('exist one two three')).toThrow('Invalid call to exist.');
        });

        it('Should expose clear as a functional built-in as well as a command.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute("x = 1; clear('x'); exist('x', 'var')"))).toBe('x=1\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("x = 1; y = 2; clear('x', \"y\"); exist('x', 'var'); exist('y', 'var')"))).toBe('x=1\ny=2\n0\n0\n');
            localInterpreter.Execute(['function y = clearable()', '  y = 7;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearable(); clear("functions"); exist("clearable", "file")'))).toBe('7\n0\n');
            expect(() => localInterpreter.Execute('clear(1)')).toThrow('Invalid call to clear.');
        });

        it('Should expose warning and dbstack through command-form syntax.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('warning off mathjslab:cmd; state = warning("query", "mathjslab:cmd"); state.state'))).toBe(
                'state=struct {\nidentifier: mathjslab:cmd\nstate: off\n}\noff\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('warning query mathjslab:cmd'))).toBe('struct {\nidentifier: mathjslab:cmd\nstate: off\n}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('warning on mathjslab:cmd; warning("query", "mathjslab:cmd").state'))).toBe('on\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('dbstack'))).toBe('[ ](0x1)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('dbstack -completenames'))).toBe('[ ](0x1)\n');
            expect(() => localInterpreter.Execute('dbstack -bad')).toThrow("dbstack: unsupported option '-bad'.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('try; error mathjslab:cmd failed now; catch ME; ME.identifier; ME.message; end'))).toBe('mathjslab:cmd\nfailed now\n');
        });

        it('Should call selected zero-argument built-ins without parentheses.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute("warning('hello'); lastwarn"))).toBe('hello\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("lasterr('msg', 'id:x'); lasterr"))).toBe('msg\nmsg\n');
            localInterpreter.Execute('lasterror("reset");');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lasterror'))).toBe('struct {\nmessage: \nidentifier: \nstack: [ ](0x0)\n}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('localfunctions'))).toBe('{ }(0x1)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mfilename'))).toBe('\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('function y = baremfilename(); y = mfilename; end; baremfilename()'))).toBe('baremfilename\n');
        });

        it('Should keep operator words available to external command-form functions.', () => {
            const localInterpreter = Interpreter.Create({
                externalCmdWListTable: {
                    help: {
                        func: (...args: string[]): string => args.join(' '),
                    },
                    helpnum: {
                        func: (): number => 42,
                    },
                    helpbool: {
                        func: (): boolean => true,
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('help ='))).toBe('=\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("help .'"))).toBe(".'\n");
            expect(localInterpreter.Unparse(localInterpreter.Execute('helpnum'))).toBe('42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('helpbool'))).toBe('true\n');
        });

        it('Should preserve assignment parsing for host command-form functions that opt in.', () => {
            const localInterpreter = Interpreter.Create({
                externalCmdWListTable: {
                    inspectcmd: {
                        preserveAssignment: true,
                        func: (...args: string[]): CharString => new CharString(args.join('|')),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('inspectcmd alpha beta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('inspectcmd = 8; inspectcmd += 2; inspectcmd'))).toBe('inspectcmd=8\ninspectcmd=10\n10\n');
        });

        it('Should expose host-provided scripts through exist and which.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    hostscript: 'hostValue = 17;',
                    cachedHostScript: { name: 'namedhostscript', sourceName: 'cache/hostscript-001.m', source: 'namedHostValue = 31;' },
                    shadowedscript: 'shadowedValue = 23;',
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("hostscript"); exist("hostscript", "file"); exist("hostscript", "function"); which("hostscript")'))).toBe(
                '2\n2\n0\nhostscript is a script\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('run("folder/hostscript.m"); hostValue'))).toBe('hostValue=17\n17\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("namedhostscript", "file"); which("namedhostscript"); run("namedhostscript"); namedHostValue'))).toBe(
                '2\nnamedhostscript is a script\nnamedHostValue=31\n31\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('run("cache/hostscript-001.m"); namedHostValue'))).toBe('namedHostValue=31\n31\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('shadowedscript = 5; exist("shadowedscript"); which("shadowedscript"); exist("shadowedscript", "file")'))).toBe(
                'shadowedscript=5\n1\nshadowedscript is a variable\n2\n',
            );
        });

        it('Should keep malformed script-provider sources out of source-only lookup.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceProvider: (name) =>
                    name === 'malformedhostscript'
                        ? {
                              source: 'x =',
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("malformedhostscript", "file"); which("malformedhostscript")'))).toBe('0\nmalformedhostscript not found\n');
            expect(() => localInterpreter.Execute('run("malformedhostscript")')).toThrow('syntax error');
        });

        it('Should resolve host source tables keyed by MATLAB package and class paths.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    '+pkg/+ops/increment.m': ['function y = increment(x)', '  y = x + 1;', 'end'].join('\n'),
                    'library/plainincrement.m': ['function y = plainincrement(x)', '  y = x + 10;', 'end'].join('\n'),
                },
                classSourceTable: {
                    '+pkg/@PathBox/PathBox.m': [
                        'classdef PathBox',
                        '  properties',
                        '    x = 12;',
                        '  end',
                        '  methods',
                        '    function y = read(obj)',
                        '      y = obj.x;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                    'library/@PlainPathBox/PlainPathBox.m': ['classdef PlainPathBox', '  properties', '    x = 20;', '  end', '  methods', '    y = read(obj)', '  end', 'end'].join('\n'),
                    'library/@PlainPathBox/read.m': ['function y = read(obj)', '  y = obj.x + 1;', 'end'].join('\n'),
                },
                scriptSourceTable: {
                    'folder/pathscript.m': 'pathScriptValue = pkg.ops.increment(4);',
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.ops.increment(4); which("pkg.ops.increment")'))).toBe('5\npkg.ops.increment is a user-defined function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p = pkg.PathBox(); p.read(); which("pkg.PathBox")'))).toBe(
                'p=pkg.PathBox object with properties: x\n12\npkg.PathBox is a class\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('plainincrement(4); which("plainincrement")'))).toBe('14\nplainincrement is a user-defined function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('q = PlainPathBox(); q.read(); which("PlainPathBox")'))).toBe(
                'q=PlainPathBox object with properties: x\n21\nPlainPathBox is a class\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('run("pathscript"); pathScriptValue'))).toBe('pathScriptValue=5\n5\n');
        });

        it('Should resolve cached host entries through explicit canonical source names.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    cachedFunctionEntry: {
                        name: 'pkg.cache.namedfunction',
                        sourceName: 'cache/functions/namedfunction.123.m',
                        source: ['function [y, simple, full] = namedfunction(x)', '  y = x + 4;', '  simple = mfilename();', '  full = mfilename("fullpath");', 'end'].join('\n'),
                    },
                },
                classSourceTable: {
                    cachedClassEntry: {
                        name: 'pkg.cache.NamedBox',
                        sourceName: 'cache/classes/NamedBox.123.m',
                        source: [
                            'classdef NamedBox',
                            '  properties',
                            '    Value = 6;',
                            '  end',
                            '  methods',
                            '    function full = inlineFile(obj)',
                            '      full = mfilename("fullpath");',
                            '    end',
                            '    y = externalFile(obj)',
                            '  end',
                            'end',
                        ].join('\n'),
                    },
                    cachedExternalMethodEntry: {
                        name: 'pkg.cache.NamedBox.externalFile',
                        sourceName: 'cache/classes/NamedBox-externalFile.123.m',
                        source: ['function full = externalFile(obj)', '  full = mfilename("fullpath");', 'end'].join('\n'),
                    },
                },
            });

            localInterpreter.Execute(
                [
                    'import pkg.cache.namedfunction',
                    'import pkg.cache.NamedBox',
                    '[value, simple, full] = namedfunction(3);',
                    'f = @namedfunction;',
                    '[handleValue, handleSimple, handleFull] = f(4);',
                    'box = NamedBox();',
                    'inlineFull = box.inlineFile();',
                    'externalFull = box.externalFile();',
                    'codes = [exist("namedfunction", "function"), exist("NamedBox", "class")];',
                    'whichFunction = which("namedfunction");',
                    'whichClass = which("NamedBox");',
                ].join('\n'),
            );

            expect(
                localInterpreter.Unparse(localInterpreter.Execute('value; simple; full; handleValue; handleSimple; handleFull; inlineFull; externalFull; codes; whichFunction; whichClass')),
            ).toBe(
                [
                    '7',
                    'namedfunction.123',
                    'cache/functions/namedfunction.123.m',
                    '8',
                    'namedfunction.123',
                    'cache/functions/namedfunction.123.m',
                    'cache/classes/NamedBox.123.m',
                    'cache/classes/NamedBox-externalFile.123.m',
                    '[2,8]',
                    'namedfunction is a user-defined function',
                    'NamedBox is a class',
                    '',
                ].join('\n'),
            );
        });

        it('Should return lexical nested function handles with localfunctions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [name, y, kind, captured] = outermakehandles(a)',
                    '  c = localfunctions();',
                    '  h = c{1};',
                    '  info = functions(h);',
                    '  name = func2str(h);',
                    '  y = h(5);',
                    '  kind = info.type;',
                    '  captured = info.workspace{1}.a;',
                    '  function z = inner(x)',
                    '    z = x + a;',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[name, y, kind, captured] = outermakehandles(10)'))).toBe('name=inner\ny=15\nkind=nested\ncaptured=10\n');
        });

        it('Should call function handles and function names through feval.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('feval(@sin, 0)'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('feval("sin", 0)'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('feval("@(x) x + 1", 4)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('feval("   ", 1)')).toThrow('feval: function name cannot be empty.');
        });

        it('Should preserve requested output count through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = fevalpair(x)', '  a = nargout;', '  b = x + 1;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = feval(@fevalpair, 10)'))).toBe('x=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = feval("fevalpair", 10)'))).toBe('x=2\ny=11\n');
        });

        it('Should call returned nested function handles through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makefevalnested(a)', '  function z = inner(x)', '    z = x + a;', '  end', '  f = @inner;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makefevalnested(10); feval(h, 5)'))).toBe('h=@inner\n15\n');
        });

        it('Should reject textual nested function calls through feval, nthargout, and arity queries.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [direct, handleCall, fevalHandleCall, nthHandleCall] = nestedtextdispatch(a)',
                    '  direct = inner(1);',
                    '  h = @inner;',
                    '  handleCall = h(2);',
                    '  fevalHandleCall = feval(h, 3);',
                    '  nthHandleCall = nthargout(1, h, 4);',
                    '  function y = inner(x)',
                    '    y = a + x;',
                    '  end',
                    'end',
                    'function y = nestedtextfeval(a)',
                    '  y = feval("inner", 1);',
                    '  function z = inner(x)',
                    '    z = a + x;',
                    '  end',
                    'end',
                    'function y = nestedtextnthargout(a)',
                    '  y = nthargout(1, "inner", 1);',
                    '  function z = inner(x)',
                    '    z = a + x;',
                    '  end',
                    'end',
                    'function y = nestedtextnargin()',
                    '  y = nargin("inner");',
                    '  function z = inner(x)',
                    '    z = x;',
                    '  end',
                    'end',
                    'function y = nestedtextnargout()',
                    '  y = nargout("inner");',
                    '  function z = inner(x)',
                    '    z = x;',
                    '  end',
                    'end',
                    'function y = nestedtextstr2func(a)',
                    '  h = str2func("inner");',
                    '  y = h(1);',
                    '  function z = inner(x)',
                    '    z = a + x;',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('[direct, handleCall, fevalHandleCall, nthHandleCall] = nestedtextdispatch(10); [direct, handleCall, fevalHandleCall, nthHandleCall]'),
                ),
            ).toBe('direct=11\nhandleCall=12\nfevalHandleCall=13\nnthHandleCall=14\n[11,12,13,14]\n');
            expect(() => localInterpreter.Execute('nestedtextfeval(10)')).toThrow("'inner' undefined.");
            expect(() => localInterpreter.Execute('nestedtextnthargout(10)')).toThrow("'inner' undefined.");
            expect(() => localInterpreter.Execute('nestedtextnargin()')).toThrow("'inner' undefined.");
            expect(() => localInterpreter.Execute('nestedtextnargout()')).toThrow("'inner' undefined.");
            expect(() => localInterpreter.Execute('nestedtextstr2func(10)')).toThrow("'inner' undefined.");
        });

        it('Should preserve anonymous function call metadata through feval.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, y) nargin + nargout; feval(f, 1, 2)'))).toBe('f=@(x,y) nargin+nargout\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) inputname(1); source = 10; feval(f, source)'))).toBe('f=@(x) inputname(1)\nsource=10\nsource\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('feval("@(x) inputname(1)", source)'))).toBe('source\n');
        });

        it('Should preserve caller workspaces through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = fevalreadcallerx()', '  y = evalin("caller", "x");', 'end'].join('\n'));
            localInterpreter.Execute(['function y = fevaloutercaller()', '  x = 7;', '  f = @(t) evalin("caller", "x + t");', '  y = feval(f, 3);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) fevalreadcallerx(); feval(f, 10)'))).toBe('f=@(x) fevalreadcallerx()\n10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fevaloutercaller()'))).toBe('10\n');
        });

        it('Should preserve input names for user functions called through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function name = fevalinputname(x)', '  name = inputname(1);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('source = 20; feval(@fevalinputname, source); feval("fevalinputname", source)'))).toBe('source=20\nsource\nsource\n');
        });

        it('Should report variables and functions with exist.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('x = 1');
            localInterpreter.Execute(['function y = existuser(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x")'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("existuser")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin")'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("missing_name")'))).toBe('0\n');
        });

        it('Should filter exist queries by kind.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('x = 1');
            localInterpreter.Execute(['function y = existfilter(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x", "var")'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x", "builtin")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin", "builtin")'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin", " builtin ")'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("existfilter", "file")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("double", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("unknown", "class")'))).toBe('0\n');
        });

        it('Should keep builtin exist queries independent from user function sources.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    sin: ['function y = sin(x)', '  y = x + 41;', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin", "builtin"); exist("sin", "file"); which("sin"); sin(1); builtin("sin", 0)'))).toBe(
                '5\n2\nsin is a user-defined function\n42\n0\n',
            );
        });

        it('Should see nested functions only inside their lexical function scope with exist.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outerexist()', '  y = exist("inner");', '  function z = inner()', '    z = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerexist()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("inner")'))).toBe('0\n');
        });

        it('Should describe resolved names with which.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('x = 1');
            localInterpreter.Execute(['function y = whichuser(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('which("x")'))).toBe('x is a variable\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("whichuser")'))).toBe('whichuser is a user-defined function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("sin")'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("missing_name")'))).toBe('missing_name not found\n');
        });

        it('Should support command-style which.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = whichcmd(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('which("sin")'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('func2str(@which)'))).toBe('which\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which sin'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which whichcmd'))).toBe('whichcmd is a user-defined function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which sin whichcmd missingcmd'))).toBe(
                'sin is a built-in function\nwhichcmd is a user-defined function\nmissingcmd not found\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('which (@which)'))).toBe('which is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which "sin"'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("which 'sin'"))).toBe('sin is a built-in function\n');
        });

        it('Should parse MATLAB command syntax as word lists.', () => {
            const localInterpreter = Interpreter.Create({
                externalCmdWListTable: {
                    cmdprobe: {
                        func: (...args: string[]): CharString => new CharString(args.join('|')),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Parse('cmdprobe alpha beta'))).toBe('cmdprobe alpha beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha beta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ...\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ... % comment\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ...\n% comment\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ...\n%{\nblock\n%}\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha % comment\ncmdprobe beta'))).toBe('alpha\nbeta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe "alpha beta" \'gamma delta\' -flag key=value'))).toBe('alpha beta|gamma delta|-flag|key=value\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe if end properties'))).toBe('if|end|properties\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe (1 + 2)'))).toBe('(1|+|2)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1, cmdprobe after comma'))).toBe('x=1\nafter|comma\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eval("cmdprobe")'))).toBe('\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eval("cmdprobe alpha beta")'))).toBe('alpha|beta\n');
            expect(() => localInterpreter.Execute('cmdprobe(1)')).toThrow("'cmdprobe' undefined.");
        });

        it('Should describe returned nested function handles with which.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function h = makewhichnested()', '  function y = inner(x)', '    y = x;', '  end', '  h = @inner;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makewhichnested(); which(h)'))).toBe('h=@inner\ninner is a nested function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("inner")'))).toBe('inner not found\n');
        });

        it('Should describe anonymous function handles with which.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) x + 1; which(g)'))).toBe('g=@(x) x+1\n@(x) x+1 is an anonymous function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which(@(x) x + 1)'))).toBe('@(x) x+1 is an anonymous function\n');
        });

        it('Should report runtime value classes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('class(1)'))).toBe('double\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class([1,2])'))).toBe('double\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class([true,false])'))).toBe('logical\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("class('abc')"))).toBe('char\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class("abc")'))).toBe('string\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(char(65))'))).toBe('char\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class({1,2})'))).toBe('cell\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(struct())'))).toBe('struct\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(@sin)'))).toBe('function_handle\n');
        });

        it('Should test runtime value classes with isa.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(1, "double")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa([1,2], "double")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(true, "double")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa([true,false], "logical")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa('abc', 'char')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa({1,2}, "cell")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(struct(), "struct")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(@sin, "function_handle")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(1, "char")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(1, "single")'))).toBe('false\n');
        });

        it('Should report the current function name with mfilename.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = currentfile()', '  y = mfilename();', 'end'].join('\n'));
            localInterpreter.Execute(['function y = currentfilefullpath()', '  y = mfilename("fullpath");', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('mfilename()'))).toBe('\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('currentfile()'))).toBe('currentfile\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('currentfilefullpath()'))).toBe('currentfilefullpath\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mfilename("class")'))).toBe('\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mfilename("bad")'))).toBe('\n');
        });

        it('Should report nested function names with mfilename.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outermfilename()', '  y = inner();', '  function z = inner()', '    z = mfilename();', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outermfilename()'))).toBe('inner\n');
        });

        it('Should report virtual function-file source names with mfilename fullpath.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    virtualfileprobe: {
                        sourceName: 'pkg/virtualfileprobe.m',
                        source: [
                            'function [simple, full, nestedFull] = virtualfileprobe()',
                            '  simple = mfilename();',
                            '  full = mfilename("fullpath");',
                            '  nestedFull = localprobe();',
                            'end',
                            'function name = localprobe()',
                            '  name = mfilename("fullpath");',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('[simple, full, nestedFull] = virtualfileprobe()'))).toBe(
                'simple=virtualfileprobe\nfull=pkg/virtualfileprobe.m\nnestedFull=pkg/virtualfileprobe.m\n',
            );
        });

        it('Should report virtual function-file source names from nested functions.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    nestedsourcefile: {
                        sourceName: '+pkg/nestedsourcefile.m',
                        source: [
                            'function [nestedName, nestedFull, nestedStackFile] = nestedsourcefile()',
                            '  [nestedName, nestedFull, nestedStackFile] = nestedprobe();',
                            '  function [name, full, stackFile] = nestedprobe()',
                            '    name = mfilename();',
                            '    full = mfilename("fullpath");',
                            '    s = dbstack();',
                            '    stackFile = s(1).file;',
                            '  end',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('[nestedName, nestedFull, nestedStackFile] = pkg.nestedsourcefile()'))).toBe(
                'nestedName=nestedsourcefile\nnestedFull=+pkg/nestedsourcefile.m\nnestedStackFile=+pkg/nestedsourcefile.m\n',
            );
        });

        it('Should infer virtual function-file source names from path-like source table keys.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    '+pkg/autosourcefile.m': ['function [simple, full] = autosourcefile()', '  simple = mfilename();', '  full = mfilename("fullpath");', 'end'].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('[simple, full] = pkg.autosourcefile()'))).toBe('simple=autosourcefile\nfull=+pkg/autosourcefile.m\n');
        });

        it('Should preserve virtual source names from preloaded manifest tables.', () => {
            const localInterpreter = Interpreter.Create({
                sourceResolver: ManifestSourceResolver.fromTable({
                    '+pkg/frommanifesttable.m': ['function [simple, full] = frommanifesttable()', '  simple = mfilename();', '  full = mfilename("fullpath");', 'end'].join('\n'),
                    manifestFunctionAlias: {
                        sourceName: '+pkg/frommanifestalias.m',
                        source: ['function [simple, full] = frommanifestalias()', '  simple = mfilename();', '  full = mfilename("fullpath");', 'end'].join('\n'),
                    },
                    manifestNamedFunctionCache: {
                        name: 'pkg.frommanifestnamed',
                        sourceName: 'cache/function-001.m',
                        source: ['function [simple, full] = frommanifestnamed()', '  simple = mfilename();', '  full = mfilename("fullpath");', 'end'].join('\n'),
                    },
                    manifestClassAlias: {
                        sourceName: '+pkg/@ManifestAliasBox/ManifestAliasBox.m',
                        source: ['classdef ManifestAliasBox', '  methods', '    function full = probe(obj)', '      full = mfilename("fullpath");', '    end', '  end', 'end'].join('\n'),
                    },
                    manifestNamedClassCache: {
                        name: 'pkg.ManifestNamedBox',
                        sourceName: 'cache/ManifestNamedBox.001.m',
                        source: ['classdef ManifestNamedBox', '  methods', '    function full = probe(obj)', '      full = mfilename("fullpath");', '    end', '  end', 'end'].join('\n'),
                    },
                    'scripts/manifestscript.m': [
                        '[scriptSimple, scriptFull] = manifesthelper();',
                        'function [simple, full] = manifesthelper()',
                        '  simple = mfilename();',
                        '  full = mfilename("fullpath");',
                        'end',
                    ].join('\n'),
                    manifestScriptAlias: {
                        sourceName: 'scripts/manifestalias.m',
                        source: [
                            '[aliasScriptSimple, aliasScriptFull] = manifestaliashelper();',
                            'function [simple, full] = manifestaliashelper()',
                            '  simple = mfilename();',
                            '  full = mfilename("fullpath");',
                            'end',
                        ].join('\n'),
                    },
                    manifestNamedScriptCache: {
                        name: 'manifestnamedscript',
                        sourceName: 'cache/script-001.m',
                        source: [
                            '[namedScriptSimple, namedScriptFull] = manifestnamedhelper();',
                            'function [simple, full] = manifestnamedhelper()',
                            '  simple = mfilename();',
                            '  full = mfilename("fullpath");',
                            'end',
                        ].join('\n'),
                    },
                }),
            });

            localInterpreter.Execute(
                [
                    '[simple, full] = pkg.frommanifesttable();',
                    '[aliasSimple, aliasFull] = pkg.frommanifestalias();',
                    '[namedSimple, namedFull] = pkg.frommanifestnamed();',
                    'classFull = pkg.ManifestAliasBox().probe();',
                    'namedClassFull = pkg.ManifestNamedBox().probe();',
                    'run("manifestscript");',
                    'run("manifestalias");',
                    'run("manifestnamedscript");',
                ].join('\n'),
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'simple; full; aliasSimple; aliasFull; namedSimple; namedFull; classFull; namedClassFull; scriptSimple; scriptFull; aliasScriptSimple; aliasScriptFull; namedScriptSimple; namedScriptFull',
                    ),
                ),
            ).toBe(
                [
                    'frommanifesttable',
                    '+pkg/frommanifesttable.m',
                    'frommanifestalias',
                    '+pkg/frommanifestalias.m',
                    'function-001',
                    'cache/function-001.m',
                    '+pkg/@ManifestAliasBox/ManifestAliasBox.m',
                    'cache/ManifestNamedBox.001.m',
                    'manifestscript',
                    'scripts/manifestscript.m',
                    'manifestalias',
                    'scripts/manifestalias.m',
                    'script-001',
                    'cache/script-001.m',
                    '',
                ].join('\n'),
            );
        });

        it('Should execute sources from fetched manifests with absolute URLs.', async () => {
            const responses: Record<string, string> = {
                'https://cdn.test/m-files/+pkg/fromurlmanifest.m?raw=1#section': [
                    'function [simple, full] = fromurlmanifest()',
                    '  simple = mfilename();',
                    '  full = mfilename("fullpath");',
                    'end',
                ].join('\n'),
                'https://cdn.test/m-files/scripts/urlmanifestscript.m?raw=1': [
                    '[urlScriptSimple, urlScriptFull] = urlmanifesthelper();',
                    'function [simple, full] = urlmanifesthelper()',
                    '  simple = mfilename();',
                    '  full = mfilename("fullpath");',
                    'end',
                ].join('\n'),
                '/ignored-for-absolute-paths/cache/stable-function.12345.m': [
                    'function [simple, full] = stablefunction()',
                    '  simple = mfilename();',
                    '  full = mfilename("fullpath");',
                    'end',
                ].join('\n'),
                '/ignored-for-absolute-paths/cache/stable-script.12345.m': [
                    '[stableScriptSimple, stableScriptFull] = stablescripthelper();',
                    'function [simple, full] = stablescripthelper()',
                    '  simple = mfilename();',
                    '  full = mfilename("fullpath");',
                    'end',
                ].join('\n'),
            };
            const fetcher = jest.fn(async (url: string) => ({
                ok: true,
                text: async () => responses[url],
            }));
            const resolver = await ManifestSourceResolver.fromManifest(
                {
                    baseUrl: '/ignored-for-absolute-paths',
                    files: [
                        { path: 'https://cdn.test/m-files/+pkg/fromurlmanifest.m?raw=1#section', kind: 'function' },
                        { path: 'https://cdn.test/m-files/scripts/urlmanifestscript.m?raw=1', kind: 'script' },
                        { path: 'cache/stable-function.12345.m', sourceName: '+pkg/stablefunction.m', kind: 'function' },
                        { path: 'cache/stable-script.12345.m', sourceName: 'scripts/stablescript.m', kind: 'script' },
                    ],
                },
                fetcher,
            );
            const localInterpreter = Interpreter.Create({ sourceResolver: resolver });

            localInterpreter.Execute('[simple, full] = pkg.fromurlmanifest(); [stableSimple, stableFull] = pkg.stablefunction(); run("urlmanifestscript"); run("stablescript");');

            expect(fetcher).toHaveBeenCalledWith('https://cdn.test/m-files/+pkg/fromurlmanifest.m?raw=1#section');
            expect(fetcher).toHaveBeenCalledWith('/ignored-for-absolute-paths/cache/stable-function.12345.m');
            expect(localInterpreter.Unparse(localInterpreter.Execute('simple; full; stableSimple; stableFull; urlScriptSimple; urlScriptFull; stableScriptSimple; stableScriptFull'))).toBe(
                [
                    'fromurlmanifest',
                    'https://cdn.test/m-files/+pkg/fromurlmanifest.m?raw=1#section',
                    'stablefunction',
                    '+pkg/stablefunction.m',
                    'urlmanifestscript',
                    'https://cdn.test/m-files/scripts/urlmanifestscript.m?raw=1',
                    'stablescript',
                    'scripts/stablescript.m',
                    '',
                ].join('\n'),
            );
        });

        it('Should report simple mfilename basenames for URL-like virtual source names.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    urlsourceprobe: {
                        sourceName: 'https://host.test/m-files/+pkg/urlsourceprobe.m?raw=1#section',
                        source: ['function [simple, full] = urlsourceprobe()', '  simple = mfilename();', '  full = mfilename("fullpath");', 'end'].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('[simple, full] = urlsourceprobe()'))).toBe(
                'simple=urlsourceprobe\nfull=https://host.test/m-files/+pkg/urlsourceprobe.m?raw=1#section\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[simple, full] = pkg.urlsourceprobe()'))).toBe(
                'simple=urlsourceprobe\nfull=https://host.test/m-files/+pkg/urlsourceprobe.m?raw=1#section\n',
            );
        });

        it('Should report virtual external class method source names with mfilename fullpath.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@MFExternal/MFExternal.m': ['classdef MFExternal', '  methods', '    [simple, full, localFull] = probe(obj)', '  end', 'end'].join('\n'),
                    '+pkg/@MFExternal/probe.m': {
                        sourceName: '+pkg/@MFExternal/probe.m',
                        source: [
                            'function [simple, full, localFull] = probe(obj)',
                            '  simple = mfilename();',
                            '  full = mfilename("fullpath");',
                            '  localFull = localprobe();',
                            'end',
                            'function name = localprobe()',
                            '  name = mfilename("fullpath");',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = pkg.MFExternal(); [simple, full, localFull] = obj.probe()'))).toBe(
                'obj=pkg.MFExternal object\nsimple=probe\nfull=+pkg/@MFExternal/probe.m\nlocalFull=+pkg/@MFExternal/probe.m\n',
            );
        });

        it('Should report host classdef source names from inline methods.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '@MFInline/MFInline.m': [
                        'classdef MFInline',
                        '  methods',
                        '    function [simple, full, stackFile] = probe(obj)',
                        '      simple = mfilename();',
                        '      full = mfilename("fullpath");',
                        '      s = dbstack();',
                        '      stackFile = s(1).file;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = MFInline(); [simple, full, stackFile] = obj.probe()'))).toBe(
                'obj=MFInline object\nsimple=MFInline\nfull=@MFInline/MFInline.m\nstackFile=@MFInline/MFInline.m\n',
            );
        });

        it('Should report host classdef source names from nested functions in inline methods.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '@MFInlineNested/MFInlineNested.m': [
                        'classdef MFInlineNested',
                        '  methods',
                        '    function [simple, full, stackFile] = probe(obj)',
                        '      [simple, full, stackFile] = nestedprobe();',
                        '      function [name, path, frameFile] = nestedprobe()',
                        '        name = mfilename();',
                        '        path = mfilename("fullpath");',
                        '        s = dbstack();',
                        '        frameFile = s(1).file;',
                        '      end',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = MFInlineNested(); [simple, full, stackFile] = obj.probe()'))).toBe(
                'obj=MFInlineNested object\nsimple=MFInlineNested\nfull=@MFInlineNested/MFInlineNested.m\nstackFile=@MFInlineNested/MFInlineNested.m\n',
            );
        });

        it('Should report simple method basenames for URL-like classdef source names.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    URLInline: {
                        sourceName: 'https://host.test/classes/@URLInline/URLInline.m?download=1',
                        source: [
                            'classdef URLInline',
                            '  methods',
                            '    function [simple, full] = probe(obj)',
                            '      simple = mfilename();',
                            '      full = mfilename("fullpath");',
                            '    end',
                            '  end',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = URLInline(); [simple, full] = obj.probe()'))).toBe(
                'obj=URLInline object\nsimple=URLInline\nfull=https://host.test/classes/@URLInline/URLInline.m?download=1\n',
            );
        });

        it('Should report the current class name with mfilename class option.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'classdef MFilenameClassProbe',
                    '  methods',
                    '    function name = instanceClassName(obj)',
                    '      name = mfilename("class");',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function name = staticClassName()',
                    '      name = mfilename("class");',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = MFilenameClassProbe(); obj.instanceClassName(); MFilenameClassProbe.staticClassName()'))).toBe(
                'obj=MFilenameClassProbe object\nMFilenameClassProbe\nMFilenameClassProbe\n',
            );
        });

        it('Should preserve mfilename class context in returned anonymous method handles.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'classdef MFilenameAnonClassProbe',
                    '  methods',
                    '    function h = instanceHandle(obj)',
                    '      h = @() mfilename("class");',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function h = staticHandle()',
                    '      h = @() mfilename("class");',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(
                localInterpreter.Unparse(localInterpreter.Execute('obj = MFilenameAnonClassProbe(); hi = obj.instanceHandle(); hs = MFilenameAnonClassProbe.staticHandle(); hi(); hs()')),
            ).toBe('obj=MFilenameAnonClassProbe object\nhi=@() mfilename(class)\nhs=@() mfilename(class)\nMFilenameAnonClassProbe\nMFilenameAnonClassProbe\n');
        });

        it('Should report user function call frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stackcaller()',
                    '  [current, caller] = stackleaf();',
                    'end',
                    'function [current, caller] = stackleaf()',
                    '  s = dbstack();',
                    '  current = s(1).name;',
                    '  caller = s(2).name;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stackcaller()'))).toBe('current=stackleaf\ncaller=stackcaller\n');
        });

        it('Should report virtual source files with dbstack for host-provided function files.', () => {
            const localInterpreter = Interpreter.Create({
                functionSourceTable: {
                    stackfileprobe: {
                        sourceName: '+pkg/stackfileprobe.m',
                        source: [
                            'function [currentFile, localFile] = stackfileprobe()',
                            '  s = dbstack();',
                            '  currentFile = s(1).file;',
                            '  localFile = localstackfile();',
                            'end',
                            'function file = localstackfile()',
                            '  s = dbstack();',
                            '  file = s(1).file;',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('[currentFile, localFile] = stackfileprobe()'))).toBe(
                'currentFile=+pkg/stackfileprobe.m\nlocalFile=+pkg/stackfileprobe.m\n',
            );
        });

        it('Should report virtual source files with dbstack for external class methods.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '@StackFileBox/StackFileBox.m': ['classdef StackFileBox', '  methods', '    [methodFile, localFile] = stackfile(obj)', '  end', 'end'].join('\n'),
                    '@StackFileBox/stackfile.m': {
                        sourceName: '@StackFileBox/stackfile.m',
                        source: [
                            'function [methodFile, localFile] = stackfile(obj)',
                            '  s = dbstack();',
                            '  methodFile = s(1).file;',
                            '  localFile = localstackfile();',
                            'end',
                            'function file = localstackfile()',
                            '  s = dbstack();',
                            '  file = s(1).file;',
                            'end',
                        ].join('\n'),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj = StackFileBox(); [methodFile, localFile] = obj.stackfile()'))).toBe(
                'obj=StackFileBox object\nmethodFile=@StackFileBox/stackfile.m\nlocalFile=@StackFileBox/stackfile.m\n',
            );
        });

        it('Should omit leading user function call frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function caller = stackskipcaller()', '  caller = stackskipleaf();', 'end', 'function caller = stackskipleaf()', '  s = dbstack(1);', '  caller = s(1).name;', 'end'].join(
                    '\n',
                ),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('stackskipcaller()'))).toBe('stackskipcaller\n');
        });

        it('Should report nested function call frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stacknested()',
                    '  [current, caller] = inner();',
                    '  function [a, b] = inner()',
                    '    s = dbstack();',
                    '    a = s(1).name;',
                    '    b = s(2).name;',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stacknested()'))).toBe('current=inner\ncaller=stacknested\n');
        });

        it('Should report anonymous function frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stackthroughanon()',
                    '  f = @() stackleafstack();',
                    '  s = f();',
                    '  current = s(1).name;',
                    '  caller = s(2).name;',
                    'end',
                    'function s = stackleafstack()',
                    '  s = dbstack();',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stackthroughanon()'))).toBe('current=stackleafstack\ncaller=@anonymous function handle\n');
        });

        it('Should omit leading anonymous frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function caller = stackskipanon()', '  f = @() dbstack(1);', '  s = f();', '  caller = s(1).name;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('stackskipanon()'))).toBe('stackskipanon\n');
        });

        it('Should omit built-in feval frames from dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stackthroughfeval()',
                    '  f = @() stackleafstack();',
                    '  s = feval(f);',
                    '  current = s(1).name;',
                    '  caller = s(2).name;',
                    'end',
                    'function s = stackleafstack()',
                    '  s = dbstack();',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stackthroughfeval()'))).toBe('current=stackleafstack\ncaller=@anonymous function handle\n');
        });

        it('Should include anonymous frames in stack traces through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = stackerrorleaf()', '  y = missingStackValue;', 'end'].join('\n'));

            let error: unknown;
            try {
                localInterpreter.Execute('f = @() stackerrorleaf(); feval(f)');
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            const errorText = `${error}`;
            expect(errorText).toContain('Error in stackerrorleaf');
            expect(errorText).toContain('Error in @anonymous function handle');
        });

        it('Should capture existing names in redefined functions while preserving forward references when enabled.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            localInterpreter.Execute(['function y = f(x)', '  y = g(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function z = g(x)', '  z = h(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('f(2)')).toThrow("'unknownVar' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 1'))).toBe('unknownVar=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f(2)'))).toBe('3\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 3'))).toBe('unknownVar=3\n');
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('f(2)'))).toBe('5\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute(['unknownVar = 1', 'f(2)'].join('\n')))).toBe('unknownVar=1\n5\n');
        });

        it('Should not resolve missing function variables through late binding when forward references are disabled.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = false;

            localInterpreter.Execute(['function y = f(x)', '  y = g(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function z = g(x)', '  z = h(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('f(2)')).toThrow("'unknownVar' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 1'))).toBe('unknownVar=1\n');
            expect(() => localInterpreter.Execute('f(2)')).toThrow("'unknownVar' undefined.");

            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 3'))).toBe('unknownVar=3\n');
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('f(2)'))).toBe('5\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute(['unknownVar = 1', 'f(2)'].join('\n')))).toBe('unknownVar=1\n5\n');
        });

        it('Should preserve persistent variables between calls without leaking them globally.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = counter()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('2\n');
            expect(localInterpreter.context.currentScope.resolveName('c')).toBeUndefined();
        });

        it('Should reset persistent variables when a function is redefined.', () => {
            const localInterpreter = Interpreter.Create();
            const definition = ['function y = counter()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n');

            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('2\n');

            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('1\n');
        });

        it('Should clear user-defined functions by name.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearuser()', '  y = 10;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearuser()'))).toBe('10\n');
            localInterpreter.Execute('clear clearuser');
            expect(() => localInterpreter.Execute('clearuser()')).toThrow("'clearuser' undefined.");
        });

        it('Should clear all user-defined functions with clear functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearone()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = cleartwo()', '  y = 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearone")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("cleartwo")'))).toBe('2\n');
            localInterpreter.Execute('clear functions');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearone")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("cleartwo")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin")'))).toBe('5\n');
        });

        it('Should clear visible cached source-provider functions from inside functions.', () => {
            let providedValue = 1;
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) => {
                    if (name === 'clearfromfunction') {
                        return {
                            source: ['function y = clearfromfunction()', '  clear functions', '  y = 0;', 'end'].join('\n'),
                        };
                    }
                    if (name === 'providedclearprobe') {
                        return {
                            source: ['function y = providedclearprobe()', `  y = ${providedValue};`, 'end'].join('\n'),
                        };
                    }
                    return undefined;
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('providedclearprobe()'))).toBe('1\n');
            providedValue = 2;
            expect(localInterpreter.Unparse(localInterpreter.Execute('providedclearprobe()'))).toBe('1\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearfromfunction()'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('providedclearprobe()'))).toBe('2\n');
        });

        it('Should not load function-provider sources only to clear unloaded names.', () => {
            const requested: string[] = [];
            const localInterpreter = Interpreter.Create({
                functionSourceProvider: (name) => {
                    requested.push(name);
                    if (name === 'unloadedclearprobe') {
                        return { source: ['function y = unloadedclearprobe()', '  y = 3;', 'end'].join('\n') };
                    }
                    if (name === 'pkg.clear.unloadedimportprobe') {
                        return { name, source: ['function y = unloadedimportprobe()', '  y = 4;', 'end'].join('\n') };
                    }
                    return undefined;
                },
            });

            localInterpreter.Execute('clear unloadedclearprobe');
            expect(requested).toEqual([]);
            expect(localInterpreter.Unparse(localInterpreter.Execute('unloadedclearprobe()'))).toBe('3\n');
            expect(requested).toEqual(['unloadedclearprobe']);

            requested.length = 0;
            localInterpreter.Execute(['import pkg.clear.unloadedimportprobe', 'clear -functions unloadedimportprobe'].join('\n'));
            expect(requested).toEqual([]);
            expect(localInterpreter.Unparse(localInterpreter.Execute('unloadedimportprobe()'))).toBe('4\n');
            expect(requested).toContain('pkg.clear.unloadedimportprobe');
        });

        it('Should clear ordinary workspace variables without clearing functions or native constants.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = stillthere()', '  y = 7;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1; y = 2; clear; exist("x", "var"); exist("y", "var"); stillthere(); i'))).toBe('x=1\ny=2\n0\n0\n7\ni\n');
        });

        it('Should clear ordinary workspace variables with clear variables.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['classdef ClearVariablesClass', '  properties', '    Value = 3;', '  end', 'end'].join('\n'));

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('x = 1; obj = ClearVariablesClass(); clear variables; exist("x", "var"); exist("obj", "var"); exist("ClearVariablesClass", "class")'),
                ),
            ).toBe('x=1\nobj=ClearVariablesClass object with properties: Value\n0\n0\n8\n');
        });

        it('Should clear only requested variables with clear -variables names.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = keepVariableOptionFunction()', '  y = 7;', 'end'].join('\n'));

            localInterpreter.Execute('x = 1; y = 2; clear -variables x');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x", "var"); y; keepVariableOptionFunction()'))).toBe('0\n2\n7\n');
        });

        it('Should clear visible names matched by wildcard patterns.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearPatternFun1()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = clearPatternFun2()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute('clearPatternA = 10; clearPatternB = 20; keepPattern = 30');

            localInterpreter.Execute('clear clearPattern? clearPatternFun*');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearPatternA", "var"); exist("clearPatternB", "var"); keepPattern'))).toBe('0\n0\n30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearPatternFun1", "function"); exist("clearPatternFun2", "function")'))).toBe('0\n0\n');
        });

        it('Should clear only requested functions with clear -functions names.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearFunctionOptionOne()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = clearFunctionOptionTwo()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute('clearFunctionOptionOne = 9');

            localInterpreter.Execute('clear -functions clearFunctionOptionOne');

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearFunctionOptionOne; clearFunctionOptionTwo()'))).toBe('9\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearFunctionOptionOne", "function")'))).toBe('0\n');
        });

        it('Should clear category names matched by wildcard patterns.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearCategoryAlpha()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = clearCategoryBeta()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute('clearCategoryVar1 = 10; clearCategoryVar2 = 20; keepCategory = 30');

            localInterpreter.Execute('clear -variables clearCategoryVar[12]');
            localInterpreter.Execute('clear -functions clearCategory*');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearCategoryVar1", "var"); exist("clearCategoryVar2", "var"); keepCategory'))).toBe('0\n0\n30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearCategoryAlpha", "function"); exist("clearCategoryBeta", "function")'))).toBe('0\n0\n');
        });

        it('Should clear visible names matched by regular expression patterns.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = rxClearFunA()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = rxClearFunB()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute('rxClearVarA = 10; rxClearVarB = 20; rxKeep = 30');

            localInterpreter.Execute('clear -regexp ^rxClear.*A$');
            localInterpreter.Execute('rxLongVarA = 40; rxLongVarB = 50; clear regexp ^rxLong.*A$');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("rxClearVarA", "var"); rxClearVarB; rxKeep'))).toBe('0\n20\n30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("rxLongVarA", "var"); rxLongVarB'))).toBe('0\n50\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("rxClearFunA", "function"); rxClearFunB()'))).toBe('0\n2\n');
        });

        it('Should clear category names matched by regular expression patterns.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = rxCategoryFunctionOne()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = rxCategoryFunctionTwo()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute('rxCategoryVariableOne = 10; rxCategoryVariableTwo = 20; rxCategoryKeep = 30');

            localInterpreter.Execute('clear -variables -regexp Variable(One|Two)$');
            localInterpreter.Execute('clear -functions -regexp FunctionOne$');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("rxCategoryVariableOne", "var"); exist("rxCategoryVariableTwo", "var"); rxCategoryKeep'))).toBe('0\n0\n30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("rxCategoryFunctionOne", "function"); rxCategoryFunctionTwo()'))).toBe('0\n2\n');
        });

        it('Should clear variables excluded by wildcard and regexp keep patterns.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('keepExclusiveA = 1; keepExclusiveB = 2; dropExclusiveA = 3; dropExclusiveB = 4');
            localInterpreter.Execute('clear -exclusive keepExclusive*');
            expect(localInterpreter.Unparse(localInterpreter.Execute('keepExclusiveA; keepExclusiveB; exist("dropExclusiveA", "var"); exist("dropExclusiveB", "var")'))).toBe('1\n2\n0\n0\n');

            localInterpreter.Execute('keepRegexA = 5; dropRegexA = 6; dropRegexB = 7');
            localInterpreter.Execute('clear -exclusive -regexp ^keepRegex');
            expect(localInterpreter.Unparse(localInterpreter.Execute('keepRegexA; exist("dropRegexA", "var"); exist("dropRegexB", "var")'))).toBe('5\n0\n0\n');
        });

        it('Should keep clear regexp and exclusive options without patterns as no-ops.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = noPatternFunction()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute(['classdef NoPatternClass', '  properties', '    Value = 3;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('noPatternVariable = 1; global noPatternGlobal; noPatternGlobal = 4');

            localInterpreter.Execute('clear -regexp');
            localInterpreter.Execute('clear -variables -regexp');
            localInterpreter.Execute('clear -functions -regexp');
            localInterpreter.Execute('clear -classes -regexp');
            localInterpreter.Execute('clear -global -regexp');
            localInterpreter.Execute('clear -exclusive');

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'noPatternVariable; noPatternFunction(); NoPatternClass().Value; noPatternGlobal; exist("noPatternVariable", "var"); exist("noPatternFunction", "function"); exist("NoPatternClass", "class")',
                    ),
                ),
            ).toBe('1\n2\n3\n4\n1\n2\n8\n');
        });

        it('Should apply exclusive keep patterns to selected clear categories.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = keepExclusiveFunction()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = dropExclusiveFunction()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute(['classdef KeepExclusiveClass', '  properties', '    Value = 3;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef DropExclusiveClass', '  properties', '    Value = 4;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('global keepExclusiveGlobal dropExclusiveGlobal; keepExclusiveGlobal = 5; dropExclusiveGlobal = 6');

            localInterpreter.Execute('clear -functions -exclusive keepExclusive*');
            localInterpreter.Execute('clear -classes -x KeepExclusive*');
            localInterpreter.Execute('clear -global -exclusive keepExclusive*');

            expect(localInterpreter.Unparse(localInterpreter.Execute('keepExclusiveFunction(); exist("dropExclusiveFunction", "function")'))).toBe('1\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('KeepExclusiveClass().Value; exist("DropExclusiveClass", "class")'))).toBe('3\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('keepExclusiveGlobal; exist("dropExclusiveGlobal", "var")'))).toBe('5\n0\n');
        });

        it('Should combine clear category options with regexp and short aliases.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = shortAliasFunctionOne()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = shortAliasFunctionTwo()', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute(['classdef ShortAliasClassOne', '  properties', '    Value = 1;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef ShortAliasClassTwo', '  properties', '    Value = 2;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('shortAliasVarOne = 10; shortAliasVarTwo = 20; global shortAliasGlobalOne shortAliasGlobalTwo; shortAliasGlobalOne = 30; shortAliasGlobalTwo = 40');

            localInterpreter.Execute('clear -v regexp VarOne$');
            localInterpreter.Execute('clear -f -r FunctionOne$');
            localInterpreter.Execute('clear -c regexp ClassOne$');
            localInterpreter.Execute('clear -g -r GlobalOne$');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("shortAliasVarOne", "var"); shortAliasVarTwo'))).toBe('0\n20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("shortAliasFunctionOne", "function"); shortAliasFunctionTwo()'))).toBe('0\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ShortAliasClassOne", "class"); ShortAliasClassTwo().Value'))).toBe('0\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("shortAliasGlobalOne", "var"); shortAliasGlobalTwo'))).toBe('0\n40\n');
        });

        it('Should clear only requested classes with clear -classes names.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['classdef ClearClassOptionOne', '  properties', '    Value = 1;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef ClearClassOptionTwo', '  properties', '    Value = 2;', '  end', 'end'].join('\n'));

            localInterpreter.Execute('clear -classes ClearClassOptionOne');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ClearClassOptionOne", "class"); exist("ClearClassOptionTwo", "class"); ClearClassOptionTwo().Value'))).toBe(
                '0\n8\n2\n',
            );
        });

        it('Should clear variables, globals, user functions, imports, and loaded classes with clear all.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    'pkg.clearall.ClearAllClass': ['classdef ClearAllClass', '  properties', '    Value = 5;', '  end', 'end'].join('\n'),
                },
                functionSourceTable: {
                    'pkg.clearall.clearAllShift': ['function y = clearAllShift(x)', '  y = x + 2;', 'end'].join('\n'),
                },
            });
            localInterpreter.Execute(['function y = localclearall()', '  y = 9;', 'end'].join('\n'));

            const result = localInterpreter.Execute(
                [
                    'import pkg.clearall.ClearAllClass',
                    'import pkg.clearall.clearAllShift',
                    'global g',
                    'x = 1;',
                    'g = 2;',
                    'before = ClearAllClass().Value + clearAllShift(3) + localclearall();',
                    'clear all',
                    'varCode = exist("x", "var");',
                    'globalCode = exist("g", "var");',
                    'localFunctionCode = exist("localclearall", "function");',
                    'importedFunctionCode = exist("clearAllShift", "function");',
                    'classCode = exist("ClearAllClass", "class");',
                    'qualifiedFunction = pkg.clearall.clearAllShift(4);',
                    'qualifiedClass = pkg.clearall.ClearAllClass().Value;',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(result)).toBe(
                'x=1\ng=2\nbefore=19\nvarCode=0\nglobalCode=0\nlocalFunctionCode=0\nimportedFunctionCode=0\nclassCode=0\nqualifiedFunction=6\nqualifiedClass=5\n',
            );
            expect(() => localInterpreter.Execute('before')).toThrow("'before' undefined.");
        });

        it('Should clear all workspace categories with the short all option.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = shortclearall()', '  y = 9;', 'end'].join('\n'));
            localInterpreter.Execute(['classdef ShortClearAllClass', '  properties', '    Value = 5;', '  end', 'end'].join('\n'));

            localInterpreter.Execute('global shortClearAllGlobal; shortClearAllVar = 1; shortClearAllGlobal = 2; clear -a');

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'exist("shortClearAllVar", "var"); exist("shortClearAllGlobal", "var"); exist("shortclearall", "function"); exist("ShortClearAllClass", "class")',
                    ),
                ),
            ).toBe('0\n0\n0\n0\n');
        });

        it('Should clear a shadowing variable before clearing a function with the same name.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearshadow()', '  y = 5;', 'end'].join('\n'));
            localInterpreter.Execute('clearshadow = 3');

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearshadow'))).toBe('3\n');
            localInterpreter.Execute('clear clearshadow');
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearshadow()'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearshadow")'))).toBe('2\n');
            localInterpreter.Execute('clear clearshadow');
            expect(() => localInterpreter.Execute('clearshadow()')).toThrow("'clearshadow' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearshadow")'))).toBe('0\n');
        });

        it('Should reset persistent variables after clearing and redefining a function.', () => {
            const localInterpreter = Interpreter.Create();
            const definition = ['function y = clearcounter()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n');

            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearcounter()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearcounter()'))).toBe('2\n');
            localInterpreter.Execute('clear clearcounter');
            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearcounter()'))).toBe('1\n');
        });

        it('Should reject persistent declarations outside function bodies.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('persistent c')).toThrow('persistent declaration is only valid inside a function.');
            expect(() => localInterpreter.Execute(['if false', '  persistent hiddenPersistent', 'end'].join('\n'))).toThrow('persistent declaration is only valid inside a function.');
            expect(() => localInterpreter.Execute(['try', '  x = 1;', 'catch', '  persistent caughtPersistent', 'end'].join('\n'))).toThrow(
                'persistent declaration is only valid inside a function.',
            );
        });

        it('Should share global variables between global scope and function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = readg()', '  global g', '  y = g;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('readg()'))).toBe('10\n');
        });

        it('Should reject global declarations that conflict with function signatures or prior references.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['function y = globalinput(x)', '  global x', '  y = x;', 'end'].join('\n'))).toThrow("can't make function parameter x global.");
            expect(() => localInterpreter.Execute(['function y = globaloutput()', '  global y', '  y = 1;', 'end'].join('\n'))).toThrow("can't make function parameter y global.");
            expect(() => localInterpreter.Execute(['function y = globalafteruse()', '  x = 0;', '  global x', '  y = x;', 'end'].join('\n'))).toThrow(
                "global declaration 'x' must appear before any use in function globalafteruse.",
            );
            expect(() =>
                localInterpreter.Execute(['function y = nestedglobalafteruse()', '  if true', '    x = 0;', '  end', '  if true', '    global x', '  end', '  y = x;', 'end'].join('\n')),
            ).toThrow("global declaration 'x' must appear before any use in function nestedglobalafteruse.");

            localInterpreter.Execute(['function y = globalredeclaration()', '  global g = 1;', '  g = g + 1;', '  global g = 99;', '  y = g;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('globalredeclaration(); globalredeclaration()'))).toBe('2\n3\n');
        });

        it('Should update global variables assigned inside functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setg(x)', '  global g', '  g = x;', 'end'].join('\n'));

            localInterpreter.Execute('setg(7)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('7\n');
        });

        it('Should keep local variables separate from globals when global is not declared in the function.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = localg()', '  g = 2;', '  y = g;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('localg()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('10\n');
        });

        it('Should clear all global variables with clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g h');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute('h = 20');
            localInterpreter.Execute('localValue = 30');

            localInterpreter.Execute('clear global');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("g", "var")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("h", "var")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('localValue'))).toBe('30\n');
        });

        it('Should clear only requested global variables with clear global names.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g h');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute('h = 20');

            localInterpreter.Execute('clear global g');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("g", "var"); h'))).toBe('0\n20\n');
            localInterpreter.Execute('clear -g h');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("h", "var")'))).toBe('0\n');
        });

        it('Should clear global variables matched by wildcard patterns.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global clearGlobalOne clearGlobalTwo keepGlobal');
            localInterpreter.Execute('clearGlobalOne = 1; clearGlobalTwo = 2; keepGlobal = 3');

            localInterpreter.Execute('clear global clearGlobal*');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearGlobalOne", "var"); exist("clearGlobalTwo", "var"); keepGlobal'))).toBe('0\n0\n3\n');
        });

        it('Should remove global aliases from active function workspaces with clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = clearandreadglobal()', '  global g', '  clear global', '  y = exist("g", "var");', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearandreadglobal()'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("g", "var")'))).toBe('0\n');
        });

        it('Should allow global variables to be recreated after clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute('clear global');
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 3');

            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('3\n');
        });

        it('Should remove global entries from captured function definition scopes with clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = capturedglobalexists()', '  y = exist("g", "var");', 'end'].join('\n'));
            localInterpreter.Execute('clear global');

            expect(localInterpreter.Unparse(localInterpreter.Execute('capturedglobalexists()'))).toBe('0\n');
        });

        it('Should allow global declarations with initial values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setinitial()', '  global g = 4', 'end'].join('\n'));

            localInterpreter.Execute('setinitial()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('4\n');
        });

        it('Should initialize Octave-style global declarations only once.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global onceGlobal = 1; global onceGlobal = 2');
            expect(localInterpreter.Unparse(localInterpreter.Execute('onceGlobal'))).toBe('1\n');

            localInterpreter.Execute('onceGlobal = 7; global onceGlobal = 9');
            expect(localInterpreter.Unparse(localInterpreter.Execute('onceGlobal'))).toBe('7\n');
        });

        it('Should keep global declaration initialization state after clearing local visibility.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global hiddenGlobal = 5; clear hiddenGlobal; global hiddenGlobal = 9');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(hiddenGlobal)'))).toBe('true\n');
        });

        it('Should allow comma-separated global declarations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse('global a, b = 2, c'))).toBe('global a b=2 c\n');
            localInterpreter.Execute(['function setcommaglobals()', '  global a, b = 2, c = 3', 'end'].join('\n'));
            localInterpreter.Execute('setcommaglobals()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('b; c'))).toBe('2\n3\n');
        });

        it('Should allow comma-separated persistent declarations.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [x, y] = commapersistent()', '  persistent a = 1, b = 10', '  a = a + 1;', '  b = b + 2;', '  x = a;', '  y = b;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = commapersistent(); [a, b] = commapersistent()'))).toBe('a=2\nb=12\na=3\nb=14\n');
        });

        it('Should reject persistent declarations that conflict with function signatures or prior references.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['function y = persistentinput(x)', '  persistent x', '  y = x;', 'end'].join('\n'))).toThrow(
                "can't make function parameter x persistent.",
            );
            expect(() => localInterpreter.Execute(['function y = persistentoutput()', '  persistent y', '  y = 1;', 'end'].join('\n'))).toThrow(
                "can't make function parameter y persistent.",
            );
            expect(() => localInterpreter.Execute(['function y = persistentafteruse()', '  x = 0;', '  persistent x', '  y = x;', 'end'].join('\n'))).toThrow(
                "persistent declaration 'x' must appear before any use in function persistentafteruse.",
            );
            expect(() => localInterpreter.Execute(['function y = nestedpersistentinput(x)', '  if true', '    persistent x', '  end', '  y = x;', 'end'].join('\n'))).toThrow(
                "can't make function parameter x persistent.",
            );
            expect(() =>
                localInterpreter.Execute(
                    ['function y = nestedpersistentafteruse()', '  if true', '    x = 0;', '  end', '  if true', '    persistent x', '  end', '  y = x;', 'end'].join('\n'),
                ),
            ).toThrow("persistent declaration 'x' must appear before any use in function nestedpersistentafteruse.");
            localInterpreter.Execute(['function y = persistentredeclaration()', '  persistent x = 1;', '  x = x + 1;', '  persistent x = 99;', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('persistentredeclaration(); persistentredeclaration()'))).toBe('2\n3\n');
        });

        it('Should evaluate persistent declaration defaults only once.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = persistentdefaultonce()', '  persistent seed = 1;', '  persistent value = seed;', '  seed = seed + 1;', '  y = value;', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('persistentdefaultonce(); persistentdefaultonce(); persistentdefaultonce()'))).toBe('1\n1\n1\n');
        });

        it('Should unparse global and persistent declarations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse('global g'))).toBe('global g\n');
            expect(localInterpreter.Unparse(localInterpreter.Parse('persistent c = 0'))).toBe('persistent c=0\n');
            expect(localInterpreter.Unparse(localInterpreter.Parse('global a b c'))).toBe('global a b c\n');
            expect(localInterpreter.Unparse(localInterpreter.Parse('global a, b, c'))).toBe('global a b c\n');
        });

        it('Should unparse global and persistent declarations as MathML without invalid nodes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.ToMathML('global g')).not.toContain('invalid');
            expect(localInterpreter.ToMathML('persistent c = 0')).not.toContain('invalid');
            expect(localInterpreter.ToMathML('global a b c')).not.toContain('invalid');
        });

        it('Should evaluate declaration-only lists to matching omitted declaration placeholders.', () => {
            const localInterpreter = Interpreter.Create();

            const globalResult = localInterpreter.Execute('global a b c');
            expect(globalResult.type).toBe('LIST');
            expect(globalResult.list[0].omitOutput).toBe(true);
            expect(localInterpreter.Unparse(globalResult)).toBe(localInterpreter.Unparse(localInterpreter.Parse('global a b c')));
            expect(localInterpreter.Unparse(localInterpreter.Execute(['global a b c', 'a = 1'].join('\n')))).toBe('a=1\n');
        });

        it('Should preserve no-output function calls as omitted list placeholders.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setg(x)', '  global g', '  g = x;', 'end'].join('\n'));

            const result = localInterpreter.Execute('setg(7)');

            expect(result.type).toBe('LIST');
            expect(result.list[0].omitOutput).toBe(true);
            expect(localInterpreter.Unparse(result)).toBe(localInterpreter.Unparse(localInterpreter.Parse('setg(7)')));
            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('7\n');
        });

        it('Should assign multiple outputs from user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));

            const result = localInterpreter.Execute('[u, v] = pair(10)');

            expect(localInterpreter.Unparse(result)).toBe('u=10\nv=11\n');
        });

        it('Should assign multiple outputs into indexed and field target lists.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2, 3]; [A(1) A(3)] = pair(10)'))).toBe('A=[1,2,3]\nA=[10,2,3]\nA=[10,2,11]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S.a = 0; S.b = 0; [S.a S.b] = pair(20)'))).toBe(
                'S=struct {\na: 0\n}\nS=struct {\na: 0\nb: 0\n}\nS=struct {\na: 20\nb: 0\n}\nS=struct {\na: 20\nb: 21\n}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('dyn = "b"; S.a = 0; S.b = 0; [S.a S.(dyn)] = pair(30)'))).toBe(
                'dyn=b\nS=struct {\na: 0\nb: 21\n}\nS=struct {\na: 0\nb: 0\n}\nS=struct {\na: 30\nb: 0\n}\nS=struct {\na: 30\nb: 31\n}\n',
            );
        });

        it('Should allow ignored outputs in user-defined function return lists.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [~, b] = ignoredfirst(x)', '  b = x + 1;', 'end'].join('\n'));

            const result = localInterpreter.Execute('[~, y] = ignoredfirst(10)');

            expect(localInterpreter.Unparse(result)).toBe('y=11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout(@ignoredfirst)'))).toBe('2\n');
        });

        it('Should report requested and ignored outputs with isargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function [a, b, c, mask] = requestedoutputs(x)', '  a = isargout(1);', '  b = isargout(2);', '  c = isargout(3);', '  mask = isargout([1, 2, 3, 4]);', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('requestedoutputs(0)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b, c] = requestedoutputs(0); [a, b, c]'))).toBe('a=true\nb=true\nc=true\n[true,true,true]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b, ~, mask] = requestedoutputs(0); b; mask'))).toBe(
                'b=true\nmask=[false,true,false,true]\ntrue\n[false,true,false,true]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("isargout"); nargout("isargout")'))).toBe('1\n1\n');
            expect(() => localInterpreter.Execute('isargout(1)')).toThrow('isargout is only valid inside a function.');
            expect(() => localInterpreter.Execute(['function y = badisargout()', '  y = isargout(0);', 'end', 'badisargout()'].join('\n'))).toThrow('Invalid call to isargout.');
        });

        it('Should allow outputs ignored by the caller to remain unassigned.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [a, b] = skipfixed()',
                    '  if isargout(1), a = 1; end',
                    '  if isargout(2), b = 2; end',
                    'end',
                    'function varargout = skipvar()',
                    '  if isargout(1), varargout{1} = 1; end',
                    '  if isargout(2), varargout{2} = 2; end',
                    'end',
                    'function [a, b] = skipoutputargs()',
                    '  arguments (Output)',
                    '    a double',
                    '    b double',
                    '  end',
                    '  if isargout(1), a = 1; end',
                    '  if isargout(2), b = 2; end',
                    'end',
                    'function [a, b] = missingfixedunlessignored()',
                    '  if isargout(2), b = 2; end',
                    'end',
                    'function [a, b] = missingoutputunlessignored()',
                    '  arguments (Output)',
                    '    a double',
                    '    b double',
                    '  end',
                    '  if isargout(2), b = 2; end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = skipfixed(); b'))).toBe('b=2\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = skipvar(); b'))).toBe('b=2\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = skipoutputargs(); b'))).toBe('b=2\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = missingfixedunlessignored(); b'))).toBe('b=2\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = missingoutputunlessignored(); b'))).toBe('b=2\n2\n');
            expect(() => localInterpreter.Execute('[a, b] = missingfixedunlessignored()')).toThrow("Undefined return variable 'a'");
            expect(() => localInterpreter.Execute('[a, b] = missingoutputunlessignored()')).toThrow("'a' undefined.");
        });

        it('Should preserve isargout masks through indirect call dispatch.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b, c] = indirectmaskprobe()', '  a = isargout(1);', '  b = isargout(2);', '  c = isargout(3);', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b, c] = directmaskwrapper()', '  [a, b, c] = indirectmaskprobe();', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b, c] = fevalmaskwrapper()', '  [a, b, c] = feval(@indirectmaskprobe);', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b, c] = builtinfevalmaskwrapper()', '  [a, b, c] = builtin("feval", @indirectmaskprobe);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b, ~] = indirectmaskprobe(); b'))).toBe('b=true\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b, ~] = directmaskwrapper(); b'))).toBe('b=true\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b, ~] = fevalmaskwrapper(); b'))).toBe('b=true\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b, ~] = builtinfevalmaskwrapper(); b'))).toBe('b=true\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b, c] = builtinfevalmaskwrapper(); [a, b, c]'))).toBe('a=true\nb=true\nc=true\n[true,true,true]\n');
        });

        it('Should report too many requested outputs from user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('[u, v, w] = pair(10)')).toThrow('element number 3 undefined in return list');
        });

        it('Should request one output from calls used as function arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = echo(x)', '  y = x;', 'end'].join('\n'));

            const result = localInterpreter.Execute('[u, v] = pair(echo(pair(10)))');

            expect(localInterpreter.Unparse(result)).toBe('u=10\nv=11\n');
        });

        it('Should expose nargin inside user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('clear');
            localInterpreter.Execute(['function y = countargs(a, b)', '  y = nargin;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('countargs(1, 2)'))).toBe('2\n');
        });

        it('Should expose nargout inside user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = countouts()', '  a = nargout;', '  b = nargout + 10;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = countouts()'))).toBe('x=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = countouts()'))).toBe('x=2\ny=12\n');
        });

        it('Should expose nargin and nargout as zero-argument calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = counts(x)', '  a = nargin();', '  b = nargout();', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = counts(7)'))).toBe('x=1\ny=2\n');
        });

        it('Should report declared function arity with nargin and nargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = declaredarity(x, y)', '  a = x;', '  b = y;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@declaredarity)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout(@declaredarity)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("declaredarity")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("declaredarity")'))).toBe('2\n');
        });

        it('Should report variable input and output arity with negative counts.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = varinarity(x, varargin)', '  y = nargin;', 'end'].join('\n'));
            localInterpreter.Execute(['function varargout = varoutarity(x)', '  varargout{1} = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, varargout] = mixedvaroutarity(x)', '  a = x;', '  varargout{1} = x + 1;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@varinarity)'))).toBe('-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("varinarity")'))).toBe('-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout(@varoutarity)'))).toBe('-1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("mixedvaroutarity")'))).toBe('-2\n');
        });

        it('Should assign fixed outputs followed by varargout outputs.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, varargout] = mixedoutvalues(x, varargin)', '  a = x;', '  varargout{1} = nargin;', '  varargout{2} = x + 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('a = mixedoutvalues(5)'))).toBe('a=5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = mixedoutvalues(5, 6, 7)'))).toBe('a=5\nb=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b, c] = mixedoutvalues(5, 6, 7)'))).toBe('a=5\nb=3\nc=7\n');
        });

        it('Should report anonymous and nested function handle arity.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function h = makenestedarity(a)', '  function [u, v] = inner(x, y)', '    u = x + a;', '    v = y + a;', '  end', '  h = @inner;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@(x, y) x + y)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("@(x, y) x + y")'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makenestedarity(10); nargin(h); nargout(h)'))).toBe('h=@inner\n2\n2\n');
        });

        it('Should report built-in function arity from signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sin"); nargout("sin")'))).toBe('1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("feval"); nargout("feval")'))).toBe('-1\n-1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('nargin("eval"); nargin("evalc"); nargin("evalin"); nargout("eval"); nargout("evalc"); nargout("evalin"); nargin("assignin")'),
                ),
            ).toBe('-2\n-2\n-3\n-1\n-1\n-1\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("dbstack"); nargin("localfunctions"); nargout("assignin")'))).toBe('-2\n0\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("nargin"); nargout("nargout")'))).toBe('-1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sin"); nargin("factorial"); nargin("logb"); nargin("hypot"); nargout("atan2")'))).toBe('1\n1\n2\n2\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("isempty"); nargin("size"); nargin("numel"); nargin("ind2sub"); nargin("sub2ind")'))).toBe('1\n-2\n-2\n2\n-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("size"); nargout("ind2sub"); nargout("numel")'))).toBe('-1\n-1\n1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('nargin("zeros"); nargin("ones"); nargin("rand"); nargin("randi"); nargin("reshape"); nargin("repmat"); nargin("squeeze")'),
                ),
            ).toBe('-1\n-1\n-1\n-2\n-2\n-2\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("colon"); nargin("linspace"); nargin("logspace"); nargin("cat"); nargin("horzcat"); nargin("vertcat")'))).toBe(
                '-3\n-3\n-3\n-2\n-1\n-1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("meshgrid"); nargout("meshgrid"); nargin("ndgrid"); nargout("ndgrid")'))).toBe('-3\n-3\n-1\n-1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('nargin("all"); nargin("sum"); nargin("cumsum"); nargin("min"); nargin("max"); nargin("mean"); nargin("var"); nargin("std")'),
                ),
            ).toBe('-2\n-2\n-2\n-3\n-3\n-2\n-3\n-3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("all"); nargout("sum"); nargout("min"); nargout("max"); nargout("cummin"); nargout("cummax")'))).toBe(
                '1\n1\n-2\n-2\n-2\n-2\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("struct"); nargout("struct")'))).toBe('-1\n1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('nargin("eye"); nargin("transpose"); nargin("ctranspose"); nargin("diag"); nargin("trace"); nargin("det"); nargin("inv"); nargin("gauss")'),
                ),
            ).toBe('-2\n1\n1\n-3\n1\n1\n1\n2\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'nargin("plus"); nargin("minus"); nargin("times"); nargin("mtimes"); nargin("rdivide"); nargin("mrdivide"); nargin("mldivide"); nargin("mpower"); nargin("lt"); nargin("uplus"); nargin("uminus"); nargin("not")',
                    ),
                ),
            ).toBe('-2\n2\n-2\n-2\n2\n2\n2\n2\n2\n1\n1\n1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('mrdivide([2, 4; 6, 8], [2, 0; 0, 4]); mldivide([2, 0; 0, 4], [2, 8; 6, 16]); mpower([1, 1; 0, 1], 3); ctranspose([1+2i, 3])'),
                ),
            ).toBe('[1,1;\n3,2]\n[1,4;\n1.5,4]\n[1,3;\n0,1]\n[1-2i;\n3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("lu"); nargin("dot"); nargin("cross"); nargin("kron"); nargin("qr"); nargin("eig")'))).toBe(
                '1\n-3\n-3\n2\n1\n1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("lu"); nargout("qr"); nargout("eig"); nargout("dot"); nargout("kron")'))).toBe('-3\n-3\n-3\n1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("configure"); nargout("configure"); nargin("getconfig"); nargout("getconfig")'))).toBe('-2\n1\n-1\n1\n');
        });

        it('Should derive built-in function arity from overloaded signatures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.defineBuiltInFunction('sigfixedoverload', (...args: NodeInput[]) => args[0], false, [], {
                inputs: [{ arity: 1 }, { arity: 3 }],
                outputs: [{ arity: 1 }, { arity: 2 }],
            });
            localInterpreter.context.defineBuiltInFunction('sigboundedrange', (...args: NodeInput[]) => args[0], false, [], {
                inputs: { arity: -4, min: 2, max: 4 },
                outputs: { arity: -3, min: 1, max: 3 },
            });
            localInterpreter.context.defineBuiltInFunction('sigunboundedvarargin', (...args: NodeInput[]) => args[0], false, [], {
                inputs: [{ arity: 0 }, { arity: -3, min: 2, parameters: [{ name: 'a' }, { name: 'b' }, { name: 'rest', variadic: true }] }],
                outputs: { arity: -2 },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sigfixedoverload"); nargout("sigfixedoverload")'))).toBe('-3\n-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sigboundedrange"); nargout("sigboundedrange")'))).toBe('-4\n-3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sigunboundedvarargin"); nargout("sigunboundedvarargin")'))).toBe('-3\n-2\n');
        });

        it('Should validate built-in input counts from signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('class()')).toThrow('Invalid call to class.');
            expect(() => localInterpreter.Execute('localfunctions(1)')).toThrow('Invalid call to localfunctions.');
            expect(() => localInterpreter.Execute('feval()')).toThrow('Invalid call to feval.');
            expect(() => localInterpreter.Execute('eval()')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('eval("1", "2", "3")')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('evalc()')).toThrow('Invalid call to evalc.');
            expect(() => localInterpreter.Execute('evalc("1", "2", "3")')).toThrow('Invalid call to evalc.');
            expect(() => localInterpreter.Execute('evalin("base")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('evalin("base", "1", "2", "3")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("base", "x")')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('nargin(1, 2)')).toThrow('Invalid call to nargin.');
            expect(() => localInterpreter.Execute('dbstack(1, "-completenames", 2)')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('sin()')).toThrow('Invalid call to sin.');
            expect(() => localInterpreter.Execute('sin(1, 2)')).toThrow('Invalid call to sin.');
            expect(() => localInterpreter.Execute('logb(2)')).toThrow('Invalid call to logb.');
            expect(() => localInterpreter.Execute('logb(2, 10, 3)')).toThrow('Invalid call to logb.');
            expect(() => localInterpreter.Execute('isempty()')).toThrow('Invalid call to isempty.');
            expect(() => localInterpreter.Execute('isempty(1, 2)')).toThrow('Invalid call to isempty.');
            expect(() => localInterpreter.Execute('size()')).toThrow('Invalid call to size.');
            expect(() => localInterpreter.Execute('numel()')).toThrow('Invalid call to numel.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2])')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2])')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('randi()')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('reshape([1, 2])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('repmat(1)')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('squeeze()')).toThrow('Invalid call to squeeze.');
            expect(() => localInterpreter.Execute('squeeze(1, 2)')).toThrow('Invalid call to squeeze.');
            expect(() => localInterpreter.Execute('colon(1)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon(1, 2, 3, 4)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('linspace(1)')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('linspace(1, 2, 3, 4)')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('logspace(1)')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('meshgrid()')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('meshgrid(1, 2, 3, 4)')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('ndgrid()')).toThrow('Invalid call to ndgrid.');
            expect(() => localInterpreter.Execute('cat(1)')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('sum()')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('sum(1, 2, 3)')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('cumsum()')).toThrow('Invalid call to cumsum.');
            expect(() => localInterpreter.Execute('max()')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('max(1, [], 1, 2)')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('mean()')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('var(1, 0, 1, 2)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('struct(1, 2)')).toThrow('Invalid call to struct.');
            expect(() => localInterpreter.Execute('eye(1, 2, 3)')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('diag()')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1], 0, 1, 2)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('trace()')).toThrow('Invalid call to trace.');
            expect(() => localInterpreter.Execute('det(1, 2)')).toThrow('Invalid call to det.');
            expect(() => localInterpreter.Execute('gauss([1])')).toThrow('Invalid call to gauss.');
            expect(() => localInterpreter.Execute('dot([1], [1], 1, 2)')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('cross([1], [1], 1, 2)')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('kron([1])')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('qr()')).toThrow('Invalid call to qr.');
            expect(() => localInterpreter.Execute('eig([1], 2)')).toThrow('Invalid call to eig.');
            expect(() => localInterpreter.Execute('configure(1, 2, 3)')).toThrow('Invalid call to configure.');
            expect(() => localInterpreter.Execute('getconfig(1, 2)')).toThrow('Invalid call to getconfig.');
        });

        it('Should validate built-in input parameter classes from signatures.', () => {
            const localInterpreter = Interpreter.Create();
            const alternativeSignature: BuiltInFunctionSignature = {
                inputs: {
                    arity: 1,
                    parameters: [
                        {
                            name: 'value',
                            classes: ['char', 'string'],
                            alternatives: [
                                { name: 'scalar', classes: ['double'], validators: ['scalar'] },
                                { name: 'vector', classes: ['double'], validators: ['vector'] },
                            ],
                        },
                    ],
                },
                outputs: { arity: 1 },
            };
            localInterpreter.context.defineBuiltInFunction('sigalt', (...args: NodeInput[]) => args[0], false, [], alternativeSignature);

            expect(localInterpreter.Unparse(localInterpreter.Execute('sigalt("x"); sigalt(1); sigalt([1, 2])'))).toBe('x\n1\n[1,2]\n');
            expect(() => localInterpreter.Execute('sigalt([1, 2; 3, 4])')).toThrow('Invalid call to sigalt.');
            localInterpreter.context.defineBuiltInFunction('signormalized', (...args: NodeInput[]) => args[0], false, [], {
                inputs: {
                    arity: 1,
                    parameters: [
                        {
                            name: 'dimension',
                            classes: ['double'],
                            validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative', 'dimension', 'positive'],
                        },
                    ],
                },
                outputs: { arity: 1 },
            });
            expect(localInterpreter.Unparse(localInterpreter.Execute('signormalized(2)'))).toBe('2\n');
            expect(() => localInterpreter.Execute('signormalized(0)')).toThrow('Invalid call to signormalized.');
            expect(() => localInterpreter.Execute('signormalized(2.5)')).toThrow('Invalid call to signormalized.');
            expect(() => localInterpreter.Execute('signormalized([1, 2])')).toThrow('Invalid call to signormalized.');
            expect(() => localInterpreter.Execute('isa(1, 2)')).toThrow('Invalid call to isa.');
            expect(() => localInterpreter.Execute('func2str("sin")')).toThrow('Invalid call to func2str.');
            expect(() => localInterpreter.Execute('str2func(1)')).toThrow('Invalid call to str2func.');
            expect(() => localInterpreter.Execute('functions("sin")')).toThrow('Invalid call to functions.');
            expect(() => localInterpreter.Execute('eval(1)')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('eval("1", 2)')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('evalin(1, "1")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('evalin("base", 1)')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("base", 1, 2)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('inputname("1")')).toThrow('Invalid call to inputname.');
            expect(() => localInterpreter.Execute('narginchk(-1, 2)')).toThrow('Invalid call to narginchk.');
            expect(() => localInterpreter.Execute('narginchk(0.5, 2)')).toThrow('Invalid call to narginchk.');
            expect(() => localInterpreter.Execute('nargoutchk(0, -1)')).toThrow('Invalid call to nargoutchk.');
            expect(() => localInterpreter.Execute('nargoutchk(0, 1.5)')).toThrow('Invalid call to nargoutchk.');
            expect(() => localInterpreter.Execute('dbstack(-1)')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('dbstack(1.5)')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('dbstack("bad")')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('evalin("unknown", "1")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("unknown", "x", 1)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('assignin("base", "bad-name", 1)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('sin("x")')).toThrow('Invalid call to sin.');
            expect(() => localInterpreter.Execute('logb("x", 2)')).toThrow('Invalid call to logb.');
            expect(() => localInterpreter.Execute('hypot(3, "x")')).toThrow('Invalid call to hypot.');
            expect(() => localInterpreter.Execute('size([1, 2], "1")')).toThrow('Invalid call to size.');
            expect(() => localInterpreter.Execute('find("x")')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], "1")')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], 1.5)')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], -1)')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], 1, "middle")')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('sort("x")')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], 0)')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], 1.5)')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], "up")')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], 1, "up")')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('ind2sub("bad", 1)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2; 3, 3], 1)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2], 0)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2], 1.5)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2], [1, 2.5])')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], "1")')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2; 3, 3], 1, 1)')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], 0, 1)')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], 1.5, 1)')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], [1, 2.5], [1, 2])')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('zeros("2")')).toThrow('Invalid call to zeros.');
            expect(() => localInterpreter.Execute('ones(2, "3")')).toThrow('Invalid call to ones.');
            expect(() => localInterpreter.Execute('rand("2")')).toThrow('Invalid call to rand.');
            expect(() => localInterpreter.Execute('zeros(1.5)')).toThrow('Invalid call to zeros.');
            expect(() => localInterpreter.Execute('ones(-1)')).toThrow('Invalid call to ones.');
            expect(() => localInterpreter.Execute('rand([1, 2; 3, 4])')).toThrow('Invalid call to rand.');
            expect(() => localInterpreter.Execute('randi("10")')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi(2.5)')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi([1, 5, 9])')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi([1.5, 5])')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi(5, [1, 2; 3, 4])')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi(5, 1.5)')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('reshape([1, 2], "2")')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('reshape([1, 2], [1, 2; 3, 4])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('reshape([1, 2], 1.5, [])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('reshape([1, 2], -1, [])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('repmat(1, "2")')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('repmat(1, [1, 2; 3, 4])')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('repmat(1, 1.5, 2)')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('repmat(1, [])')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('colon("1", 2)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon([1, 2], 3)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon(1, [2, 3])')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon(1, 2, [3, 4])')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon([1, 2; 3, 4], 5)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('linspace(1, 2, "3")')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('linspace([1, 2; 3, 4], 5)')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('linspace(1, [2, 3; 4, 5])')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('logspace(1, "2")')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('logspace([1, 2; 3, 4], 5)')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('logspace(1, [2, 3; 4, 5])')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('cat("1", [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('cat(1.5, [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('cat(0, [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('cat(-1, [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('sum([1, 2], "2")')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('all([1, 2], 0)')).toThrow('Invalid call to all.');
            expect(() => localInterpreter.Execute('any([1, 2], -1)')).toThrow('Invalid call to any.');
            expect(() => localInterpreter.Execute('sum([1, 2], 1.5)')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('prod([1, 2], [1, 2])')).toThrow('Invalid call to prod.');
            expect(() => localInterpreter.Execute('sumsq([1, 2], [])')).toThrow('Invalid call to sumsq.');
            expect(() => localInterpreter.Execute('cumsum([1, 2], "2")')).toThrow('Invalid call to cumsum.');
            expect(() => localInterpreter.Execute('cumprod([1, 2], 0)')).toThrow('Invalid call to cumprod.');
            expect(() => localInterpreter.Execute('max([1, 2], [], "2")')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('min([1, 2], 1, 2)')).toThrow('Invalid call to min.');
            expect(() => localInterpreter.Execute('min([1, 2], [], 0)')).toThrow('Invalid call to min.');
            expect(() => localInterpreter.Execute('max([1, 2], [], 1.5)')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('cummin([1, 2], [])')).toThrow('Invalid call to cummin.');
            expect(() => localInterpreter.Execute('cummax([1, 2], -1)')).toThrow('Invalid call to cummax.');
            expect(() => localInterpreter.Execute('mean([1, 2], "2")')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('mean([1, 2], 0)')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('mean([1, 2], 1.5)')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('var([1, 2], "0")')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('var([1, 2], 0.5)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('var([1, 2], 0, 0)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('var([1, 2], 0, 1.5)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('std([1, 2], 0, "2")')).toThrow('Invalid call to std.');
            expect(() => localInterpreter.Execute('std([1, 2], 1, -1)')).toThrow('Invalid call to std.');
            expect(() => localInterpreter.Execute('struct("a", 1, 2, 3)')).toThrow('Invalid call to struct.');
            expect(() => localInterpreter.Execute('meshgrid("x")')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('meshgrid([1, 2; 3, 4])')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('ndgrid("x")')).toThrow('Invalid call to ndgrid.');
            expect(() => localInterpreter.Execute('ndgrid([1, 2; 3, 4])')).toThrow('Invalid call to ndgrid.');
            expect(() => localInterpreter.Execute('eye("2")')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('eye([1, 2, 3])')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('eye(1.5)')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('eye(-1)')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('diag([1], "0")')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1], 0.5)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1, 2], 2, 1.5)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1, 2; 3, 4], 2, 2)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('uplus(1, 2)')).toThrow('Invalid call to uplus.');
            expect(() => localInterpreter.Execute('trace("x")')).toThrow('Invalid call to trace.');
            expect(() => localInterpreter.Execute('trace(reshape(1:8, 2, 2, 2))')).toThrow('Invalid call to trace.');
            expect(() => localInterpreter.Execute('det("x")')).toThrow('Invalid call to det.');
            expect(() => localInterpreter.Execute('det([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to det.');
            expect(() => localInterpreter.Execute('inv("x")')).toThrow('Invalid call to inv.');
            expect(() => localInterpreter.Execute('inv([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to inv.');
            expect(() => localInterpreter.Execute('gauss([1], "x")')).toThrow('Invalid call to gauss.');
            expect(() => localInterpreter.Execute('gauss([1, 2, 3; 4, 5, 6], [1; 2])')).toThrow('Invalid call to gauss.');
            expect(() => localInterpreter.Execute('dot([1], "x")')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('dot([1], [1], 0)')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('dot([1], [1], 1.5)')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('dot([1], [1], [])')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], "1")')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], 0)')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], 1.5)')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], [])')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('kron([1], "x")')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('kron(reshape(1:8, 2, 2, 2), [1])')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('kron([1], reshape(1:8, 2, 2, 2))')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('qr("x")')).toThrow('Invalid call to qr.');
            expect(() => localInterpreter.Execute('qr(reshape(1:8, 2, 2, 2))')).toThrow('Invalid call to qr.');
            expect(() => localInterpreter.Execute('eig("x")')).toThrow('Invalid call to eig.');
            expect(() => localInterpreter.Execute('eig([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to eig.');
            expect(() => localInterpreter.Execute('test([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to test.');
            expect(() => localInterpreter.Execute('norm("x")')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], "bad")')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], 0)')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], -1)')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], [1, 2])')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2; 3, 4], -inf)')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('cond([1, 2], 1)')).toThrow('Invalid call to cond.');
            expect(() => localInterpreter.Execute('cond([1, 2; 3, 4], -inf)')).toThrow('Invalid call to cond.');
            expect(() => localInterpreter.Execute('rank([1, 2; 3, 4], -1)')).toThrow('Invalid call to rank.');
            expect(() => localInterpreter.Execute('configure(1, 2)')).toThrow('Invalid call to configure.');
            expect(() => localInterpreter.Execute('getconfig(123)')).toThrow('Invalid call to getconfig.');
            expect(() => localInterpreter.Execute('feval(123, 1)')).toThrow('Invalid call to feval.');
            expect(() => localInterpreter.Execute('feval("which", 1)')).toThrow('Invalid call to which.');
            expect(() => localInterpreter.Execute('exist(1)')).toThrow('Invalid call to exist.');
        });

        it('Should use core function signatures for dimension and shape helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty([]); isscalar(1); isvector([1, 2]); isrow([1, 2]); iscolumn([1; 2])'))).toBe('true\ntrue\ntrue\ntrue\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('size([1, 2; 3, 4]); size([1, 2; 3, 4], 1); size([1, 2; 3, 4], [1, 2])'))).toBe('[2,2]\n2\n[2,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = reshape(1:24, 2, 3, 4); [m, n] = size(A); [p, q, r, s] = size(A); m; n; p; q; r; s'))).toBe(
                'A=[1,3,5;\n2,4,6] (:,:,1)\n[7,9,11;\n8,10,12] (:,:,2)\n[13,15,17;\n14,16,18] (:,:,3)\n[19,21,23;\n20,22,24] (:,:,4)\n\nm=2\nn=12\np=2\nq=3\nr=4\ns=1\n2\n12\n2\n3\n4\n1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('numel([1, 2; 3, 4]); ndims([1, 2; 3, 4]); rows([1, 2; 3, 4]); columns([1, 2; 3, 4]); length([1; 2; 3])'))).toBe(
                '4\n2\n2\n2\n3\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[r, c] = ind2sub([2, 3], 5); sub2ind([2, 3], r, c)'))).toBe('r=1\nc=3\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, c] = ind2sub([2, 3], 5); c'))).toBe('c=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('find([0, 4, 0; 5, 0, 6]); find([0, 4, 0; 5, 0, 6], 2); find([0, 4, 0; 5, 0, 6], 2, "last")'))).toBe(
                '[2;\n3;\n6]\n[2;\n3]\n[3;\n6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[i, j, v] = find([0, 4, 0; 5, 0, 6]); i; j; v'))).toBe(
                'i=[2;\n1;\n2]\nj=[1;\n2;\n3]\nv=[5;\n4;\n6]\n[2;\n1;\n2]\n[1;\n2;\n3]\n[5;\n4;\n6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, j, v] = find([0, 4; 5, 0]); j; v'))).toBe('j=[1;\n2]\nv=[5;\n4]\n[1;\n2]\n[5;\n4]\n');
            expect(() => localInterpreter.Execute('[i, j, v, extra] = find([0, 4, 0; 5, 0, 6])')).toThrow('element number 4 undefined in return list');
            expect(localInterpreter.Unparse(localInterpreter.Execute('issparse([1, 0]); nnz([0, 4, 0; 5, 0, 6]); nzmax([0, 4, 0; 5, 0, 6]); nonzeros([0, 4, 0; 5, 0, 6])'))).toBe(
                'false\n3\n3\n[5;\n4;\n6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('full([1, 0]); sparse([1, 0; 0, 2]); sparse(2, 3); sparse([1, 2, 2], [1, 2, 2], [4, 5, 6], 2, 2)'))).toBe(
                '[1,0]\n[1,0;\n0,2]\n[0,0,0;\n0,0,0]\n[4,0;\n0,11]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('spalloc(2, 3, 5); islogical(spalloc(1, 2, 0, "logical")); issparse(spalloc(2, 3, 5)); nzmax(spalloc(2, 3, 5))'))).toBe(
                '[0,0,0;\n0,0,0]\ntrue\nfalse\n0\n',
            );
            expect(
                localInterpreter.Unparse(localInterpreter.Execute('spfun(@(x) x + 10, [0, 2; 3, 0]); spfun(@(x) 0, [0, 2; 3, 0]); spfun(@(x) x * x, sparse([1, 2], [1, 2], [4, 5], 2, 2))')),
            ).toBe('[0,12;\n13,0]\n[0,0;\n0,0]\n[16,0;\n0,25]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('sort([3, 1, 2]); sort([3, 1, 2], "descend"); A = [3, 1; 2, 4]; sort(A); sort(A, 2)'))).toBe(
                '[1,2,3]\n[3,2,1]\nA=[3,1;\n2,4]\n[2,1;\n3,4]\n[1,3;\n2,4]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[B, I] = sort([30, 10, 20]); B; I; [C, J] = sort([3, 1; 2, 4], 2, "descend"); C; J'))).toBe(
                'B=[10,20,30]\nI=[2,3,1]\n[10,20,30]\n[2,3,1]\nC=[3,1;\n4,2]\nJ=[1,2;\n2,1]\n[3,1;\n4,2]\n[1,2;\n2,1]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, I] = sort([30, 10, 20]); I'))).toBe('I=[2,3,1]\n[2,3,1]\n');
            expect(() => localInterpreter.Execute('[B, I, extra] = sort([30, 10, 20])')).toThrow('element number 3 undefined in return list');
        });

        it('Should use core function signatures for array creation and reshaping helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('zeros(); ones(2); zeros(2, 3); ones([1, 3])'))).toBe('0\n[1,1;\n1,1]\n[0,0,0;\n0,0,0]\n[1,1,1]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cell(); cell(1, 2); C = cell(1, 1); C{1} = 5; C; size(cell([2, 0])); nargin("cell"); nargout("cell")'))).toBe(
                '{ }(0x0)\n{[ ](0x0),[ ](0x0)}\nC=({[ ](0x0)})\nC=({5})\n{5}\n[2,0]\n-1\n1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('C = num2cell([1, 2; 3, 4]); C; [C{:}]; D = num2cell([1, 2; 3, 4], 1); size(D); D{1}; E = num2cell("ab"); E'))).toBe(
                'C={1,2;\n3,4}\n{1,2;\n3,4}\n[1,3,2,4]\nD={[1;\n3],[2;\n4]}\n[1,2]\n[1;\n3]\nE={a,b}\n{a,b}\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute("cell2mat(C); cell2mat(D); cell2mat({[1, 2], [3, 4]; [5, 6], [7, 8]}); cell2mat({'ab'; 'cd'})"))).toBe(
                '[1,2;\n3,4]\n[1,2;\n3,4]\n[1,2,3,4;\n5,6,7,8]\n[a,b;\nc,d]\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'M = mat2cell([1, 2; 3, 4], [1, 1], [1, 1]); M; M{1, 1}; M{2, 2}; N = mat2cell([1, 2; 3, 4], 2, [1, 1]); N; N{1}; N{2}; T = mat2cell("abcd", 1, [2, 2]); T',
                    ),
                ),
            ).toBe('M={1,2;\n3,4}\n{1,2;\n3,4}\n1\n4\nN={[1;\n3],[2;\n4]}\n{[1;\n3],[2;\n4]}\n[1;\n3]\n[2;\n4]\nT={[a,b],[c,d]}\n{[a,b],[c,d]}\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('nargin("num2cell"); nargout("num2cell"); nargin("cell2mat"); nargout("cell2mat"); nargin("mat2cell"); nargout("mat2cell")'),
                ),
            ).toBe('-2\n1\n1\n1\n-2\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('zeros([2; 1]); size(ones([1; 3])); size(rand([2; 3]))'))).toBe('[0;\n0]\n[1,3]\n[2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('size(randi(5)); size(randi(5, 2)); size(randi([2, 5], [2; 3])); size(randi([2; 5], 1, 2))'))).toBe(
                '[1,1]\n[2,2]\n[2,3]\n[1,2]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('reshape([1, 2, 3, 4], 2, 2); reshape([1, 2, 3, 4], [2, 2]); reshape(1:6, 2, []); reshape(1:6, [], 3)'))).toBe(
                '[1,3;\n2,4]\n[1,3;\n2,4]\n[1,3,5;\n2,4,6]\n[1,3,5;\n2,4,6]\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'R = reshape({1, 2, 3, 4}, [1, 2, 2]); size(R); R{1, 2, 2}; B = reshape({[1, 2], [3, 4], [5, 6], [7, 8]}, [1, 2, 2]); M = cell2mat(B); size(M); M',
                    ),
                ),
            ).toBe(
                'R={1,2} (:,:,1)\n{3,4} (:,:,2)\n\n[1,2,2]\n4\nB={[1,2],[3,4]} (:,:,1)\n{[5,6],[7,8]} (:,:,2)\n\nM=[1,2,3,4] (:,:,1)\n[5,6,7,8] (:,:,2)\n\n[1,4,2]\n[1,2,3,4] (:,:,1)\n[5,6,7,8] (:,:,2)\n\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('repmat(5, 1, 3); repmat([1, 2], 2, 1); repmat(5, [1; 3]); squeeze(reshape([1, 2], 1, 1, 2))'))).toBe(
                '[5,5,5]\n[1,2;\n1,2]\n[5,5,5]\n[1;\n2]\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('C = reshape({1, 2}, [1, 1, 2]); S = squeeze(C); size(S); S; S{2}; D = reshape({1, 2, 3, 4}, [1, 2, 2]); T = squeeze(D); size(T); T; T{2, 2}'),
                ),
            ).toBe('C={1} (:,:,1)\n{2} (:,:,2)\n\nS={1;\n2}\n[2,1]\n{1;\n2}\n2\nD={1,2} (:,:,1)\n{3,4} (:,:,2)\n\nT={1,2;\n3,4}\n[2,2]\n{1,2;\n3,4}\n4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = reshape(1:6, [1, 2, 3]); B = permute(A, [2, 1, 3]); size(B); B; C = ipermute(B, [2, 1, 3]); size(C); C'))).toBe(
                'A=[1,2] (:,:,1)\n[3,4] (:,:,2)\n[5,6] (:,:,3)\n\nB=[1;\n2] (:,:,1)\n[3;\n4] (:,:,2)\n[5;\n6] (:,:,3)\n\n[2,1,3]\n[1;\n2] (:,:,1)\n[3;\n4] (:,:,2)\n[5;\n6] (:,:,3)\n\nC=[1,2] (:,:,1)\n[3,4] (:,:,2)\n[5,6] (:,:,3)\n\n[1,2,3]\n[1,2] (:,:,1)\n[3,4] (:,:,2)\n[5,6] (:,:,3)\n\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'C = reshape({1, 2, 3, 4}, [1, 2, 2]); P = permute(C, [2, 1, 3]); size(P); P; P{2, 1, 2}; Q = ipermute(P, [2, 1, 3]); size(Q); Q{1, 2, 2}; nargin("permute"); nargout("permute"); nargin("ipermute"); nargout("ipermute")',
                    ),
                ),
            ).toBe(
                'C={1,2} (:,:,1)\n{3,4} (:,:,2)\n\nP={1;\n2} (:,:,1)\n{3;\n4} (:,:,2)\n\n[2,1,2]\n{1;\n2} (:,:,1)\n{3;\n4} (:,:,2)\n\n4\nQ={1,2} (:,:,1)\n{3,4} (:,:,2)\n\n[1,2,2]\n4\n2\n1\n2\n1\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'circshift([1, 2, 3, 4], 1); circshift([1, 2; 3, 4], [1, -1]); circshift([1, 2; 3, 4], 1, 2); C = {1, 2; 3, 4}; S = circshift(C, [1, 1]); S; S{1, 1}',
                    ),
                ),
            ).toBe('[4,1,2,3]\n[4,3;\n2,1]\n[2,1;\n4,3]\nC={1,2;\n3,4}\nS={4,3;\n2,1}\n{4,3;\n2,1}\n4\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'A = reshape(1:4, [1, 2, 2]); [B, n] = shiftdim(A); size(B); n; B; E = shiftdim([1, 2; 3, 4], -1); size(E); F = shiftdim(reshape(1:6, [1, 2, 3]), 1); size(F); F',
                    ),
                ),
            ).toBe('A=[1,2] (:,:,1)\n[3,4] (:,:,2)\n\nB=[1,2;\n3,4]\nn=1\n[2,2]\n1\n[1,2;\n3,4]\nE=[1,2] (:,:,1)\n[3,4] (:,:,2)\n\n[1,2,2]\nF=[1,3,5;\n2,4,6]\n[2,3]\n[1,3,5;\n2,4,6]\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'C = reshape({1, 2, 3, 4}, [1, 2, 2]); [D, n] = shiftdim(C); size(D); n; D; D{2, 2}; nargin("circshift"); nargout("circshift"); nargin("shiftdim"); nargout("shiftdim")',
                    ),
                ),
            ).toBe('C={1,2} (:,:,1)\n{3,4} (:,:,2)\n\nD={1,2;\n3,4}\nn=1\n[2,2]\n1\n{1,2;\n3,4}\n4\n-3\n1\n-2\n-2\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'flip([1, 2, 3]); flip([1, 2; 3, 4]); flip([1, 2; 3, 4], 2); fliplr([1, 2; 3, 4]); flipud([1, 2; 3, 4]); rot90([1, 2; 3, 4]); rot90([1, 2; 3, 4], -1)',
                    ),
                ),
            ).toBe('[3,2,1]\n[3,4;\n1,2]\n[2,1;\n4,3]\n[2,1;\n4,3]\n[3,4;\n1,2]\n[2,4;\n1,3]\n[3,1;\n4,2]\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'C = reshape({1, 2, 3, 4}, [1, 2, 2]); F = flip(C, 3); F; F{1, 2, 1}; R = rot90(C); size(R); R; R{2, 1, 2}; nargin("flip"); nargout("flip"); nargin("rot90"); nargout("rot90")',
                    ),
                ),
            ).toBe(
                'C={1,2} (:,:,1)\n{3,4} (:,:,2)\n\nF={3,4} (:,:,1)\n{1,2} (:,:,2)\n\n{3,4} (:,:,1)\n{1,2} (:,:,2)\n\n4\nR={2;\n1} (:,:,1)\n{4;\n3} (:,:,2)\n\n[2,1,2]\n{2;\n1} (:,:,1)\n{4;\n3} (:,:,2)\n\n3\n-2\n1\n-2\n1\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'C = {1, 2}; R = repmat(C, 2, 1); R; R{2, 2}; G = {1, 2; 3, 4}; H = repmat(G, 1, 2); H; H{2, 4}; P = reshape({1, 2, 3, 4}, [1, 2, 2]); Q = repmat(P, 1, 1, 2); size(Q); Q{1, 2, 4}',
                    ),
                ),
            ).toBe(
                'C={1,2}\nR={1,2;\n1,2}\n{1,2;\n1,2}\n2\nG={1,2;\n3,4}\nH={1,2,1,2;\n3,4,3,4}\n{1,2,1,2;\n3,4,3,4}\n4\nP={1,2} (:,:,1)\n{3,4} (:,:,2)\n\nQ={1,2} (:,:,1)\n{3,4} (:,:,2)\n{1,2} (:,:,3)\n{3,4} (:,:,4)\n\n[1,2,4]\n4\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('size(rand(2, 3)); size(randi(5, 2, 3)); size(randi([2, 5], [2, 3]))'))).toBe('[2,3]\n[2,3]\n[2,3]\n');
            expect(() => localInterpreter.Execute('num2cell([1, 2], 3)')).toThrow('num2cell: DIM must be between 1 and ndims(A).');
            expect(() => localInterpreter.Execute('cell2mat({{1, 2}})')).toThrow('cell2mat: nested cell contents are not supported.');
            expect(() => localInterpreter.Execute('mat2cell([1, 2; 3, 4], [1, 2], [1, 1])')).toThrow('mat2cell: argument 2 dimensions do not sum to input size.');
            expect(() => localInterpreter.Execute('mat2cell([1, 2; 3, 4], [1, 1])')).toThrow('mat2cell: number of dimension vectors must match ndims(A).');
            expect(() => localInterpreter.Execute('permute([1, 2], [1, 1])')).toThrow('permute: ORDER must be a permutation vector.');
            expect(() => localInterpreter.Execute('circshift([1, 2], [1, 2, 3])')).toThrow('circshift: SHIFTS vector must not be longer than ndims(A).');
            expect(() => localInterpreter.Execute('shiftdim([1, 2], 1.5)')).toThrow('Invalid call to shiftdim.');
            expect(() => localInterpreter.Execute('flip([1, 2], 1.5)')).toThrow('Invalid call to flip.');
            expect(() => localInterpreter.Execute('rot90([1, 2], 1.5)')).toThrow('Invalid call to rot90.');
        });

        it('Should use core function signatures for sequence and concatenation helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('colon(1, 4); colon(1, 2, 5); linspace(1, 5, 3); logspace(1, 3, 3)'))).toBe(
                '[1,2,3,4]\n[1,3,5]\n[1,3,5]\n[10,100,1000]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[X, Y] = meshgrid(1:3, 4:5); X; Y; [A, B] = ndgrid(1:2, 3:4); A; B'))).toBe(
                'X=[1,2,3;\n1,2,3]\nY=[4,4,4;\n5,5,5]\n[1,2,3;\n1,2,3]\n[4,4,4;\n5,5,5]\nA=[1,1;\n2,2]\nB=[3,4;\n3,4]\n[1,1;\n2,2]\n[3,4;\n3,4]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, Y] = meshgrid(1:3, 4:5); Y; [~, B] = ndgrid(1:2, 3:4); B'))).toBe(
                'Y=[4,4,4;\n5,5,5]\n[4,4,4;\n5,5,5]\nB=[3,4;\n3,4]\n[3,4;\n3,4]\n',
            );
            expect(() => localInterpreter.Execute('[X, Y, Z, W] = meshgrid(1:3)')).toThrow('element number 4 undefined in return list');
            expect(() => localInterpreter.Execute('[A, B, C] = ndgrid(1:2, 3:4)')).toThrow('element number 3 undefined in return list');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cat(1, [1, 2], [3, 4]); horzcat([1; 2], [3; 4]); vertcat([1, 2], [3, 4])'))).toBe(
                '[1,2;\n3,4]\n[1,3;\n2,4]\n[1,2;\n3,4]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('cat(3, [1, 2], [3, 4]); horzcat(); vertcat()'))).toBe('[1,2] (:,:,1)\n[3,4] (:,:,2)\n\n[ ](0x0)\n[ ](0x0)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s1 = struct("a", 1, "b", 2); s2 = struct("b", 4, "a", 3); ss = [s1, s2]; ss.a'))).toBe(
                's1=struct {\na: 1\nb: 2\n}\ns2=struct {\nb: 4\na: 3\n}\nss=[struct {\na: 1\nb: 2\n},struct {\nb: 4\na: 3\n}]\n1\n3\n',
            );
            expect(() => localInterpreter.Execute('[struct("a", 1), struct("b", 2)]')).toThrow('structure arrays must contain structures with the same fields.');
            expect(() => localInterpreter.Execute('horzcat(struct("a", 1), struct("b", 2))')).toThrow('horzcat: structure arrays must contain structures with the same fields.');
            expect(() => localInterpreter.Execute('vertcat(struct("a", 1), struct("b", 2))')).toThrow('vertcat: structure arrays must contain structures with the same fields.');
            expect(() => localInterpreter.Execute('cat(3, struct("a", 1), struct("b", 2))')).toThrow('cat: structure arrays must contain structures with the same fields.');
        });

        it('Should use core function signatures for reduction and accumulation helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; all(A); all(A, 2); any([0, 1; 0, 0])'))).toBe(
                'A=[1,2;\n3,4]\n[true,true]\n[true;\ntrue]\n[false,true]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; sum(A); sum(A, 2); prod(A); sumsq([1, 2, 3]); cumsum([1, 2, 3]); cumprod([1, 2, 3])'))).toBe(
                'A=[1,2;\n3,4]\n[4,6]\n[3;\n7]\n[3,8]\n14\n[1,3,6]\n[1,2,6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; max(A); min(A, [], 2); [m, idx] = max(A); m; idx'))).toBe(
                'A=[1,2;\n3,4]\n[3,4]\n[1;\n3]\nm=[3,4]\nidx=[2,2]\n[3,4]\n[2,2]\n',
            );
            expect(
                localInterpreter.Unparse(localInterpreter.Execute('A = [3, 1; 2, 4]; max(A, [], 2); min(A, [2, 2; 2, 2]); [v, idx] = cummin(A); v; idx; [w, j] = cummax(A, 2); w; j')),
            ).toBe('A=[3,1;\n2,4]\n[3;\n4]\n[2,1;\n2,2]\nv=[3,1;\n2,1]\nidx=[1,1;\n2,1]\n[3,1;\n2,1]\n[1,1;\n2,1]\nw=[3,3;\n2,4]\nj=[1,1;\n1,2]\n[3,3;\n2,4]\n[1,1;\n1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; mean(A); mean(A, 2); var([1, 2, 3]); std([1, 2, 3])'))).toBe(
                'A=[1,2;\n3,4]\n[2,3]\n[1.5;\n3.5]\n[1]\n[1]\n',
            );
        });

        it('Should use core function signatures for struct construction.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('s = struct(); t = struct("a", 1, "b", [2, 3]); t.a; t.b'))).toBe(
                's=struct {\n\n}\nt=struct {\na: 1\nb: [2,3]\n}\n1\n[2,3]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('u = struct(t); u.a; u.b'))).toBe('u=struct {\na: 1\nb: [2,3]\n}\n1\n[2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("struct"); nargout("struct")'))).toBe('-1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("isfield"); nargout("isfield")'))).toBe('2\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('S.a.b = 5; getfield(S, "a", "b"); T = setfield(S, "c", 7); T.c; isfield(S, "c")'))).toBe(
                'S=struct {\na: struct {\nb: 5\n}\n}\n5\nT=struct {\na: struct {\nb: 5\n}\nc: 7\n}\n7\nfalse\n',
            );
            expect(
                localInterpreter.Unparse(localInterpreter.Execute('R = rmfield(T, {"a"}); isfield(R, "a"); R.c; O = orderfields(struct("b", 2, "a", 1)); fieldnames(O); numfields(O)')),
            ).toBe('R=struct {\nc: 7\n}\nfalse\n7\nO=struct {\na: 1\nb: 2\n}\n{a;\nb}\n2\n');
            const structureArrayInterpreter = Interpreter.Create();
            expect(structureArrayInterpreter.Unparse(structureArrayInterpreter.Execute('S(1).x = 1; S(2).x = 2; [getfield(S, "x")]'))).toBe(
                'S=[struct {\nx: 1\n}]\nS=[struct {\nx: 1\n},struct {\nx: 2\n}]\n[1,2]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('C = struct2cell(struct("a", 1, "b", 2)); C; size(C); U = cell2struct({1, 2}, {"a", "b"}, 2); U.a; U.b'))).toBe(
                'C={1;\n2}\n{1;\n2}\n[2,1]\nU=struct {\na: 1\nb: 2\n}\n1\n2\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('C = {1, 2; 3, 4}; V = cell2struct(C, {"a", "b"}, 2); [V.a]; [V.b]; W = struct2cell(V); size(W)'))).toBe(
                'C={1,2;\n3,4}\nV=[struct {\na: 1\nb: 2\n};\nstruct {\na: 3\nb: 4\n}]\n[1,3]\n[2,4]\nW={1,3;\n2,4}\n[2,2]\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'nargin("getfield"); nargin("setfield"); nargin("rmfield"); nargin("orderfields"); nargin("numfields"); nargin("struct2cell"); nargin("cell2struct")',
                    ),
                ),
            ).toBe('-2\n-3\n2\n1\n1\n1\n3\n');
            expect(() => localInterpreter.Execute('struct(@sin)')).toThrow('Invalid call to struct.');
            expect(() => localInterpreter.Execute('getfield(S, 1)')).toThrow('getfield: argument 2 must be a string.');
            expect(() => localInterpreter.Execute('cell2struct({1, 2, 3}, {"a", "b"}, 2)')).toThrow('cell2struct: number of fields does not match dimension.');
        });

        it('Should expose core type predicate functions.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'ischar("abc"); ischar(\'abc\'); ischar([\'a\';\'b\']); isstring("abc"); isstring(\'abc\'); isstring(["a","b"]); ischar(["a","b"]); isnumeric([1, 2]); isnumeric(true); islogical([true, false]); isreal(true); isreal(1 + 2i); isreal([1, 2])',
                    ),
                ),
            ).toBe('false\ntrue\ntrue\ntrue\nfalse\ntrue\nfalse\ntrue\nfalse\ntrue\ntrue\nfalse\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("ischar"); nargin("isstring"); nargin("isnumeric"); nargin("islogical"); nargin("isreal")'))).toBe(
                '1\n1\n1\n1\n1\n',
            );
        });

        it('Should use linear algebra function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'A = [1, 2; 3, 4]; eye(); eye(2); eye(2, 3); eye([1; 2]); transpose(A); ctranspose(1 + 2i); transpose("ab"); diag([1, 2, 3]); diag([1, 2, 3], 1); diag([1, 2], 2, 3); diag(A); trace(A); det(A); inv(A)',
                    ),
                ),
            ).toBe(
                'A=[1,2;\n3,4]\n1\n[1,0;\n0,1]\n[1,0,0;\n0,1,0]\n[1,0]\n[1,3;\n2,4]\n1-2i\n[a;\nb]\n[1,0,0;\n0,2,0;\n0,0,3]\n[0,1,0;\n0,0,2;\n0,0,0]\n[1,0,0;\n0,2,0]\n[1;\n4]\n5\n-2\n[-2,1;\n1.5,-0.5]\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'plus(1, 2, 3); minus(5, 2); times([1, 2], [3, 4]); mtimes([1, 2; 3, 4], [1; 1]); rdivide([2, 4], 2); ldivide(2, [2, 4]); power([2, 3], 2); lt([1, 2], [2, 1]); uplus(-3); uminus(3); not([true, false])',
                    ),
                ),
            ).toBe('6\n3\n[3,8]\n[3;\n7]\n[1,2]\n[1,2]\n[4,9]\n[true,false]\n-3\n-3\n[false,true]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; [L, U, P] = lu(A); L; U; P'))).toBe(
                'A=[1,2;\n3,4]\nL=[1,0;\n0.333333333333333333,1]\nU=[3,4;\n0,0.666666666666666666]\nP=[0,1;\n1,0]\n[1,0;\n0.333333333333333333,1]\n[3,4;\n0,0.666666666666666666]\n[0,1;\n1,0]\n',
            );
            expect(() => localInterpreter.Execute('[L, U, P, extra] = lu(A)')).toThrow('element number 4 undefined in return list');
            expect(localInterpreter.Unparse(localInterpreter.Execute('dot([1, 2, 3], [4, 5, 6]); cross([1, 0, 0], [0, 1, 0]); kron([1, 2], [3; 4]); kron(2, [3, 4])'))).toBe(
                '32\n[0,0,1]\n[3,6;\n4,8]\n[6,8]\n',
            );
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'norm([3, 4]); norm([1, -2, 3], 1); norm([1, -2, 3], inf); norm([1, -2, 3], -inf); norm([1, 2; 3, 4], 1); norm([1, 2; 3, 4], inf); norm([3, 0; 0, 4]); norm([3, 0; 0, 4], 2); norm([1, 2; 3, 4], "fro"); cond([1, 2; 3, 4], 1); cond([1, 2; 3, 4], inf); cond([1, 2; 3, 4], "fro"); cond([1, 0]); rank([3, 2, 4; -1, 1, 2; 9, 5, 10]); rank([10, 0, 0, 0; 0, 25, 0, 0; 0, 0, 34, 0; 0, 0, 0, 1e-15]); rank([10, 0, 0, 0; 0, 25, 0, 0; 0, 0, 34, 0; 0, 0, 0, 1e-15], 1e-16)',
                    ),
                ),
            ).toBe('5\n6\n3\n1\n6\n7\n4\n4\n5.477225575051661134\n21\n21\n15\n1\n2\n3\n4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; [Q, R] = qr(A); size(Q); size(R); [V, D] = eig([2, 1; 1, 2]); size(V); D'))).toBe(
                'A=[1,2;\n3,4]\nQ=[-0.31622776601683793,-0.94868329805051379;\n-0.94868329805051379,0.316227766016837933]\nR=[-3.16227766016837933,-4.42718872423573106;\n0,-0.63245553203367586]\n[2,2]\n[2,2]\nV=[0.707106781186547524,0.707106781186547524;\n-0.70710678118654752,0.707106781186547524]\nD=[1,0;\n0,3]\n[2,2]\n[1,0;\n0,3]\n',
            );
        });

        it('Should use configuration function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('getconfig("precision"); configure("precision", 34); getconfig("precision"); configure()'))).toBe(
                "{precision,336}\nConfiguration parameter 'precision' set to '34'\n{precision,34}\nAll configuration set to default values.\n",
            );
        });

        it('Should provide signatures for all registered built-in functions.', () => {
            const localInterpreter = Interpreter.Create();
            const missingSignatures = localInterpreter.context.builtInFunctionList.filter((name: string) => !localInterpreter.context.builtInFunctionTable[name].signature);
            const arityFailures: string[] = [];
            for (const name of localInterpreter.context.builtInFunctionList) {
                try {
                    localInterpreter.Execute(`nargin("${name}"); nargout("${name}")`);
                } catch (error: unknown) {
                    arityFailures.push(`${name}: ${(error as Error).message}`);
                }
            }
            expect(missingSignatures).toEqual([]);
            expect(arityFailures).toEqual([]);
        });

        it('Should expose nargin and nargout inside anonymous functions.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, y) nargin; f(1, 2)'))).toBe('f=@(x,y) nargin\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, y) nargin(); f(1, 2)'))).toBe('f=@(x,y) nargin()\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) nargout; a = g(10)'))).toBe('g=@(x) nargout\na=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) nargout(); a = g(10)'))).toBe('g=@(x) nargout()\na=1\n');
        });

        it('Should expose anonymous function call metadata through returned closures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makeanonymouscounter(offset)', '  f = @(x, y) nargin + nargout + offset;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makeanonymouscounter(10); h(1, 2)'))).toBe('h=@(x,y) nargin+nargout+offset\n13\n');
        });

        it('Should reject dynamic variable creation in anonymous function workspaces.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) eval("x + 1"); f(5)'))).toBe('f=@(x) eval(x + 1)\n6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('captured = 10; g = @() eval("captured + 1"); g()'))).toBe('captured=10\ng=@() eval(captured + 1)\n11\n');
            expect(() => localInterpreter.Execute('h = @() eval("dynamicAnonymous = 2"); h()')).toThrow("Attempt to add variable 'dynamicAnonymous' to a static workspace.");
            expect(() => localInterpreter.Execute('k = @() eval("missingAnonymous + 1", "fallbackAnonymous = 3"); k()')).toThrow(
                "Attempt to add variable 'fallbackAnonymous' to a static workspace.",
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("dynamicAnonymous", "var"); exist("fallbackAnonymous", "var")'))).toBe('0\n0\n');
        });

        it('Should support varargin in anonymous functions.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, varargin) x + varargin{1} + nargin; f(1, 2, 3)'))).toBe('f=@(x,varargin) x+varargin{1}+nargin\n6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(varargin) nargin; g(); g(1, 2, 3)'))).toBe('g=@(varargin) nargin\n0\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = @(x, varargin) nargin; feval(h, 1, 2, 3, 4)'))).toBe('h=@(x,varargin) nargin\n4\n');
            expect(() => localInterpreter.Execute('f = @(x, varargin) x; f()')).toThrow('invalid number of arguments.');
        });

        it('Should validate anonymous function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('f = @(x, x) x')).toThrow("duplicate parameter name 'x' in anonymous function.");
            expect(() => localInterpreter.Execute('f = @(varargin, x) x')).toThrow('varargin must be the last parameter in anonymous function.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(~, x, ~) x + nargin; f(1, 5, 9)'))).toBe('f=@(~,x,~) x+nargin\n8\n');
        });

        it('Should report variadic anonymous function handle arity.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@(x, varargin) x); nargin("@(x, varargin) x"); nargout(@(varargin) nargin)'))).toBe('-2\n-2\n1\n');
        });

        it('Should forward multiple outputs from anonymous function expressions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pairfromanon(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) pairfromanon(x); [a, b] = f(5)'))).toBe('f=@(x) pairfromanon(x)\na=5\nb=6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) size(x); [m, n] = g([1, 2, 3])'))).toBe('g=@(x) size(x)\nm=1\nn=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) size(x); [~, n] = g([1, 2, 3]); n'))).toBe('g=@(x) size(x)\nn=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = @() deal(1, 2); [a, b] = h(); [a, b]'))).toBe('h=@() deal(1,2)\na=1\nb=2\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = @() deal(1, 2); [~, b] = h(); b'))).toBe('h=@() deal(1,2)\nb=2\n2\n');
            expect(() => localInterpreter.Execute('h = @() nargout; [a, b] = h()')).toThrow('element number 2 undefined in return list');
        });

        it('Should reject invalid nargin and nargout introspection targets.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('nargin(3)')).toThrow('Invalid call to nargin.');
            expect(() => localInterpreter.Execute('nargin("   ")')).toThrow('nargin: function name cannot be empty.');
            expect(() => localInterpreter.Execute('nargout("   ")')).toThrow('nargout: function name cannot be empty.');
            expect(() => localInterpreter.Execute('nargout("missingarity")')).toThrow("'missingarity' undefined.");
        });

        it('Should validate current input count with narginchk.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = checkedinputs(a, varargin)', '  narginchk(1, 3)', '  y = nargin;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = checkedinputsinf(a, varargin)', '  narginchk(1, Inf)', '  y = nargin;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('narginchk(0, 2)'))).toBe('narginchk(0,2)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('narginchk(0, Inf)'))).toBe('narginchk(0,Inf)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedinputs(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedinputs(1, 2, 3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedinputsinf(1, 2, 3, 4)'))).toBe('4\n');
            expect(() => localInterpreter.Execute('checkedinputs(1, 2, 3, 4)')).toThrow('narginchk: invalid number of input arguments.');
        });

        it('Should validate requested output count with nargoutchk.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = checkedoutputs(x)', '  nargoutchk(1, 2)', '  a = nargout;', '  b = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(
                ['function varargout = checkedvaroutputs(x)', '  nargoutchk(1, 2)', '  varargout{1} = nargout;', '  varargout{2} = x + 1;', '  varargout{3} = x + 2;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargoutchk(0, 2)'))).toBe('nargoutchk(0,2)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargoutchk(0, Inf)'))).toBe('nargoutchk(0,Inf)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = checkedoutputs(10)'))).toBe('a=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = checkedoutputs(10)'))).toBe('a=2\nb=11\n');
            expect(() => localInterpreter.Execute('[a, b, c] = checkedoutputs(10)')).toThrow('element number 3 undefined in return list');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = checkedvaroutputs(10)'))).toBe('a=2\nb=11\n');
            expect(() => localInterpreter.Execute('[a, b, c] = checkedvaroutputs(10)')).toThrow('nargoutchk: invalid number of output arguments.');
        });

        it('Should distribute deal inputs across requested outputs.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = deal(1, 2, 3)'))).toBe('x=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b, c] = deal(1, 2, 3)'))).toBe('a=1\nb=2\nc=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[p, q, r] = deal(9)'))).toBe('p=9\nq=9\nr=9\n');
            expect(() => localInterpreter.Execute('[u, v] = deal(1, 2, 3)')).toThrow('deal: nargin and nargout must match unless there is exactly one input.');
        });

        it('Should validate bounded return lists even when every output is ignored.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('[~, ~, ~] = max([1, 3, 2])')).toThrow('element number 3 undefined in return list');
            expect(() => localInterpreter.Execute('[~, ~, ~] = min([1, 3, 2])')).toThrow('element number 3 undefined in return list');
            expect(() => localInterpreter.Execute('[~, ~, ~] = cummax([1, 3, 2])')).toThrow('element number 3 undefined in return list');
            expect(() => localInterpreter.Execute('[~, ~, ~] = cummin([1, 3, 2])')).toThrow('element number 3 undefined in return list');
            expect(() => localInterpreter.Execute('[~, ~, ~] = sort([1, 3, 2])')).toThrow('element number 3 undefined in return list');
            expect(() => localInterpreter.Execute('[~, ~, ~, ~] = lu([1, 2; 3, 4])')).toThrow('element number 4 undefined in return list');
        });

        it('Should select function outputs with nthargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b, c] = nthtriple(x)', '  a = x;', '  b = x + 1;', '  c = x + 2;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b, c] = nthseeingouts()', '  a = nargout;', '  b = isargout(2);', '  c = isargout(3);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout(2, @nthtriple, 10)'))).toBe('11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout(3, "nthtriple", 10)'))).toBe('12\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout(1, "@(x) x + 1", 20)'))).toBe('21\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout([1, 3], @nthtriple, 20)'))).toBe('{20,22}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout(2, @size, [1, 2, 3])'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout([1, 2], @size, [1, 2, 3])'))).toBe('{1,3}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout(2, @deal, 7, 8)'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @() deal(4, 5); nthargout(2, f)'))).toBe('f=@() deal(4,5)\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout(2, 3, @nthseeingouts)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nthargout([1, 2, 3], 3, @nthseeingouts)'))).toBe('{3,true,true}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("nthargout"); nargout("nthargout")'))).toBe('-2\n1\n');
            expect(() => localInterpreter.Execute('nthargout(0, @nthtriple, 10)')).toThrow('Invalid call to nthargout.');
            expect(() => localInterpreter.Execute('nthargout(3, 2, @nthtriple, 10)')).toThrow('nthargout total output count must be at least the largest requested output index.');
            expect(() => localInterpreter.Execute('nthargout(1, "   ")')).toThrow('nthargout: function name cannot be empty.');
            expect(() => localInterpreter.Execute('nthargout(1, 1)')).toThrow('nthargout: function must be a function handle or function name.');
        });

        it('Should report simple caller argument names with inputname.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [first, second, third, fourth] = namesofinputs(x, y, z)',
                    '  first = inputname(1);',
                    '  second = inputname(2);',
                    '  third = inputname(3);',
                    '  fourth = inputname(4);',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = 10; b = 20; [first, second, third, fourth] = namesofinputs(a, b + 1, 30)'))).toBe(
                'a=10\nb=20\nfirst=a\nsecond=\nthird=\nfourth=\n',
            );
        });

        it('Should optionally report caller expressions with inputname.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [first, second, third, fourth] = inputexpressions(x, y, z)',
                    '  first = inputname(1, false);',
                    '  second = inputname(2, false);',
                    '  third = inputname(3, true);',
                    '  fourth = inputname(3, false);',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('a = 10; b = 20; [first, second, third, fourth] = inputexpressions(a, b + 1, {a, b})'))).toBe(
                'a=10\nb=20\nfirst=a\nsecond=b+1\nthird=\nfourth={a,b}\n',
            );
        });

        it('Should report immediate caller argument names through inputname in nested function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function name = outerinputname(x)', '  name = inner(x);', '  function y = inner(value)', '    y = inputname(1);', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('source = 5; outerinputname(source)'))).toBe('source=5\nx\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('outerinputname(5)'))).toBe('x\n');
        });

        it('Should report caller argument names inside anonymous functions.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) inputname(1); source = 10; f(source)'))).toBe('f=@(x) inputname(1)\nsource=10\nsource\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) inputname(1); f(10)'))).toBe('f=@(x) inputname(1)\n\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) inputname(1, false); source = 10; f(source + 1)'))).toBe('f=@(x) inputname(1,false)\nsource=10\nsource+1\n');
        });

        it('Should report caller argument names inside returned anonymous closures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makeinputnameanon()', '  f = @(x) inputname(1);', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makeinputnameanon(); source = 20; h(source)'))).toBe('h=@(x) inputname(1)\nsource=20\nsource\n');
        });

        it('Should reject inputname outside functions and invalid argument numbers.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = badinputname(n)', '  y = inputname(n);', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('inputname(1)')).toThrow('inputname is only valid inside a function.');
            expect(() => localInterpreter.Execute('badinputname(0)')).toThrow('Invalid call to inputname.');
            expect(() => localInterpreter.Execute('badinputname(1.5)')).toThrow('Invalid call to inputname.');
        });

        it('Should evaluate code in caller and base workspaces with evalin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = readcallerexpr()', '  x = 10;', '  y = evalin("caller", "x + 1");', 'end'].join('\n'));
            localInterpreter.Execute(['function y = readbaseexpr()', '  x = 10;', '  y = evalin("base", "x + 1");', 'end'].join('\n'));
            localInterpreter.Execute(['function y = writecallerexpr()', '  evalin("caller", "x = x + 2");', '  y = 0;', 'end'].join('\n'));
            localInterpreter.Execute(['function declareglobalcallerhelper()', '  evalin("caller", "global evalinGlobalCaller; evalinGlobalCaller = 42");', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'function [y, isGlobal] = declareglobalcallerexpr()',
                    '  declareglobalcallerhelper();',
                    '  y = evalinGlobalCaller;',
                    '  info = whos("evalinGlobalCaller");',
                    '  isGlobal = info.global;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['function clearcallerexpr()', '  evalin("caller", "clear x");', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'function [visibleCount, helperCount, updatedValue, updatedCount, infoName] = whocallerexpr()',
                    '  x = 10;',
                    '  visibleCount = innerWhoX();',
                    '  helperCount = innerWhoHelper();',
                    '  updatedValue = innerUpdate();',
                    '  updatedCount = innerWhoX();',
                    '  info = innerWhosX();',
                    '  infoName = info.name;',
                    '  function n = innerWhoX()',
                    '    n = evalin("caller", "numel(who(\'x\'))");',
                    '  end',
                    '  function n = innerWhoHelper()',
                    '    n = evalin("caller", "numel(who(\'helper\'))");',
                    '  end',
                    '  function n = innerUpdate()',
                    '    n = evalin("caller", "x = x + 1");',
                    '  end',
                    '  function info = innerWhosX()',
                    '    info = evalin("caller", "whos(\'x\')");',
                    '  end',
                    '  function z = helper()',
                    '    z = 99;',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['function clearallcallerexpr()', '  evalin("caller", "clear");', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'function y = evalincallerlocalfunction()',
                    '  y = helper();',
                    '  inner();',
                    '  function z = helper()',
                    '    z = 9;',
                    '  end',
                    '  function z = inner()',
                    '    z = evalin("caller", "helper()");',
                    '  end',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 20; readcallerexpr()'))).toBe('x=20\n21\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('readbaseexpr()'))).toBe('21\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 30; writecallerexpr(); x'))).toBe('x=30\n0\n32\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[globalValue, isGlobal] = declareglobalcallerexpr(); [globalValue, isGlobal]'))).toBe(
                'globalValue=42\nisGlobal=true\n[42,true]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 40; clearcallerexpr(); exist("x", "var")'))).toBe('x=40\n0\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        '[visibleCount, helperCount, updatedValue, updatedCount, infoName] = whocallerexpr(); [visibleCount, helperCount, updatedValue, updatedCount]; infoName',
                    ),
                ),
            ).toBe('visibleCount=1\nhelperCount=0\nupdatedValue=x=11\nupdatedCount=1\ninfoName=x\n[1,0,x=11,1]\nx\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = 1; b = 2; clearallcallerexpr(); exist("a", "var") + exist("b", "var")'))).toBe('a=1\nb=2\n0\n');
            expect(() => localInterpreter.Execute('evalincallerlocalfunction()')).toThrow("'helper' undefined.");
        });

        it('Should evaluate code in anonymous caller workspaces with evalin caller.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = readcallerx()', '  y = evalin("caller", "x");', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalinlambdaouter()', '  x = 7;', '  f = @(t) evalin("caller", "x + 1");', '  y = f(3);', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalinlambdaarg()', '  f = @(x) evalin("caller", "x + 5");', '  y = f(20);', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalinreturnedlambda()', '  x = 30;', '  f = makereadcallerlambda();', '  y = f(1);', 'end'].join('\n'));
            localInterpreter.Execute(['function f = makereadcallerlambda()', '  f = @(t) evalin("caller", "x + t");', 'end'].join('\n'));
            localInterpreter.Execute(['function f = makeevalinwriter()', '  x = 1;', '  f = @() evalin("caller", "x = x + 1");', 'end'].join('\n'));
            localInterpreter.Execute(
                ['function y = evalinlambdahelper()', '  function z = helper()', '    z = 9;', '  end', '  f = @() evalin("caller", "helper()");', '  y = f();', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) readcallerx(); f(10)'))).toBe('f=@(x) readcallerx()\n10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinlambdaouter()'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinlambdaarg()'))).toBe('25\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinreturnedlambda()'))).toBe('31\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 50; writeAnon = @() evalin("caller", "x = x + 4"); writeAnon(); x'))).toBe(
                'x=50\nwriteAnon=@() evalin(caller,x = x + 4)\nx=54\n50\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 60; clearAnon = @() evalin("caller", "clear x"); clearAnon(); exist("x", "var")'))).toBe(
                'x=60\nclearAnon=@() evalin(caller,clear x)\n1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('paramWrite = @(x) evalin("caller", "x = x + 1"); paramWrite(5)'))).toBe(
                'paramWrite=@(x) evalin(caller,x = x + 1)\nx=6\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('writer = makeevalinwriter(); writer(); writer()'))).toBe('writer=@() evalin(caller,x = x + 1)\nx=2\nx=3\n');
            expect(
                localInterpreter.Unparse(localInterpreter.Execute('x = 70; whoAnon = @() [numel(evalin("caller", "who(\'x\')")), numel(evalin("caller", "who(\'helper\')"))]; whoAnon()')),
            ).toBe("x=70\nwhoAnon=@() [numel(evalin(caller,who('x'))),numel(evalin(caller,who('helper')))]\n[1,0]\n");
            expect(() => localInterpreter.Execute('evalinlambdahelper()')).toThrow("'helper' undefined.");
            expect(() => localInterpreter.Execute('dynamicEvalin = @() evalin("caller", "createdByEvalinLambda = 5"); dynamicEvalin()')).toThrow(
                "Attempt to add variable 'createdByEvalinLambda' to a static workspace.",
            );
        });

        it('Should assign variables in caller and base workspaces with assignin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setcaller()', '  assignin("caller", "createdByCaller", 99)', 'end'].join('\n'));
            localInterpreter.Execute(['function setbase()', '  assignin("base", "createdByBase", 123)', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'function y = assigninValueCaller()',
                    '  target = 1;',
                    '  local = 5;',
                    '  assigninValueHelper(local + 1);',
                    '  y = target;',
                    'end',
                    'function assigninValueHelper(value)',
                    '  target = 99;',
                    '  assignin("caller", "target", value)',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('setcaller(); createdByCaller'))).toBe('99\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('setbase(); createdByBase'))).toBe('123\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('assigninValueCaller()'))).toBe('6\n');
        });

        it('Should assign into the calling user function workspace with assignin caller.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = outerassignin()', '  innerassignin();', '  y = localValue;', '  function innerassignin()', '    assignin("caller", "localValue", 7)', '  end', 'end'].join(
                    '\n',
                ),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerassignin()'))).toBe('7\n');
            expect(localInterpreter.context.currentScope.resolveName('localValue')).toBeUndefined();
        });

        it('Should assign into anonymous caller workspaces with assignin caller.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = assigninlambdaouter()', '  f = @() assignin("caller", "createdInOuter", 9);', '  f();', '  y = createdInOuter;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('assigninlambdaouter()'))).toBe('9\n');
            expect(localInterpreter.context.currentScope.resolveName('createdInOuter')).toBeUndefined();
        });

        it('Should reject unsupported evalin and assignin forms.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('evalin("unknown", "1")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("base", "bad-name", 1)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('assignin("base", "x")')).toThrow('Invalid call to assignin.');
        });

        it('Should evaluate code in the current workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 10; eval("y = x + 1"); y'))).toBe('x=10\ny=11\n11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eval("x + y")'))).toBe('21\n');
        });

        it('Should preserve caller requested outputs through eval and evalin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = evalpair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b] = evalmaskedpair()', '  if isargout(1), a = 1; end', '  if isargout(2), b = 2; end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = eval("evalpair(4)"); [a, b]'))).toBe('a=4\nb=5\n[4,5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[c, d] = evalin("base", "evalpair(6)"); [c, d]'))).toBe('c=6\nd=7\n[6,7]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, maskedEval] = eval("evalmaskedpair()"); maskedEval'))).toBe('maskedEval=2\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, maskedEvalIn] = evalin("base", "evalmaskedpair()"); maskedEvalIn'))).toBe('maskedEvalIn=2\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[e, f] = eval("missingEvalPair", "evalpair(10)"); [e, f]'))).toBe('e=10\nf=11\n[10,11]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[g, h] = evalin("base", "missingEvalInPair", "evalpair(20)"); [g, h]'))).toBe('g=20\nh=21\n[20,21]\n');
            expect(() => localInterpreter.Execute('[a, b, c] = eval("evalpair(8)")')).toThrow('element number 3 undefined in return list');
        });

        it('Should capture eval output and return evaluated outputs with evalc.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = evalcpair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b, c] = evalcmaskprobe()', '  a = isargout(1);', '  b = isargout(2);', '  c = isargout(3);', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'function y = staticEvalcDeclared()',
                    '  declared = [];',
                    '  evalc("declared = 5");',
                    '  y = declared;',
                    '  function inner()',
                    '  end',
                    'end',
                    'function y = staticEvalcDynamic()',
                    '  evalc("evalcDynamic = 1");',
                    '  y = 0;',
                    '  function inner()',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('s = evalc("x = 10"); s'))).toBe('s=x=10\nx=10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('s = evalc("missingEvalC", "fallback = 7"); s; fallback'))).toBe('s=fallback=7\nfallback=7\n7\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[s, a, b] = evalc("evalcpair(4)"); s; [a, b]'))).toBe('s=4\n5\n\na=4\nb=5\n4\n5\n\n[4,5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, p] = evalc("pi"); p'))).toBe('p=3.141592653589793238\n3.141592653589793238\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[s, ~, b, ~] = evalc("evalcmaskprobe()"); s; b'))).toBe('s=true\nb=true\ntrue\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, a, ~, c] = evalc("evalcmaskprobe()"); [a, c]'))).toBe('a=true\nc=true\n[true,true]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('staticEvalcDeclared()'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('readEvalc = @(x) evalc("x + 1"); readEvalc(5)'))).toBe('readEvalc=@(x) evalc(x + 1)\n6\n');
            expect(() => localInterpreter.Execute('staticEvalcDynamic()')).toThrow("Attempt to add variable 'evalcDynamic' to a static workspace.");
            expect(() => localInterpreter.Execute('dynamicEvalc = @() evalc("createdFromEvalcAnon = 1"); dynamicEvalc()')).toThrow(
                "Attempt to add variable 'createdFromEvalcAnon' to a static workspace.",
            );
        });

        it('Should keep return scoped to the workspace selected by eval and evalin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalreturnprobe()', '  y = 1;', '  eval("return");', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalinbasereturnprobe()', '  y = 1;', '  evalin("base", "return");', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalincallerreturnprobe()', '  y = 1;', '  evalin("caller", "return");', '  y = 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('evalreturnprobe()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinbasereturnprobe()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalincallerreturnprobe()'))).toBe('1\n');
        });

        it('Should reject invalid definition placement in eval, evalc, and evalin source strings.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('eval("if false; function y = hiddenevallocal(); y = 1; end; end; x = 1")')).toThrow(
                "function definition 'hiddenevallocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute('evalc("if false; function y = hiddenevalclocal(); y = 1; end; end; x = 1")')).toThrow(
                "function definition 'hiddenevalclocal' is not allowed inside a control block.",
            );
            expect(() => localInterpreter.Execute('evalin("base", "if false; classdef HiddenEvalInClass; properties; Value = 1; end; end; end; x = 1")')).toThrow(
                "class definition 'HiddenEvalInClass' is not allowed inside a control block.",
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x", "var")'))).toBe('0\n');
        });

        it('Should reject persistent declarations in eval, evalc, and evalin source strings outside functions.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('eval("if false; persistent hiddenEvalPersistent; end; x = 1")')).toThrow('persistent declaration is only valid inside a function.');
            expect(() => localInterpreter.Execute('evalc("if false; persistent hiddenEvalCPersistent; end; x = 1")')).toThrow('persistent declaration is only valid inside a function.');
            expect(() => localInterpreter.Execute('evalin("base", "try; x = 1; catch; persistent hiddenEvalInPersistent; end")')).toThrow(
                'persistent declaration is only valid inside a function.',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x", "var")'))).toBe('0\n');
        });

        it('Should evaluate code in a user function workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalinside(x)', '  eval("z = x + 1");', '  y = z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinside(10)'))).toBe('11\n');
            expect(localInterpreter.context.currentScope.resolveName('z')).toBeUndefined();
        });

        it('Should let eval and evalc control-flow signals escape catch source.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalreturn()', '  y = 1;', '  eval("return", "y = 99");', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalcreturn()', '  y = 1;', '  evalc("return", "y = 99");', '  y = 2;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalbreak()', '  y = 0;', '  for k = 1:3', '    y = k;', '    eval("break", "y = 99");', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalcbreak()', '  y = 0;', '  for k = 1:3', '    y = k;', '    evalc("break", "y = 99");', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('evalreturn(); evalcreturn(); evalbreak(); evalcbreak()'))).toBe('1\n1\n1\n1\n');
            expect(() => localInterpreter.Execute('eval("break", "caughtBreak = 1")')).toThrow('break is only valid inside a loop.');
            expect(() => localInterpreter.Execute('evalc("break", "caughtEvalCBreak = 1")')).toThrow('break is only valid inside a loop.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("caughtBreak", "var")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("caughtEvalCBreak", "var")'))).toBe('0\n');
        });

        it('Should evaluate code in a nested function workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalnested()', '  x = 1;', '  inner();', '  y = x;', '  function inner()', '    eval("x = x + 4");', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalnested()'))).toBe('5\n');
        });

        it('Should reject dynamic variable creation in static nested-function workspaces.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    staticScriptAllowed: 'scriptDeclared = scriptDeclared + 2;',
                    staticScriptDynamic: 'scriptDynamic = 1;',
                },
            });

            localInterpreter.Execute(
                [
                    'function y = staticEvalDeclared()',
                    '  declared = [];',
                    '  eval("declared = 5");',
                    '  y = declared;',
                    '  function inner()',
                    '  end',
                    'end',
                    'function y = staticEvalDynamic()',
                    '  eval("dynamicName = 5");',
                    '  y = 0;',
                    '  function inner()',
                    '  end',
                    'end',
                    'function y = staticEvalinCallerDeclared()',
                    '  callerDeclared = [];',
                    '  inner();',
                    '  y = callerDeclared;',
                    '  function inner()',
                    '    evalin("caller", "callerDeclared = 7");',
                    '  end',
                    'end',
                    'function y = staticEvalinCallerDynamic()',
                    '  inner();',
                    '  y = 0;',
                    '  function inner()',
                    '    evalin("caller", "callerDynamic = 7");',
                    '  end',
                    'end',
                    'function y = staticAssigninCallerDeclared()',
                    '  assignedDeclared = [];',
                    '  inner();',
                    '  y = assignedDeclared;',
                    '  function inner()',
                    '    assignin("caller", "assignedDeclared", 9);',
                    '  end',
                    'end',
                    'function y = staticAssigninCallerDynamic()',
                    '  inner();',
                    '  y = 0;',
                    '  function inner()',
                    '    assignin("caller", "assignedDynamic", 9);',
                    '  end',
                    'end',
                    'function y = staticScriptDeclared()',
                    '  scriptDeclared = 3;',
                    '  run("staticScriptAllowed");',
                    '  y = scriptDeclared;',
                    '  function inner()',
                    '  end',
                    'end',
                    'function y = staticScriptDynamic()',
                    '  run("staticScriptDynamic");',
                    '  y = 0;',
                    '  function inner()',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('staticEvalDeclared(); staticEvalinCallerDeclared(); staticAssigninCallerDeclared(); staticScriptDeclared()'))).toBe(
                '5\n7\n9\n5\n',
            );
            expect(() => localInterpreter.Execute('staticEvalDynamic()')).toThrow("Attempt to add variable 'dynamicName' to a static workspace.");
            expect(() => localInterpreter.Execute('staticEvalinCallerDynamic()')).toThrow("Attempt to add variable 'callerDynamic' to a static workspace.");
            expect(() => localInterpreter.Execute('staticAssigninCallerDynamic()')).toThrow("Attempt to add variable 'assignedDynamic' to a static workspace.");
            expect(() => localInterpreter.Execute('staticScriptDynamic()')).toThrow("Attempt to add variable 'scriptDynamic' to a static workspace.");
        });

        it('Should source scripts into the selected real caller workspace.', () => {
            const localInterpreter = Interpreter.Create({
                scriptSourceTable: {
                    callerSourceScript: 'sourceCreated = sourceSeed + 5;',
                    callerCommandSourceScript: 'commandCreated = commandSeed + 7;',
                },
            });
            localInterpreter.Execute(
                [
                    'function [a, b] = sourceCallerOuter()',
                    '  sourceSeed = 10;',
                    '  commandSeed = 20;',
                    '  sourceCallerHelper();',
                    '  a = sourceCreated;',
                    '  b = commandCreated;',
                    'end',
                    'function sourceCallerHelper()',
                    '  source("callerSourceScript", "caller");',
                    '  source callerCommandSourceScript caller',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = sourceCallerOuter(); [a, b]'))).toBe('a=15\nb=27\n[15,27]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sourceCreated", "var") + exist("commandCreated", "var")'))).toBe('0\n');
        });

        it('Should call nested functions from eval code.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('z = 21');
            localInterpreter.Execute(['function y = evalcallsfunction(x)', '  eval("t = helper(x)");', '  y = t;', '  function z = helper(v)', '    z = v * 2;', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalcallsfunction(8)'))).toBe('16\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('z'))).toBe('21\n');
        });

        it('Should evaluate catch code in the current workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalcatchinside()', '  eval("missingName + 1", "fallback = 42");', '  y = fallback;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('eval("missingValue + 1", "caughtValue = 12"); caughtValue'))).toBe('caughtValue=12\n12\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalcatchinside()'))).toBe('42\n');
            expect(localInterpreter.context.currentScope.resolveName('fallback')).toBeUndefined();
        });

        it('Should expose eval primary errors through lasterror and lasterr inside catch code.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['eval("error(\'mathjslab:evalCatch\', \'eval failed\')", "err = lasterror(); [msg, id] = lasterr();");', 'afterEval = lasterror();'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('err.message; err.identifier; msg; id; afterEval.message; afterEval.identifier'))).toBe(
                'eval failed\nmathjslab:evalCatch\neval failed\nmathjslab:evalCatch\neval failed\nmathjslab:evalCatch\n',
            );
        });

        it('Should expose evalc primary errors through lasterror and lasterr inside catch code.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['capture = evalc("error(\'mathjslab:evalCCatch\', \'evalc failed\')", "err = lasterror(); [msg, id] = lasterr(); fallback = 9;");', 'afterEvalC = lasterror();'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('capture; err.message; err.identifier; msg; id; fallback; afterEvalC.message; afterEvalC.identifier'))).toBe(
                'err=struct {\nmessage: evalc failed\nidentifier: mathjslab:evalCCatch\nstack: [ ](0x1)\n}\nmsg=evalc failed\nid=mathjslab:evalCCatch\nfallback=9\n\nevalc failed\nmathjslab:evalCCatch\nevalc failed\nmathjslab:evalCCatch\n9\nevalc failed\nmathjslab:evalCCatch\n',
            );
        });

        it('Should evaluate catch code in the selected workspace with evalin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalincatchcaller()', '  evalin("caller", "missingCaller + 1", "callerFallback = 33");', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalincatchbase()', '  evalin("base", "missingBase + 1", "baseFallback = 44");', '  y = 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalincatchcaller(); callerFallback'))).toBe('1\n33\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalincatchbase(); baseFallback'))).toBe('1\n44\n');
        });

        it('Should expose evalin primary errors through lasterror in selected catch workspaces.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = evalinlasterrorcaller()',
                    '  evalin("caller", "error(\'mathjslab:callerEvalIn\', \'caller failed\')", "callerErr = lasterror();");',
                    '  y = 1;',
                    'end',
                    'function y = evalinlasterrorbase()',
                    '  evalin("base", "error(\'mathjslab:baseEvalIn\', \'base failed\')", "baseErr = lasterror();");',
                    '  y = 2;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinlasterrorcaller(); callerErr.message; callerErr.identifier'))).toBe('1\ncaller failed\nmathjslab:callerEvalIn\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinlasterrorbase(); baseErr.message; baseErr.identifier'))).toBe('2\nbase failed\nmathjslab:baseEvalIn\n');
        });

        it('Should propagate catch errors from eval, evalc, and evalin.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('eval("missingPrimary", "missingCatch")')).toThrow("'missingCatch' undefined.");
            expect(() => localInterpreter.Execute('evalc("missingPrimary", "missingCatch")')).toThrow("'missingCatch' undefined.");
            expect(() => localInterpreter.Execute('evalin("base", "missingPrimary", "missingCatch")')).toThrow("'missingCatch' undefined.");
        });

        it('Should reject unsupported eval forms.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('eval(1)')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('eval("1", 2)')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('evalc(1)')).toThrow('Invalid call to evalc.');
            expect(() => localInterpreter.Execute('evalc("1", 2)')).toThrow('Invalid call to evalc.');
        });

        it('Should return early from user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = early(x)', '  y = x;', '  return', '  y = x + 100;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('early(5)'))).toBe('5\n');
        });

        it('Should return early from nested statement lists inside functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = abszero(x)', '  if x < 0', '    y = 0;', '    return', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('abszero(-5)'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('abszero(7)'))).toBe('7\n');
        });

        it('Should preserve persistent variables when returning early.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = earlycounter(stop)', '  persistent c = 0;', '  c = c + 1;', '  y = c;', '  if stop', '    return', '  end', '  y = c + 100;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('earlycounter(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('earlycounter(0)'))).toBe('102\n');
        });

        it('Should combine persistent outer state with returned nested closures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function h = makePersistentClosure(seed)',
                    '  persistent shared = 0;',
                    '  shared = shared + 1;',
                    '  local = seed;',
                    '  function y = next(step)',
                    '    local = local + step;',
                    '    y = local + shared * 100;',
                    '  end',
                    '  h = @next;',
                    'end',
                    'first = makePersistentClosure(10);',
                    'second = makePersistentClosure(20);',
                    'a = first(1);',
                    'b = first(1);',
                    'c = second(1);',
                    'd = first(1);',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('a; b; c; d; exist("shared", "var"); exist("local", "var")'))).toBe('111\n112\n221\n113\n0\n0\n');
        });

        it('Should accept return at top level as a no-output early stop.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Parse('return'))).toBe('return\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('return'))).toBe('');
        });

        it('Should validate requested outputs after an early return.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = earlypair()', '  a = 1;', '  return', '  b = 2;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = earlypair()'))).toBe('a=1\n');
            expect(() => localInterpreter.Execute('[a, b] = earlypair()')).toThrow("Undefined return variable 'b'");
        });

        it('Should keep nested function call metadata isolated.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = inner()', '  y = nargout;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b] = outer()', '  a = inner();', '  b = nargout;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = outer()'))).toBe('x=1\ny=2\n');
        });

        it('Should reject nargin and nargout outside function bodies.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('nargin')).toThrow('nargin is only valid inside a function.');
            expect(() => localInterpreter.Execute('nargout')).toThrow('nargout is only valid inside a function.');
        });

        it('Should bind extra function arguments into varargin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = firstextra(a, varargin)', '  y = a + varargin{1};', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('firstextra(10, 3, 4)'))).toBe('13\n');
        });

        it('Should bind all function arguments into varargin when it is the only parameter.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = addfirsttwo(varargin)', '  y = varargin{1} + varargin{2};', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('addfirsttwo(5, 7)'))).toBe('12\n');
        });

        it('Should count all supplied arguments when using varargin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = countall(a, varargin)', '  y = nargin;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('countall(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('countall(1, 2, 3)'))).toBe('3\n');
        });

        it('Should reject calls with fewer arguments than fixed parameters before varargin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = needsfixed(a, b, varargin)', '  y = nargin;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('needsfixed(1)')).toThrow('invalid number of arguments in function needsfixed');
        });

        it('Should assign a single output from varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = splitvar(x)', '  varargout{1} = x;', '  varargout{2} = x + 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = splitvar(10)'))).toBe('a=10\n');
        });

        it('Should assign multiple outputs from varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = splitvar(x)', '  varargout{1} = x;', '  varargout{2} = x + 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = splitvar(10)'))).toBe('a=10\nb=11\n');
        });

        it('Should expose requested output count while assigning varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = countvarouts()', '  varargout{1} = nargout;', '  varargout{2} = nargout + 10;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = countvarouts()'))).toBe('a=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = countvarouts()'))).toBe('a=2\nb=12\n');
        });

        it('Should report unassigned requested varargout elements.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = oneout(x)', '  varargout{1} = x;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('[a, b] = oneout(10)')).toThrow('element number 2 undefined in return list');
        });

        it('Should combine varargin and varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = echoextras(varargin)', '  varargout{1} = varargin{1};', '  varargout{2} = varargin{2};', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = echoextras(3, 4)'))).toBe('a=3\nb=4\n');
        });

        it('Should validate duplicate function signature names.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['function y = dupinput(x, x)', '  y = x;', 'end'].join('\n'))).toThrow("duplicate parameter name 'x' in function dupinput.");
            expect(() => localInterpreter.Execute(['function [y, y] = dupoutput()', '  y = 1;', 'end'].join('\n'))).toThrow("duplicate return name 'y' in function dupoutput.");
            localInterpreter.Execute(['function y = outerdupnested()', '  y = inner(1);', '  function z = inner(x, x)', '    z = x;', '  end', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('outerdupnested()')).toThrow("duplicate parameter name 'x' in function inner.");
        });

        it('Should validate variadic function signature positions.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['function y = badvarargin(varargin, x)', '  y = nargin;', 'end'].join('\n'))).toThrow(
                'varargin must be the last parameter in function badvarargin.',
            );
            expect(() => localInterpreter.Execute(['function [varargout, y] = badvarargout()', '  y = 1;', 'end'].join('\n'))).toThrow(
                'varargout must be the last return in function badvarargout.',
            );
        });

        it('Should ignore tilde placeholders while validating function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function [~, ~, y] = ignoredsignature(~, x, ~)', '  y = x + nargin;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, ~, z] = ignoredsignature(1, 5, 9)'))).toBe('z=8\n');
        });

        it('Should validate repeating arguments against varargin extras.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = countpositive(x, varargin)',
                    '  arguments',
                    '    x double',
                    '  end',
                    '  arguments (Repeating)',
                    '    value double {mustBePositive}',
                    '  end',
                    '  y = nargin;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('countpositive(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('countpositive(1, 2, 3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute("countpositive(1, 'a')")).toThrow("arguments block validation failed for 'value{1}': expected class double, got char.");
            expect(() => localInterpreter.Execute('countpositive(1, 2, -3)')).toThrow("arguments block validation failed for 'value{2}': mustBePositive.");
        });

        it('Should validate repeating argument sizes.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = countrows(varargin)', '  arguments (Repeating)', '    row (1,2) double', '  end', '  y = nargin;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('countrows([1,2], [3,4])'))).toBe('2\n');
            expect(() => localInterpreter.Execute('countrows([1;2])')).toThrow("arguments block validation failed for 'row{1}': expected size 1x2, got 2x1.");
        });

        it('Should validate repeating argument groups.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = repeatpairs(varargin)', '  arguments (Repeating)', '    left double {mustBePositive}', '    right char', '  end', '  y = nargin;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute("repeatpairs(1, 'a', 2, 'b')"))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('repeatpairs()'))).toBe('0\n');
            expect(() => localInterpreter.Execute("repeatpairs(1, 'a', 2)")).toThrow('invalid number of repeating arguments in function repeatpairs');
            expect(() => localInterpreter.Execute("repeatpairs(1, 'a', -2, 'b')")).toThrow("arguments block validation failed for 'left{2}': mustBePositive.");
            expect(() => localInterpreter.Execute('repeatpairs(1, 2)')).toThrow("arguments block validation failed for 'right{1}': expected class char, got double.");
        });

        it('Should parse MATLAB-style multi-attribute arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = explicitinputrepeat(varargin)', '  arguments (Input,Repeating)', '    value double {mustBePositive}', '  end', '  y = nargin;', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('explicitinputrepeat(1, 2, 3)'))).toBe('3\n');
            expect(
                localInterpreter.Unparse(localInterpreter.Parse(['function y = parseinputrepeat(varargin)', '  arguments (Input,Repeating)', '    value double', '  end', 'end'].join('\n'))),
            ).toContain('ARGUMENTS (Input,Repeating)');
            localInterpreter.Execute(
                [
                    'function varargout = outputrepeat(x)',
                    '  arguments (Output,Repeating)',
                    '    varargout double',
                    '  end',
                    '  for k = 1:nargout',
                    '    varargout{k} = x;',
                    '  end',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = outputrepeat(4)'))).toBe('a=4\nb=4\n');
        });

        it('Should validate repeating output arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function items = pairsum(varargin)',
                    '  arguments (Input,Repeating)',
                    '    left (1,:) double',
                    '    right (1,:) double',
                    '  end',
                    '  arguments (Output,Repeating)',
                    '    items (1,:) double {mustBeNonnegative}',
                    '  end',
                    '  items{1} = varargin{1} + varargin{2};',
                    '  items{2} = varargin{3} + varargin{4};',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = pairsum([1, 2], [3, 4], [5, 6], [7, 8])'))).toBe('a=[4,6]\nb=[12,14]\n');
            localInterpreter.Execute(['function out = badrepeatoutsize()', '  arguments (Output,Repeating)', '    out (1,:) double', '  end', '  out{1} = [1; 2];', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('a = badrepeatoutsize();')).toThrow("arguments block validation failed for 'out{1}': expected size (1,:), got 2x1.");
            expect(() =>
                localInterpreter.Execute(
                    ['function out = badrepeatout()', '  arguments (Output,Repeating)', '    out double', '  end', "  out{1} = 'x';", 'end', 'a = badrepeatout();'].join('\n'),
                ),
            ).toThrow("arguments block validation failed for 'out{1}': expected class double, got char.");
        });

        it('Should reject repeating arguments blocks without varargin.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute(['function y = repeatwithoutvarargin(x)', '  arguments (Repeating)', '    value double', '  end', '  y = x;', 'end'].join('\n'))).toThrow(
                'arguments (Repeating) requires a varargin parameter in function repeatwithoutvarargin.',
            );
        });

        it('Should reject invalid arguments block ordering.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    ['function y = tworepeating(varargin)', '  arguments (Repeating)', '    x', '  end', '  arguments (Repeating)', '    z', '  end', '  y = nargin;', 'end'].join('\n'),
                ),
            ).toThrow('function tworepeating can contain only one arguments (Repeating) block.');
            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = repeat_after_namevalue(opts, varargin)',
                        '  arguments',
                        '    opts.Scale = 1',
                        '  end',
                        '  arguments (Repeating)',
                        '    x',
                        '  end',
                        '  y = opts.Scale;',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow('arguments (Repeating) block must appear before name-value arguments in function repeat_after_namevalue.');
            expect(() =>
                localInterpreter.Execute(
                    ['function y = input_after_output(x)', '  arguments (Output)', '    y', '  end', '  arguments (Input)', '    x', '  end', '  y = x;', 'end'].join('\n'),
                ),
            ).toThrow('input arguments blocks must appear before output arguments blocks in function input_after_output.');
            expect(() =>
                localInterpreter.Execute(
                    ['function y = ordinary_after_repeating(x, varargin)', '  arguments (Repeating)', '    r', '  end', '  arguments (Input)', '    x', '  end', '  y = x;', 'end'].join(
                        '\n',
                    ),
                ),
            ).toThrow('ordinary input arguments blocks cannot follow repeating arguments block in function ordinary_after_repeating.');
            expect(() => localInterpreter.Execute(['function y = required_after_optional(x, z)', '  arguments', '    x = 1', '    z', '  end', '  y = x + z;', 'end'].join('\n'))).toThrow(
                'required input arguments cannot follow optional input arguments in function required_after_optional.',
            );
            expect(() =>
                localInterpreter.Execute(
                    ['function y = ordinary_after_namevalue(x, opts)', '  arguments', '    opts.Scale = 1', '    x', '  end', '  y = x + opts.Scale;', 'end'].join('\n'),
                ),
            ).toThrow('ordinary input arguments must appear before name-value arguments in function ordinary_after_namevalue.');
        });

        it('Should reject duplicate and conflicting arguments block declarations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(['function y = duplicateinput(x)', '  arguments', '    x double', '    x {mustBePositive}', '  end', '  y = x;', 'end'].join('\n')),
            ).toThrow("duplicate arguments block declaration 'x' in function duplicateinput.");
            expect(() =>
                localInterpreter.Execute(['function y = duplicateoutput(x)', '  arguments (Output)', '    y double', '    y {mustBePositive}', '  end', '  y = x;', 'end'].join('\n')),
            ).toThrow("duplicate arguments block output declaration 'y' in function duplicateoutput.");
            expect(() =>
                localInterpreter.Execute(
                    ['function y = duplicaterepeating(varargin)', '  arguments (Repeating)', '    item double', '    item char', '  end', '  y = nargin;', 'end'].join('\n'),
                ),
            ).toThrow("duplicate arguments (Repeating) declaration 'item' in function duplicaterepeating.");
            expect(() =>
                localInterpreter.Execute(['function y = ordinary_then_namevalue(x, opts)', '  arguments', '    opts', '    opts.Scale = 1', '  end', '  y = x;', 'end'].join('\n')),
            ).toThrow("arguments block parameter 'opts' cannot have both ordinary and name-value declarations in function ordinary_then_namevalue.");
            expect(() =>
                localInterpreter.Execute(['function y = namevalue_then_ordinary(x, opts)', '  arguments', '    opts.Scale = 1', '    opts', '  end', '  y = x;', 'end'].join('\n')),
            ).toThrow("arguments block parameter 'opts' cannot have both ordinary and name-value declarations in function namevalue_then_ordinary.");
        });

        it('Should bind name-value arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = scaleoffset(x, options)',
                    '  arguments',
                    '    x double',
                    '    options.factor double = 1',
                    '    options.offset double = 0',
                    '  end',
                    '  y = x * options.factor + options.offset;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10)'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, factor=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, factor=2, offset=3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2)"))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2, 'offset', 3)"))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2, offset=3)"))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "factor", 2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "factor", 2, "offset", 3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "factor", 2, offset=3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, fac=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'off', 3)"))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "fac", 2, "off", 3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, Factor=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'Fac', 2)"))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "OFFSET", 3)'))).toBe('13\n');
        });

        it('Should count original inputs for functions called with name-value arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [count, first, second, third, scale] = namevaluemetadata(x, options)',
                    '  arguments',
                    '    x',
                    '    options.scale double = 1',
                    '  end',
                    '  count = nargin;',
                    '  first = inputname(1);',
                    '  second = inputname(2);',
                    '  third = inputname(3);',
                    '  scale = options.scale;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                ['function y = needsnamedcount(x, options)', '  arguments', '    x', '    options.scale double = 1', '  end', '  narginchk(2, 2)', '  y = nargin;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('source = 10; [count, first, second, third, scale] = namevaluemetadata(source, scale=2)'))).toBe(
                'source=10\ncount=2\nfirst=source\nsecond=\nthird=\nscale=2\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('value = 3; [count, first, second, third, scale] = namevaluemetadata(source, "scale", value)'))).toBe(
                'value=3\ncount=3\nfirst=source\nsecond=\nthird=value\nscale=3\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('needsnamedcount(10, scale=2)'))).toBe('2\n');
            expect(() => localInterpreter.Execute('needsnamedcount(10)')).toThrow('narginchk: invalid number of input arguments.');
        });

        it('Should distinguish optional positional strings from declared name-value strings.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [label, scale] = labelscale(x, label, options)',
                    '  arguments',
                    '    x',
                    '    label string = "default"',
                    '    options.Scale double = 1',
                    '  end',
                    '  scale = options.Scale;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = labelscale(5, "hello")'))).toBe('label=hello\nscale=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = labelscale(5, "Scale", 3)'))).toBe('label=default\nscale=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = labelscale(5, "hello", "Scale", 3)'))).toBe('label=hello\nscale=3\n');
            expect(() => localInterpreter.Execute('[label, scale] = labelscale(5, "unknown", 3)')).toThrow('invalid number of arguments in function labelscale');
            expect(() => localInterpreter.Execute('[label, scale] = labelscale(5, "hello", "unknown", 3)')).toThrow("unknown name-value argument 'unknown' in function labelscale");
        });

        it('Should keep required positional strings before declared name-value strings.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [label, scale] = requiredlabelscale(x, label, options)',
                    '  arguments',
                    '    x double',
                    '    label string',
                    '    options.Scale double = 1',
                    '  end',
                    '  scale = options.Scale;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = requiredlabelscale(5, "Scale")'))).toBe('label=Scale\nscale=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = requiredlabelscale(5, "Scale", "Scale", 3)'))).toBe('label=Scale\nscale=3\n');
            expect(() => localInterpreter.Execute('[label, scale] = requiredlabelscale(5, "Scale", "unknown", 3)')).toThrow(
                "unknown name-value argument 'unknown' in function requiredlabelscale",
            );
        });

        it('Should separate varargin extras from declared name-value arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [count, firstExtra, scale] = mixedvarname(x, options, varargin)',
                    '  arguments',
                    '    x',
                    '    options.Scale double = 1',
                    '    varargin',
                    '  end',
                    '  count = nargin;',
                    '  firstExtra = varargin{1};',
                    '  scale = options.Scale;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[count, firstExtra, scale] = mixedvarname(10, 20, Scale=3)'))).toBe('count=3\nfirstExtra=20\nscale=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[count, firstExtra, scale] = mixedvarname(10, 20, "Scale", 4)'))).toBe('count=4\nfirstExtra=20\nscale=4\n');
            expect(() => localInterpreter.Execute('mixedvarname(10, Scale=3, 20)')).toThrow('positional arguments cannot follow name-value arguments in function mixedvarname');
        });

        it('Should validate name-value arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = bounded(x, options)', '  arguments', '    x double', '    options.factor double {mustBePositive} = 1', '  end', '  y = x * options.factor;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('bounded(5, factor=3)'))).toBe('15\n');
            expect(() => localInterpreter.Execute('bounded(5, factor=-1)')).toThrow("arguments block validation failed for 'options.factor': mustBePositive.");
            expect(() => localInterpreter.Execute("bounded(5, factor='abc')")).toThrow("arguments block validation failed for 'options.factor': expected class double, got char.");
        });

        it('Should reject invalid name-value argument calls and declarations.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = scaleoffset(x, options)', '  arguments', '    x double', '    options.factor double = 1', '  end', '  y = x * options.factor;', 'end'].join('\n'),
            );
            expect(() => localInterpreter.Execute('scaleoffset(10, unknown=2)')).toThrow("unknown name-value argument 'unknown' in function scaleoffset");
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, factor=2, factor=3)'))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, fac=2, factor=3)'))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2, factor=3)"))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "Factor", 2, factor=3)'))).toBe('30\n');
            expect(() => localInterpreter.Execute("scaleoffset(10, 'factor')")).toThrow("missing value for name-value argument 'factor' in function scaleoffset");
            expect(() => localInterpreter.Execute('scaleoffset(10, "factor")')).toThrow("missing value for name-value argument 'factor' in function scaleoffset");
            expect(() => localInterpreter.Execute('scaleoffset(10, factor=2, 3)')).toThrow('positional arguments cannot follow name-value arguments in function scaleoffset');
            expect(() => localInterpreter.Execute("scaleoffset(10, 'factor', 2, 3)")).toThrow('positional arguments cannot follow name-value arguments in function scaleoffset');
            expect(() => localInterpreter.Execute('scaleoffset(10, "factor", 2, 3)')).toThrow('positional arguments cannot follow name-value arguments in function scaleoffset');
            expect(() => localInterpreter.Execute('scaleoffset(10, "unknown", 2)')).toThrow("unknown name-value argument 'unknown' in function scaleoffset");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = duplicatenvfield(lineOptions, fillOptions)',
                        '  arguments',
                        '    lineOptions.Color string = "red"',
                        '    fillOptions.color string = "blue"',
                        '  end',
                        '  y = 1;',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("duplicate arguments block name-value field 'Color' in function duplicatenvfield.");
        });

        it('Should allow name-value declarations without default values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [hasFactor, value] = optionalnamedefault(x, options)',
                    '  arguments',
                    '    x double',
                    '    options.factor double {mustBePositive}',
                    '  end',
                    '  hasFactor = isfield(options, "factor");',
                    '  if hasFactor',
                    '    value = options.factor;',
                    '  else',
                    '    value = x;',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[hasFactor, value] = optionalnamedefault(10)'))).toBe('hasFactor=false\nvalue=10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[hasFactor, value] = optionalnamedefault(10, factor=3)'))).toBe('hasFactor=true\nvalue=3\n');
            expect(() => localInterpreter.Execute('optionalnamedefault(10, factor=-1)')).toThrow("arguments block validation failed for 'options.factor': mustBePositive.");
        });

        it('Should reject name-value defaults and validators that depend on name-value arguments.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = namevaluedependentdefault(options)',
                        '  arguments',
                        '    options.Min double = 1',
                        '    options.Max double = options.Min + 1',
                        '  end',
                        '  y = options.Max;',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("arguments block name-value default for 'options.Max' cannot reference name-value argument 'options.Min' in function namevaluedependentdefault.");
            expect(() =>
                localInterpreter.Execute(
                    [
                        'function y = namevaluedependentvalidator(options)',
                        '  arguments',
                        '    options.Min double = 1',
                        '    options.Max double {mustBeGreaterThan(options.Max, options.Min)} = 2',
                        '  end',
                        '  y = options.Max;',
                        'end',
                    ].join('\n'),
                ),
            ).toThrow("arguments block name-value validation for 'options.Max' cannot reference name-value argument 'options.Min' in function namevaluedependentvalidator.");

            localInterpreter.Execute(
                [
                    'function y = namevalueowntargetvalidator(options)',
                    '  arguments',
                    '    options.Max double {mustBeGreaterThan(options.Max, 1)} = 2',
                    '  end',
                    '  y = options.Max;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('namevalueowntargetvalidator(Max=3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('namevalueowntargetvalidator(Max=1)')).toThrow("arguments block validation failed for 'options.Max': mustBeGreaterThan.");
        });

        it('Should reject ambiguous name-value abbreviations.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = twofa(x, options)',
                    '  arguments',
                    '    x double',
                    '    options.factor double = 1',
                    '    options.fade double = 0',
                    '  end',
                    '  y = x * options.factor + options.fade;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, fact=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, fad=3)'))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, FACT=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, "FAD", 3)'))).toBe('13\n');
            expect(() => localInterpreter.Execute('twofa(10, fa=2)')).toThrow("ambiguous name-value argument 'fa' in function twofa");
            expect(() => localInterpreter.Execute('twofa(10, "fa", 2)')).toThrow("ambiguous name-value argument 'fa' in function twofa");
            expect(() => localInterpreter.Execute('twofa(10, "FA", 2)')).toThrow("ambiguous name-value argument 'FA' in function twofa");
        });

        it('Should accept arguments blocks that declare function parameters.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = checkedarg(x)', '  arguments', '    x', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedarg(5)'))).toBe('5\n');
        });

        it('Should reject arguments blocks that declare unknown parameters.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute(['function y = checkedarg(x)', '  arguments', '    z', '  end', '  y = x;', 'end'].join('\n'))).toThrow(
                "arguments block declaration 'z' does not match a function parameter in function checkedarg.",
            );
        });

        it('Should validate symbolic argument dimensions declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = columnany(x)', '  arguments', '    x (n,1)', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = sameheight(x, z)', '  arguments', '    x (n,1)', '    z (n,1)', '  end', '  y = x + z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('columnany([1;2;3])'))).toBe('[1;\n2;\n3]\n');
            expect(() => localInterpreter.Execute('columnany([1,2,3])')).toThrow("arguments block validation failed for 'x': expected size nx1, got 1x3.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('sameheight([1;2], [3;4])'))).toBe('[4;\n6]\n');
            expect(() => localInterpreter.Execute('sameheight([1;2], [3;4;5])')).toThrow("arguments block validation failed for 'z': expected size nx1, got 3x1.");
        });

        it('Should validate scalar argument sizes declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = scalaronly(x)', '  arguments', '    x (1,1)', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('scalaronly(5)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('scalaronly([1,2])')).toThrow("arguments block validation failed for 'x': expected size 1x1, got 1x2.");
        });

        it('Should validate vector argument sizes declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = rowonly(x)', '  arguments', '    x (1,2)', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('rowonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('rowonly([1;2])')).toThrow("arguments block validation failed for 'x': expected size 1x2, got 2x1.");
        });

        it('Should validate default argument values against declared sizes.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = defaultscalar(x)', '  arguments', '    x (1,1) = 4', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultscalar()'))).toBe('4\n');
            expect(() => localInterpreter.Execute('defaultscalar([1,2])')).toThrow("arguments block validation failed for 'x': expected size 1x1, got 1x2.");
        });

        it('Should validate double arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = doubleonly(x)', '  arguments', '    x double', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('doubleonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute("doubleonly('abc')")).toThrow("arguments block validation failed for 'x': expected class double, got char.");
        });

        it('Should validate char arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = charonly(x)', '  arguments', '    x char', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute("charonly('abc')"))).toBe('abc\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("charonly(['a';'b'])"))).toBe('[a;\nb]\n');
            expect(() => localInterpreter.Execute('charonly("abc")')).toThrow("arguments block validation failed for 'x': expected class char, got string.");
            expect(() => localInterpreter.Execute('charonly(3)')).toThrow("arguments block validation failed for 'x': expected class char, got double.");
        });

        it('Should validate string arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = stringonly(x)', '  arguments', '    x string', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('stringonly("abc")'))).toBe('abc\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('stringonly(["a","b"])'))).toBe('[a,b]\n');
            expect(() => localInterpreter.Execute("stringonly('abc')")).toThrow("arguments block validation failed for 'x': expected class string, got char.");
            expect(() => localInterpreter.Execute('stringonly(3)')).toThrow("arguments block validation failed for 'x': expected class string, got double.");
        });

        it('Should validate char argument sizes as row character vectors.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = charrow(x)', '  arguments', '    x (1,4) char', '  end', '  y = length(x);', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute("charrow('abcd')"))).toBe('4\n');
            expect(() => localInterpreter.Execute("charrow('abc')")).toThrow("arguments block validation failed for 'x': expected size 1x4, got 1x3.");
        });

        it('Should validate cell arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = cellonly(x)', '  arguments', '    x cell', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('cellonly({1,2})'))).toBe('{1,2}\n');
            expect(() => localInterpreter.Execute('cellonly([1,2])')).toThrow("arguments block validation failed for 'x': expected class cell, got double.");
        });

        it('Should validate struct arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = structonly(x)', '  arguments', '    x struct', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('structonly(struct())'))).toBe('struct {\n\n}\n');
            expect(() => localInterpreter.Execute('structonly(3)')).toThrow("arguments block validation failed for 'x': expected class struct, got double.");
        });

        it('Should validate function_handle arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = handleonly(f)', '  arguments', '    f function_handle', '  end', '  y = f(3);', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('handleonly(@(x) x + 1)'))).toBe('4\n');
            expect(() => localInterpreter.Execute('handleonly(3)')).toThrow("arguments block validation failed for 'f': expected class function_handle, got double.");
        });

        it('Should validate user-defined classes in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef ArgBase', 'end', 'classdef ArgChild < ArgBase', 'end', 'function name = classarg(x)', '  arguments', '    x ArgBase', '  end', '  name = class(x);', 'end'].join(
                    '\n',
                ),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('classarg(ArgChild())'))).toBe('ArgChild\n');
            expect(() => localInterpreter.Execute('classarg(1)')).toThrow("arguments block validation failed for 'x': expected class ArgBase, got double.");
        });

        it('Should parse qualified class names in arguments blocks.', () => {
            const tree = parseList(['function y = qualifiedarg(x)', '  arguments', '    x pkg.Value', '  end', '  y = x;', 'end'].join('\n'));
            const func = tree.list[0];
            if (!AST.isNodeFunctionDefinition(func)) {
                throw new Error('expected a function definition.');
            }
            const validation = func.arguments.list[0].validation[0];
            if (!AST.isNodeIdentifier(validation.name) || !AST.isNodeIdentifier(validation.class)) {
                throw new Error('expected identifier validation name and class.');
            }

            expect(validation.name.id).toBe('x');
            expect(validation.class.id).toBe('pkg.Value');
        });

        it('Should validate host-provided qualified classes in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    '+pkg/@ArgBase/ArgBase.m': ['classdef ArgBase', 'end'].join('\n'),
                    '+pkg/@ArgChild/ArgChild.m': ['classdef ArgChild < pkg.ArgBase', 'end'].join('\n'),
                },
            });
            localInterpreter.Execute(['function name = qualifiedclassarg(x)', '  arguments', '    x pkg.ArgBase', '  end', '  name = class(x);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('qualifiedclassarg(pkg.ArgChild())'))).toBe('pkg.ArgChild\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('qualifiedclassarg([pkg.ArgChild(), pkg.ArgChild()])'))).toBe('pkg.ArgChild\n');
            expect(() => localInterpreter.Execute('qualifiedclassarg([])')).toThrow("arguments block validation failed for 'x': expected class pkg.ArgBase, got double.");
            expect(() => localInterpreter.Execute('qualifiedclassarg(1)')).toThrow("arguments block validation failed for 'x': expected class pkg.ArgBase, got double.");
        });

        it('Should combine size and class validation in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = typedrow(x)', '  arguments', '    x (1,2) double', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('typedrow([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('typedrow([1;2])')).toThrow("arguments block validation failed for 'x': expected size 1x2, got 2x1.");
            expect(() => localInterpreter.Execute('typedrow({1,2})')).toThrow("arguments block validation failed for 'x': expected class double, got cell.");
        });

        it('Should validate colon wildcard dimensions in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = anywidthrow(x)', '  arguments', '    x (1,:) double', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = anyheightcolumn(x)', '  arguments', '    x (:,1) double', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('anywidthrow([1,2,3])'))).toBe('[1,2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('anyheightcolumn([1;2;3])'))).toBe('[1;\n2;\n3]\n');
            expect(() => localInterpreter.Execute('anywidthrow([1;2])')).toThrow("arguments block validation failed for 'x': expected size (1,:), got 2x1.");
            expect(() => localInterpreter.Execute('anyheightcolumn([1,2])')).toThrow("arguments block validation failed for 'x': expected size (:,1), got 1x2.");
        });

        it('Should validate single arguments as numeric arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = singleonly(x)', '  arguments', '    x single', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('singleonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute("singleonly('abc')")).toThrow("arguments block validation failed for 'x': expected class single, got char.");
        });

        it('Should preserve string arrays while concatenating char vectors.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('[\'a\',\'b\']; ["a","b"]; class([\'a\',\'b\']); class(["a","b"])'))).toBe('ab\n[a,b]\nchar\nstring\n');
        });

        it('Should validate numeric and text argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = numericonly(x)', '  arguments', '    x {mustBeNumeric}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = textonly(x)', '  arguments', '    x {mustBeText}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('numericonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute("numericonly('abc')")).toThrow("arguments block validation failed for 'x': mustBeNumeric.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("textonly('abc')"))).toBe('abc\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("textonly(['a';'b'])"))).toBe('[a;\nb]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('textonly(["a","b"])'))).toBe('[a,b]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("textonly({'a','b'})"))).toBe('{a,b}\n');
            expect(() => localInterpreter.Execute('textonly(3)')).toThrow("arguments block validation failed for 'x': mustBeText.");
        });

        it('Should validate shape argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = scalarvalidated(x)', '  arguments', '    x {mustBeScalar}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = vectorvalidated(x)', '  arguments', '    x {mustBeVector}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = rowvalidated(x)', '  arguments', '    x {mustBeRow}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = columnvalidated(x)', '  arguments', '    x {mustBeColumn}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = scalarorempty(x)', '  arguments', '    x {mustBeScalarOrEmpty}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonemptyvalidated(x)', '  arguments', '    x {mustBeNonempty}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('scalarvalidated(3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('scalarvalidated([1,2])')).toThrow("arguments block validation failed for 'x': mustBeScalar.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('vectorvalidated([1,2])'))).toBe('[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('vectorvalidated("abc")'))).toBe('abc\n');
            expect(() => localInterpreter.Execute('vectorvalidated([1,2;3,4])')).toThrow("arguments block validation failed for 'x': mustBeVector.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('rowvalidated([1,2]); columnvalidated([1;2])'))).toBe('[1,2]\n[1;\n2]\n');
            expect(() => localInterpreter.Execute('rowvalidated([1;2])')).toThrow("arguments block validation failed for 'x': mustBeRow.");
            expect(() => localInterpreter.Execute('columnvalidated([1,2])')).toThrow("arguments block validation failed for 'x': mustBeColumn.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('scalarorempty([])'))).toBe('[ ](0x0)\n');
            expect(() => localInterpreter.Execute('nonemptyvalidated([])')).toThrow("arguments block validation failed for 'x': mustBeNonempty.");
        });

        it('Should validate additional MATLAB-like shape and text argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = matrixvalidated(x)', '  arguments', '    x {mustBeMatrix}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = squarevalidated(x)', '  arguments', '    x {mustBeSquare}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = textscalarvalidated(x)', '  arguments', '    x {mustBeTextScalar}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonzerotextvalidated(x)', '  arguments', '    x {mustBeNonzeroLengthText}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = varnamevalidated(x)', '  arguments', '    x {mustBeValidVariableName}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('matrixvalidated([1,2;3,4])'))).toBe('[1,2;\n3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('matrixvalidated(3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('squarevalidated([1,2;3,4])'))).toBe('[1,2;\n3,4]\n');
            expect(() => localInterpreter.Execute('squarevalidated([1,2])')).toThrow("arguments block validation failed for 'x': mustBeSquare.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("textscalarvalidated('abc')"))).toBe('abc\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('textscalarvalidated("abc")'))).toBe('abc\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('textscalarvalidated(["abc"])'))).toBe('abc\n');
            expect(() => localInterpreter.Execute('textscalarvalidated(3)')).toThrow("arguments block validation failed for 'x': mustBeTextScalar.");
            expect(() => localInterpreter.Execute('textscalarvalidated(["a","b"])')).toThrow("arguments block validation failed for 'x': mustBeTextScalar.");
            expect(() => localInterpreter.Execute("textscalarvalidated({'abc'})")).toThrow("arguments block validation failed for 'x': mustBeTextScalar.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("nonzerotextvalidated('abc'); nonzerotextvalidated([\"a\",\"b\"]); nonzerotextvalidated({'a','b'})"))).toBe(
                'abc\n[a,b]\n{a,b}\n',
            );
            expect(() => localInterpreter.Execute('nonzerotextvalidated("")')).toThrow("arguments block validation failed for 'x': mustBeNonzeroLengthText.");
            expect(() => localInterpreter.Execute('nonzerotextvalidated(["a",""])')).toThrow("arguments block validation failed for 'x': mustBeNonzeroLengthText.");
            expect(() => localInterpreter.Execute('nonzerotextvalidated(3)')).toThrow("arguments block validation failed for 'x': mustBeNonzeroLengthText.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("varnamevalidated('alpha_1'); varnamevalidated({'alpha','beta_2'})"))).toBe('alpha_1\n{alpha,beta_2}\n');
            expect(() => localInterpreter.Execute('varnamevalidated("1alpha")')).toThrow("arguments block validation failed for 'x': mustBeValidVariableName.");
            expect(() => localInterpreter.Execute('varnamevalidated("end")')).toThrow("arguments block validation failed for 'x': mustBeValidVariableName.");
            expect(() => localInterpreter.Execute('varnamevalidated(["alpha","beta"])')).toThrow("arguments block validation failed for 'x': mustBeValidVariableName.");
        });

        it('Should validate file and folder argument functions through host predicates.', () => {
            const localInterpreter = Interpreter.Create({
                fileExists: (pathName) => pathName === 'data/sample.m',
                folderExists: (pathName) => pathName === 'src' || pathName === 'doc',
            });
            localInterpreter.Execute(['function y = filevalidated(x)', '  arguments', '    x {mustBeFile}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = foldervalidated(x)', '  arguments', '    x {mustBeFolder}', '  end', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('filevalidated("data/sample.m"); foldervalidated(["src","doc"])'))).toBe('data/sample.m\n[src,doc]\n');
            expect(() => localInterpreter.Execute('filevalidated("missing.m")')).toThrow("arguments block validation failed for 'x': mustBeFile.");
            expect(() => localInterpreter.Execute('filevalidated(["data/sample.m","other.m"])')).toThrow("arguments block validation failed for 'x': mustBeFile.");
            expect(() => localInterpreter.Execute('foldervalidated(["src","missing"])')).toThrow("arguments block validation failed for 'x': mustBeFolder.");
        });

        it('Should validate file and folder property functions through host predicates.', () => {
            const localInterpreter = Interpreter.Create({
                fileExists: (pathName) => pathName === 'data/default.m' || pathName === 'data/other.m',
                folderExists: (pathName) => pathName === 'src',
            });
            localInterpreter.Execute(
                ['classdef PathValidatedProperties', '  properties', '    File {mustBeFile} = "data/default.m"', '    Folder {mustBeFolder} = "src"', '  end', 'end'].join('\n'),
            );

            localInterpreter.Execute('p = PathValidatedProperties();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.File; p.Folder'))).toBe('data/default.m\nsrc\n');
            localInterpreter.Execute('p.File = "data/other.m";');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.File'))).toBe('data/other.m\n');
            expect(() => localInterpreter.Execute('p.File = "missing.m"')).toThrow("property validation failed for 'File': mustBeFile.");
            expect(() => localInterpreter.Execute('p.Folder = "missing"')).toThrow("property validation failed for 'Folder': mustBeFolder.");
        });

        it('Should validate underlying type property functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'classdef UnderlyingTypeValidatedProperties',
                    '  properties',
                    '    Value {mustBeUnderlyingType(Value, ["double","logical"])} = 1',
                    '    CellValue {mustBeUnderlyingType(CellValue, "cell")} = {1}',
                    '  end',
                    'end',
                ].join('\n'),
            );

            localInterpreter.Execute('p = UnderlyingTypeValidatedProperties();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.Value; p.CellValue'))).toBe('1\n{1}\n');
            localInterpreter.Execute('p.Value = true;');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.Value'))).toBe('true\n');
            expect(() => localInterpreter.Execute("p.Value = 'bad'")).toThrow("property validation failed for 'Value': mustBeUnderlyingType.");
            expect(() => localInterpreter.Execute('p.CellValue = [1,2]')).toThrow("property validation failed for 'CellValue': mustBeUnderlyingType.");
        });

        it('Should validate nonmissing property functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['classdef NonmissingValidatedProperties', '  properties', '    Value {mustBeNonmissing} = 1', "    CellText {mustBeNonmissing} = {'abc'}", '  end', 'end'].join('\n'),
            );

            localInterpreter.Execute('p = NonmissingValidatedProperties();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.Value; p.CellText'))).toBe('1\n{abc}\n');
            localInterpreter.Execute('p.Value = [1,2];');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.Value'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('p.Value = [1, NaN]')).toThrow("property validation failed for 'Value': mustBeNonmissing.");
            expect(() => localInterpreter.Execute("p.CellText = {''}")).toThrow("property validation failed for 'CellText': mustBeNonmissing.");
        });

        it('Should validate numeric property argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = positiveinteger(x)', '  arguments', '    x double {mustBePositive, mustBeInteger}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = integervalidated(x)', '  arguments', '    x {mustBeInteger}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = floatvalidated(x)', '  arguments', '    x {mustBeFloat}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonnegativevalidated(x)', '  arguments', '    x double {mustBeNonnegative}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = finitevalidated(x)', '  arguments', '    x double {mustBeFinite}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = finitepurevalidated(x)', '  arguments', '    x {mustBeFinite}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = realonly(x)', '  arguments', '    x double {mustBeReal}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = realpurevalidated(x)', '  arguments', '    x {mustBeReal}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = numericorlogicalvalidated(x)', '  arguments', '    x {mustBeNumericOrLogical}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonzerovalidated(x)', '  arguments', '    x {mustBeNonzero}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = negativevalidated(x)', '  arguments', '    x {mustBeNegative}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonpositivevalidated(x)', '  arguments', '    x {mustBeNonpositive}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonnanvalidated(x)', '  arguments', '    x {mustBeNonNan}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonmissingvalidated(x)', '  arguments', '    x {mustBeNonmissing}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonsparsevalidated(x)', '  arguments', '    x {mustBeNonsparse}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = sparsevalidated(x)', '  arguments', '    x {mustBeSparse}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('positiveinteger(2)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('floatvalidated([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('floatvalidated(true)')).toThrow("arguments block validation failed for 'x': mustBeFloat.");
            expect(() => localInterpreter.Execute('positiveinteger(-1)')).toThrow("arguments block validation failed for 'x': mustBePositive.");
            expect(() => localInterpreter.Execute('positiveinteger(2.5)')).toThrow("arguments block validation failed for 'x': mustBeInteger.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('nonnegativevalidated(0)'))).toBe('0\n');
            expect(() => localInterpreter.Execute('nonnegativevalidated(-1)')).toThrow("arguments block validation failed for 'x': mustBeNonnegative.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('finitevalidated(3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('finitevalidated(1/0)')).toThrow("arguments block validation failed for 'x': mustBeFinite.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('realonly(3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('realonly(1+2i)')).toThrow("arguments block validation failed for 'x': mustBeReal.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('integervalidated(true); finitepurevalidated(true); realpurevalidated(true)'))).toBe('true\ntrue\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('numericorlogicalvalidated([0,1])'))).toBe('[0,1]\n');
            expect(() => localInterpreter.Execute("numericorlogicalvalidated('abc')")).toThrow("arguments block validation failed for 'x': mustBeNumericOrLogical.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('nonzerovalidated([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('nonzerovalidated([1,0])')).toThrow("arguments block validation failed for 'x': mustBeNonzero.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('negativevalidated([-1,-2]); nonpositivevalidated([-1,0]); nonnanvalidated([1,2])'))).toBe('[-1,-2]\n[-1,0]\n[1,2]\n');
            expect(() => localInterpreter.Execute('negativevalidated(0)')).toThrow("arguments block validation failed for 'x': mustBeNegative.");
            expect(() => localInterpreter.Execute('nonpositivevalidated(1)')).toThrow("arguments block validation failed for 'x': mustBeNonpositive.");
            expect(() => localInterpreter.Execute('nonnanvalidated([1, NaN])')).toThrow("arguments block validation failed for 'x': mustBeNonNan.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("nonmissingvalidated([1,2]); nonmissingvalidated('abc'); nonmissingvalidated({'abc'})"))).toBe('[1,2]\nabc\n{abc}\n');
            expect(() => localInterpreter.Execute('nonmissingvalidated([1, NaN])')).toThrow("arguments block validation failed for 'x': mustBeNonmissing.");
            expect(() => localInterpreter.Execute("nonmissingvalidated({''})")).toThrow("arguments block validation failed for 'x': mustBeNonmissing.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('nonsparsevalidated([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('sparsevalidated([1,2])')).toThrow("arguments block validation failed for 'x': mustBeSparse.");
        });

        it('Should validate mustBeA argument functions.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef MustBeAArgBase', 'end'].join('\n'));
            localInterpreter.Execute(['classdef MustBeAArgChild < MustBeAArgBase', 'end'].join('\n'));
            localInterpreter.Execute(['function y = mustbeaclass(x)', '  arguments', '    x {mustBeA(x, ["double","MustBeAArgBase"])}', '  end', '  y = class(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function y = mustbeacellclass(x)', '  arguments', "    x {mustBeA(x, {'char','string'})}", '  end', '  y = class(x);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('mustbeaclass(3); mustbeaclass(MustBeAArgChild()); mustbeacellclass("ok")'))).toBe('double\nMustBeAArgChild\nstring\n');
            expect(() => localInterpreter.Execute("mustbeaclass('bad')")).toThrow("arguments block validation failed for 'x': mustBeA.");
            expect(() => localInterpreter.Execute('mustbeacellclass(3)')).toThrow("arguments block validation failed for 'x': mustBeA.");
        });

        it('Should validate mustBeUnderlyingType argument functions.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['function y = underlyingdoubleorlogical(x)', '  arguments', '    x {mustBeUnderlyingType(x, ["double","logical"])}', '  end', '  y = class(x);', 'end'].join('\n'),
            );
            localInterpreter.Execute(['function y = underlyingcell(x)', '  arguments', "    x {mustBeUnderlyingType(x, {'cell'})}", '  end', '  y = class(x);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('underlyingdoubleorlogical(3); underlyingdoubleorlogical(true); underlyingcell({1,2})'))).toBe(
                'double\nlogical\ncell\n',
            );
            expect(() => localInterpreter.Execute("underlyingdoubleorlogical('bad')")).toThrow("arguments block validation failed for 'x': mustBeUnderlyingType.");
            expect(() => localInterpreter.Execute('underlyingcell([1,2])')).toThrow("arguments block validation failed for 'x': mustBeUnderlyingType.");
        });

        it('Should validate mustBeOdd argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = oddonly(x)', '  arguments', '    x {mustBeOdd}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('oddonly(3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('oddonly([-3,1,5])'))).toBe('[-3,1,5]\n');
            expect(() => localInterpreter.Execute('oddonly(2)')).toThrow("arguments block validation failed for 'x': mustBeOdd.");
            expect(() => localInterpreter.Execute('oddonly(2.5)')).toThrow("arguments block validation failed for 'x': mustBeOdd.");
            expect(() => localInterpreter.Execute('oddonly(1+2i)')).toThrow("arguments block validation failed for 'x': mustBeOdd.");
        });

        it('Should call custom unary argument validator functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function mustBeAtLeastThree(x)', '  if x < 3', '    customValidatorFailed', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['function y = customvalidated(x)', '  arguments', '    x {mustBeAtLeastThree}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('customvalidated(3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('customvalidated([3,4])'))).toBe('[3,4]\n');
            expect(() => localInterpreter.Execute('customvalidated(2)')).toThrow("'customValidatorFailed' undefined.");
        });

        it('Should call explicit custom argument validator functions with function-scope values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function mustBeAbove(x, limit)', '  if x <= limit', '    customLimitValidatorFailed', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['function y = customparamvalidated(x, limit)', '  arguments', '    x {mustBeAbove(x, limit)}', '    limit', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('customparamvalidated(5, 3)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('customparamvalidated(3, 3)')).toThrow("'customLimitValidatorFailed' undefined.");
        });

        it('Should resolve missing custom argument validators at call time.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = missingcustomvalidator(x)', '  arguments', '    x {mustBeMissingValidator}', '  end', '  y = x;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('missingcustomvalidator(1)')).toThrow("'mustBeMissingValidator' undefined.");
        });

        it('Should validate parametrized comparison argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = unitinterval(x)', '  arguments', '    x double {mustBeGreaterThanOrEqual(x, 0), mustBeLessThanOrEqual(x, 1)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            localInterpreter.Execute(
                ['function y = strictpositivebelowten(x)', '  arguments', '    x double {mustBeGreaterThan(x, 0), mustBeLessThan(x, 10)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('unitinterval([0,0.5,1])'))).toBe('[0,0.5,1]\n');
            expect(() => localInterpreter.Execute('unitinterval(-0.1)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThanOrEqual.");
            expect(() => localInterpreter.Execute('unitinterval(1.1)')).toThrow("arguments block validation failed for 'x': mustBeLessThanOrEqual.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('strictpositivebelowten(5)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('strictpositivebelowten(0)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThan.");
            expect(() => localInterpreter.Execute('strictpositivebelowten(10)')).toThrow("arguments block validation failed for 'x': mustBeLessThan.");
        });

        it('Should evaluate parametrized comparison bounds in function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = greaterthanbase(base, x)', '  arguments', '    base double', '    x double {mustBeGreaterThan(x, base)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('greaterthanbase(3, 4)'))).toBe('4\n');
            expect(() => localInterpreter.Execute('greaterthanbase(3, 3)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThan.");
        });

        it('Should evaluate parametrized comparison validators as function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = reversecomparison(x)', '  arguments', '    x {mustBeGreaterThan(0, x)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('reversecomparison(-1)'))).toBe('-1\n');
            expect(() => localInterpreter.Execute('reversecomparison(1)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThan.");
        });

        it('Should validate mustBeInRange argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = ranged(x)', '  arguments', '    x double {mustBeInRange(x, 0, 1)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('ranged([0,0.5,1])'))).toBe('[0,0.5,1]\n');
            expect(() => localInterpreter.Execute('ranged(-0.1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(() => localInterpreter.Execute('ranged(1.1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should evaluate mustBeInRange bounds in function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = rangedbyparams(lo, hi, x)', '  arguments', '    lo double', '    hi double', '    x double {mustBeInRange(x, lo, hi)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('rangedbyparams(10, 20, [10,15,20])'))).toBe('[10,15,20]\n');
            expect(() => localInterpreter.Execute('rangedbyparams(10, 20, 9)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(() => localInterpreter.Execute('rangedbyparams(10, 20, 21)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should evaluate mustBeInRange validators as function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = reverserange(x)', '  arguments', '    x {mustBeInRange(0, x, 1)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('reverserange(-1)'))).toBe('-1\n');
            expect(() => localInterpreter.Execute('reverserange(0.5)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should validate mustBeInRange boundary options.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = excludeupper(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'exclude-upper')}", '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = excludelower(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'exclude-lower')}", '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = excludeboth(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'exclude-both')}", '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('excludeupper(0)'))).toBe('0\n');
            expect(() => localInterpreter.Execute('excludeupper(1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('excludelower(1)'))).toBe('1\n');
            expect(() => localInterpreter.Execute('excludelower(0)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('excludeboth(0.5)'))).toBe('0.5\n');
            expect(() => localInterpreter.Execute('excludeboth(0)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(() => localInterpreter.Execute('excludeboth(1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should reject unknown mustBeInRange options.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = unknownrangeoption(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'outside')}", '  end', '  y = x;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('unknownrangeoption(0.5)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should validate mustBeBetween argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = closedbetween(x)', '  arguments', '    x double {mustBeBetween(x, 0, 1)}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = openbetween(x)', '  arguments', '    x double {mustBeBetween(x, 0, 1, "open")}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = openleftbetween(x)', '  arguments', '    x double {mustBeBetween(x, 0, 1, "openleft")}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = openrightbetween(x)', '  arguments', '    x double {mustBeBetween(x, 0, 1, "openright")}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('closedbetween([0,0.5,1]); openbetween(0.5); openleftbetween(1); openrightbetween(0)'))).toBe('[0,0.5,1]\n0.5\n1\n0\n');
            expect(() => localInterpreter.Execute('closedbetween(-0.1)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
            expect(() => localInterpreter.Execute('openbetween(0)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
            expect(() => localInterpreter.Execute('openbetween(1)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
            expect(() => localInterpreter.Execute('openleftbetween(0)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
            expect(() => localInterpreter.Execute('openrightbetween(1)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
        });

        it('Should validate mustBeBetween aliases and reject unknown options.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = closedleftbetween(x)', '  arguments', '    x {mustBeBetween(x, 0, 1, "closedleft")}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = closedrightbetween(x)', '  arguments', '    x {mustBeBetween(x, 0, 1, "closedright")}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = unknownbetweenoption(x)', '  arguments', '    x {mustBeBetween(x, 0, 1, "outside")}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('closedleftbetween(0); closedrightbetween(1)'))).toBe('0\n1\n');
            expect(() => localInterpreter.Execute('closedleftbetween(1)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
            expect(() => localInterpreter.Execute('closedrightbetween(0)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
            expect(() => localInterpreter.Execute('unknownbetweenoption(0.5)')).toThrow("arguments block validation failed for 'x': mustBeBetween.");
        });

        it('Should validate mustBeBetween property functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['classdef BetweenValidatedProperty', '  properties', '    Value {mustBeBetween(Value, 0, 1, "open")} = 0.5', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = BetweenValidatedProperty();');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.Value'))).toBe('0.5\n');
            localInterpreter.Execute('p.Value = 0.75;');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.Value'))).toBe('0.75\n');
            expect(() => localInterpreter.Execute('p.Value = 0')).toThrow("property validation failed for 'Value': mustBeBetween.");
            expect(() => localInterpreter.Execute('p.Value = 1')).toThrow("property validation failed for 'Value': mustBeBetween.");
        });

        it('Should validate numeric mustBeMember argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = choose(x)', '  arguments', '    x double {mustBeMember(x, [1,2,3])}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('choose(2)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('choose([1,3])'))).toBe('[1,3]\n');
            expect(() => localInterpreter.Execute('choose(4)')).toThrow("arguments block validation failed for 'x': mustBeMember.");
            expect(() => localInterpreter.Execute('choose([1,4])')).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should evaluate mustBeMember allowed values in function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = choosefrom(allowed, x)', '  arguments', '    allowed double', '    x double {mustBeMember(x, allowed)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('choosefrom([10,20], 20)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('choosefrom([10,20], [10,20])'))).toBe('[10,20]\n');
            expect(() => localInterpreter.Execute('choosefrom([10,20], 30)')).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should evaluate mustBeMember validators as function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = reversemember(x)', '  arguments', '    x {mustBeMember([1,2], x)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('reversemember([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('reversemember(1)')).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should validate text mustBeMember argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = textmember(x)', '  arguments', "    x char {mustBeMember(x, {'a','b'})}", '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = celltextmember(x)', '  arguments', "    x cell {mustBeMember(x, {'red','blue'})}", '  end', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute("textmember('a')"))).toBe('a\n');
            expect(() => localInterpreter.Execute("textmember('c')")).toThrow("arguments block validation failed for 'x': mustBeMember.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("celltextmember({'red','blue'})"))).toBe('{red,blue}\n');
            expect(() => localInterpreter.Execute("celltextmember({'red','green'})")).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should validate output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = checkedout(x)', '  arguments', '    x double', '  end', '  arguments (Output)', '    y (1,1) double {mustBeNonnegative}', '  end', '  y = x + 1;', 'end'].join(
                    '\n',
                ),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedout(2)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('checkedout([1,2])')).toThrow("arguments block validation failed for 'y': expected size 1x1, got 1x2.");
            expect(() => localInterpreter.Execute('checkedout(-2)')).toThrow("arguments block validation failed for 'y': mustBeNonnegative.");
        });

        it('Should validate output argument classes.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = textout(x)', '  arguments (Output)', '    y char', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = stringout(x)', '  arguments (Output)', '    y string', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute("textout('ok')"))).toBe('ok\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('stringout("ok")'))).toBe('ok\n');
            expect(() => localInterpreter.Execute('textout("ok")')).toThrow("arguments block validation failed for 'y': expected class char, got string.");
            expect(() => localInterpreter.Execute("stringout('ok')")).toThrow("arguments block validation failed for 'y': expected class string, got char.");
            expect(() => localInterpreter.Execute('textout(3)')).toThrow("arguments block validation failed for 'y': expected class char, got double.");
        });

        it('Should preserve undefined output errors with output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = missingout()', '  arguments (Output)', '    y double', '  end', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('missingout()')).toThrow("'y' undefined.");
        });

        it('Should validate multiple named output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function [a, b] = checkedpair(x)', '  arguments (Output)', '    a (1,1) double {mustBePositive}', '    b (1,2) double', '  end', '  a = x;', '  b = [x, 3];', 'end'].join(
                    '\n',
                ),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = checkedpair(2)'))).toBe('a=2\nb=[2,3]\n');
            expect(() => localInterpreter.Execute('checkedpair(-1)')).toThrow("arguments block validation failed for 'a': mustBePositive.");
        });

        it('Should validate only requested named output arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function [a, b] = skippedoutput(x)', '  arguments (Output)', '    a double', '    b double {mustBePositive}', '  end', '  a = x;', '  b = -1;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = skippedoutput(2)'))).toBe('a=2\n');
            expect(() => localInterpreter.Execute('[a, b] = skippedoutput(2)')).toThrow("arguments block validation failed for 'b': mustBePositive.");
        });

        it('Should ignore tilde declarations in output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [~, b] = checkedignoredoutput(x)', '  arguments (Output)', '    b double {mustBePositive}', '  end', '  b = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = checkedignoredoutput(2)'))).toBe('b=2\n');
            expect(() => localInterpreter.Execute('[~, b] = checkedignoredoutput(-1)')).toThrow("arguments block validation failed for 'b': mustBePositive.");
        });

        it('Should report unassigned requested named outputs with output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('b = 99');
            localInterpreter.Execute(['function [a, b] = missingsecond()', '  arguments (Output)', '    a double', '    b double', '  end', '  a = 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = missingsecond()'))).toBe('a=1\n');
            expect(() => localInterpreter.Execute('[a, b] = missingsecond()')).toThrow("'b' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('b'))).toBe('99\n');
        });

        it('Should use default values from arguments blocks for omitted trailing parameters.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = adddefault(x, z)', '  arguments', '    x', '    z = 10', '  end', '  y = x + z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('adddefault(5)'))).toBe('15\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('adddefault(5, 3)'))).toBe('8\n');
        });

        it('Should evaluate argument defaults in function scope after previous parameters are bound.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = defaultfromprevious(x, z)', '  arguments', '    x', '    z = x + 1', '  end', '  y = z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultfromprevious(10)'))).toBe('11\n');
        });

        it('Should evaluate Octave-style default values in function parameter lists.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = signaturedefault(x = 4)', '  y = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = signaturedefaultprevious(x, z = x + 1)', '  y = z;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = signaturedefaultwitharguments(x = 2, z)', '  arguments', '    z = x + 3', '  end', '  y = z;', 'end'].join('\n'));

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        ['signaturedefault();', 'signaturedefault(10);', 'signaturedefaultprevious(5);', 'signaturedefaultprevious(5, 20);', 'signaturedefaultwitharguments();'].join('\n'),
                    ),
                ),
            ).toBe('5\n11\n6\n20\n5\n');
            expect(() => localInterpreter.Execute(['function y = invaliddefaultvarargin(varargin = 1)', '  y = nargin;', 'end'].join('\n'))).toThrow(
                'varargin default value is not supported in function invaliddefaultvarargin.',
            );
            expect(() => localInterpreter.Execute('@(x = 1) x')).toThrow('invalid parameter list in anonymous function.');
        });

        it('Should use Octave colon markers for positional default arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = colondefault(x = 4, z = x + 1)', '  y = x * 10 + z;', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'function y = colonargumentdefault(x, z)',
                    '  arguments',
                    '    x double {mustBePositive} = 2',
                    '    z double {mustBePositive} = x + 3',
                    '  end',
                    '  y = x * 10 + z;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('colondefault(:); colondefault(7, :); colonargumentdefault(:); colonargumentdefault(8, :)'))).toBe('45\n78\n25\n91\n');
            expect(() => localInterpreter.Execute(['function y = colonnondefault(x, z)', '  y = x + z;', 'end', 'colonnondefault(1, :)'].join('\n'))).toThrow(
                "invalid use of default argument marker ':' in function colonnondefault",
            );
        });

        it('Should keep Octave colon default markers out of varargin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = colondefaultvarargin(x, z = 10, varargin)', '  y = x + z + nargin + numel(varargin);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('colondefaultvarargin(5, :, 9)'))).toBe('19\n');
            expect(() => localInterpreter.Execute('colondefaultvarargin(5, 3, :)')).toThrow("invalid use of default argument marker ':' in function colondefaultvarargin");
        });

        it('Should use Octave colon markers for constructor default arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'classdef ColonDefaultConstructed',
                    '  properties',
                    '    Value = 0;',
                    '  end',
                    '  methods',
                    '    function obj = ColonDefaultConstructed(x = 4, z = x + 1)',
                    '      obj.Value = x * 10 + z;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('ColonDefaultConstructed(:).Value; ColonDefaultConstructed(7, :).Value'))).toBe('45\n78\n');
        });

        it('Should keep required parameters before defaulted trailing parameters mandatory.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = needsfirst(x, z)', '  arguments', '    x', '    z = 10', '  end', '  y = x + z;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('needsfirst()')).toThrow('invalid number of arguments in function needsfirst');
        });

        it('Should allow varargin after defaulted fixed parameters.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = defaultwithvarargin(x, z, varargin)', '  arguments', '    x', '    z = 10', '    varargin', '  end', '  y = x + z + nargin;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultwithvarargin(5)'))).toBe('16\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultwithvarargin(5, 3, 9)'))).toBe('11\n');
        });

        it('Should support recursive user-defined function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = recsum(n)', '  if n <= 0', '    y = 0;', '    return', '  end', '  y = n + recsum(n - 1);', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('recsum(5)'))).toBe('15\n');
        });

        it('Should support mutually recursive user-defined function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = isevenrec(n)',
                    '  if n == 0',
                    '    y = 1;',
                    '    return',
                    '  end',
                    '  y = isoddrec(n - 1);',
                    'end',
                    '',
                    'function y = isoddrec(n)',
                    '  if n == 0',
                    '    y = 0;',
                    '    return',
                    '  end',
                    '  y = isevenrec(n - 1);',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('isevenrec(4); isoddrec(5)'))).toBe('1\n1\n');
        });

        it('Should keep variable shadowing of function names local to the function workspace.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = shadowtarget(x)', '  y = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = shadowcaller()', '  shadowtarget = 10;', '  y = shadowtarget;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('shadowcaller()'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('shadowtarget(5)'))).toBe('6\n');
        });

        it('Should keep captured named handles bound to the defining function after redefinition.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = handletarget(x)', '  y = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute('h = @handletarget');
            localInterpreter.Execute(['function y = handletarget(x)', '  y = x + 100;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('h(1); handletarget(1)'))).toBe('2\n101\n');
        });

        it('Should validate name-value defaults and explicit values in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = scaledwithoption(x, opts)', '  arguments', '    x double', '    opts.Scale (1,1) double {mustBePositive} = 2', '  end', '  y = x * opts.Scale;', 'end'].join(
                    '\n',
                ),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaledwithoption(5)'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaledwithoption(5, Scale=3)'))).toBe('15\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaledwithoption(5, "sca", 4)'))).toBe('20\n');
            expect(() => localInterpreter.Execute('scaledwithoption(5, Scale=-1)')).toThrow("arguments block validation failed for 'opts.Scale': mustBePositive.");
        });

        it('Should expand comma-separated lists into name-value argument pairs.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = scaledwithoptionlist(x, opts)',
                    '  arguments',
                    '    x double',
                    '    opts.Scale (1,1) double {mustBePositive} = 2',
                    '  end',
                    '  y = x * opts.Scale;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('xargs = {5}; nvpairs = {"Scale", 3}; scaledwithoptionlist(xargs{:}, nvpairs{:})'))).toBe(
                'xargs={5}\nnvpairs={Scale,3}\n15\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nvpairs = {"sca", 4}; scaledwithoptionlist(5, nvpairs{:})'))).toBe('nvpairs={sca,4}\n20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaledwithoptionlist(5, nvpairs{:}, Scale=5)'))).toBe('25\n');
        });

        it('Should keep expanded name-value-like lists positional for ordinary varargin functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = countordinary(varargin)', '  y = nargin;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('nvpairs = {"Scale", 3}; countordinary(nvpairs{:})'))).toBe('nvpairs={Scale,3}\n2\n');
        });

        it('Should reset persistent state for all user functions after clear functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = persistenta()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = persistentb()', '  persistent c = 10;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('persistenta(); persistenta(); persistentb()'))).toBe('1\n2\n11\n');
            localInterpreter.Execute('clear functions');
            localInterpreter.Execute(['function y = persistenta()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = persistentb()', '  persistent c = 10;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('persistenta(); persistentb()'))).toBe('1\n11\n');
        });
    });
});
