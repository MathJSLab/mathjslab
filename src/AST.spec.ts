/// <reference types="jest" />
import path from 'node:path';
import { AST, type NodeExpr, type NodeIdentifier, type NodeInput, type RuntimeExpressionValue, type StrictNodeExpr } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { MultiArray } from './MultiArray';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        AST.reload();
    });

    describe('Definition', () => {
        it(`${unitName} should be defined.`, () => {
            expect(AST).toBeDefined();
            expect(AST.reload).toBeDefined();
        });
    });

    describe('Scalar and list node factories', () => {
        it('Should normalize identifiers and create explicit void nodes.', () => {
            expect(AST.nodeIdentifier(' a b\r\nc ').id).toBe('abc');
            expect(AST.nodeVoid()).toEqual({
                type: 'VOID',
                omitAnswer: true,
                omitOutput: true,
            });
        });

        it('Should create shallow node copies without aliasing the object itself.', () => {
            const child = AST.nodeIdentifier('x');
            const source = { type: 'WRAP', child };
            const copy = AST.nodeCopy(source);

            expect(copy).not.toBe(source);
            expect(copy).toEqual(source);
            expect(copy.child).toBe(child);
        });

        it('Should narrow common AST node shapes with type guards.', () => {
            const identifier = AST.nodeIdentifier('x');
            const list = AST.nodeListFirst(identifier);
            const index = AST.nodeIndexExpr(AST.nodeIdentifier('A'), AST.nodeListFirst(AST.nodeIdentifier('i')));
            const ref = AST.nodeIndirectRef(AST.nodeIdentifier('obj'), 'field');
            const ignored = AST.nodeIgnoredTarget();
            const defaulted = AST.nodeOperation('=', AST.nodeIdentifier('x'), Complex.one() as NodeExpr);
            const prefix = AST.nodeOperation('~', AST.nodeIdentifier('flag'));
            const postfix = AST.nodeOperation('_++', AST.nodeIdentifier('i'));
            const returnList = AST.nodeReturnList(() => Complex.one() as NodeExpr);
            const declaration = AST.nodeDeclarationFirst('GLOBAL');
            const importDeclaration = AST.nodeImportFirst(AST.nodeIdentifier('pkg.Name'));
            const statement = AST.nodeIfBegin(AST.nodeIdentifier('condition'), AST.nodeListFirst(AST.nodeReturn()));
            const classMember = AST.nodeClassEvent(AST.nodeIdentifier('Changed'));
            const metaclass = AST.nodeMetaClass(AST.nodeIdentifier('Sample'));
            const range = AST.nodeRange(AST.nodeNumber('1') as NodeExpr, AST.nodeNumber('2') as NodeExpr);
            const ctor = AST.nodeSuperclassConstructor(AST.nodeIdentifier('obj'), AST.nodeIdentifier('Base'));
            const commandWordList = AST.nodeCmdWList(AST.nodeIdentifier('help'), AST.nodeListFirst(AST.nodeString('plot') as unknown as NodeInput));
            const legacyExpressionCarriers: NodeExpr[] = [list, statement, classMember];
            const runtimeExpressions: RuntimeExpressionValue[] = [Complex.one(), AST.nodeString('runtime text'), MultiArray.emptyArray()];
            const strictExpressions: StrictNodeExpr[] = [
                Complex.one(),
                AST.nodeString('text'),
                identifier,
                commandWordList,
                index,
                ref,
                ignored,
                defaulted,
                returnList,
                metaclass,
                range,
                ctor,
            ];

            expect(AST.isNodeBase(identifier)).toBe(true);
            expect(AST.isNodeIdentifier(identifier)).toBe(true);
            expect(AST.isNodeList(list)).toBe(true);
            expect(AST.isNodeCmdWList(commandWordList)).toBe(true);
            expect(AST.isNodeIndexExpr(index)).toBe(true);
            expect(AST.isNodeSuperclassConstructor(ctor)).toBe(true);
            expect(AST.isNodeRange(range)).toBe(true);
            expect(AST.isNodeColon(AST.nodeColon())).toBe(true);
            expect(AST.isNodeEndRange(AST.nodeEndRange())).toBe(true);
            expect(AST.isNodeIndirectRef(ref)).toBe(true);
            expect(AST.isNodeReturnList(returnList)).toBe(true);
            expect(AST.isNodeIgnoredTarget(ignored)).toBe(true);
            expect(AST.isNodeOperation(defaulted)).toBe(true);
            expect(AST.isNodeBinaryOperation(defaulted)).toBe(true);
            expect(AST.isNodePrefixOperation(prefix)).toBe(true);
            expect(AST.isNodePostfixOperation(postfix)).toBe(true);
            expect(AST.isNodeFunctionReturn(ignored)).toBe(true);
            expect(AST.isNodeFunctionParameter(defaulted)).toBe(true);
            expect(AST.isNodeDefaultedParameter(defaulted)).toBe(true);
            expect(AST.isNodeAssignmentTarget(index)).toBe(true);
            expect(AST.isNodeAssignmentTarget(MultiArray.emptyArray())).toBe(true);
            expect(AST.isNodeDeclaration(declaration)).toBe(true);
            expect(AST.isNodeImport(importDeclaration)).toBe(true);
            expect(AST.isNodeStatement(statement)).toBe(true);
            expect(AST.isNodeMetaClass(metaclass)).toBe(true);
            expect(AST.isRuntimeExpressionValue(Complex.one())).toBe(true);
            expect(AST.isRuntimeExpressionValue(AST.nodeString('text'))).toBe(true);
            expect(runtimeExpressions.every((node) => AST.isRuntimeExpressionValue(node))).toBe(true);
            expect(AST.isExpressionBoundaryValue(identifier)).toBe(true);
            expect(AST.isExpressionBoundaryValue(list)).toBe(true);
            expect(AST.isExpressionBoundaryValue(statement)).toBe(false);
            expect(legacyExpressionCarriers.every((node) => !AST.isStrictNodeExpr(node))).toBe(true);
            expect(strictExpressions.every((node) => AST.isStrictNodeExpr(node))).toBe(true);
            expect(AST.isStrictNodeExpr(list)).toBe(false);
            expect(AST.isStrictNodeExpr(statement)).toBe(false);
            expect(AST.requireStrictNodeExpr(identifier)).toBe(identifier);
            expect(() => AST.requireStrictNodeExpr(list, 'test list')).toThrow('test list is not an expression node.');
            expect(() => AST.requireStrictNodeExpr(statement, 'test statement')).toThrow('test statement is not an expression node.');
            expect(AST.isNodeClassEvent(classMember)).toBe(true);
            expect(AST.isNodeClassMember(classMember)).toBe(true);
            expect(AST.isNodeDefaultedParameter({ type: '=', left: AST.nodeIdentifier('x') })).toBe(false);
            expect(AST.isNodeIdentifier(Complex.one())).toBe(false);
            expect(AST.isNodeBase(null)).toBe(false);
        });

        it('Should attach parent pointers when building and appending lists.', () => {
            const x = AST.nodeIdentifier('x');
            const list = AST.nodeListFirst(x);
            const y = AST.nodeIdentifier('y');

            AST.appendNodeList(list, y);

            expect(list.type).toBe('LIST');
            expect(list.list).toEqual([x, y]);
            expect(x.parent).toBe(list);
            expect(y.parent).toBe(list);
        });

        it('Should create command word list nodes from identifiers and string arguments.', () => {
            const command = AST.nodeIdentifier('disp');
            const arg = AST.nodeString('hello');
            const args = AST.nodeListFirst(arg as unknown as NodeInput);
            const node = AST.nodeCmdWList(command, args);

            expect(node.type).toBe('CMDWLIST');
            expect(node.id).toBe('disp');
            expect(node.args).toEqual([arg]);
            expect(command.parent).toBe(node);
            expect(arg.parent).toBe(node);
            expect(node.omitAnswer).toBe(true);
            expect(node.omitOutput).toBe(false);
        });

        it('Should promote identifiers to empty command word list nodes without loose mutation.', () => {
            const command = AST.nodeIdentifier('help');
            const parent = AST.nodeListFirst(command);
            command.index = 3;
            command.start = { line: 1, column: 10 };
            command.stop = { line: 1, column: 14 };
            command.omitOutput = true;

            const node = AST.nodeEmptyCmdWList(command);

            expect(node.type).toBe('CMDWLIST');
            expect(node.id).toBe('help');
            expect(node.args).toEqual([]);
            expect(node.parent).toBe(parent);
            expect(node.index).toBe(3);
            expect(node.start).toEqual({ line: 1, column: 10 });
            expect(node.stop).toEqual({ line: 1, column: 14 });
            expect(node.omitAnswer).toBe(true);
            expect(node.omitOutput).toBe(true);
            expect(command.parent).toBe(node);
        });

        it('Should reject non-string command word list arguments.', () => {
            expect(() => AST.nodeCmdWList(AST.nodeIdentifier('disp'), AST.nodeListFirst(AST.nodeReturn()))).toThrow('command argument 1 is not a command word.');
        });
    });

    describe('Expression node factories', () => {
        it('Should create index expressions with delimiter and parent pointers.', () => {
            const expr = AST.nodeIdentifier('A');
            const i = AST.nodeIdentifier('i');
            const j = AST.nodeIdentifier('j');
            const args = AST.nodeList([i, j]);
            const index = AST.nodeIndexExpr(expr, args, '{}');

            expect(index.type).toBe('IDX');
            expect(index.expr).toBe(expr);
            expect(index.args).toEqual([i, j]);
            expect(index.delim).toBe('{}');
            expect(expr.parent).toBe(index);
            expect(i.parent).toBe(index);
            expect(j.parent).toBe(index);
            expect(i.index).toBe(0);
            expect(j.index).toBe(1);
        });

        it('Should reject non-expression values in expression factories.', () => {
            expect(() => AST.nodeIndexExpr(AST.nodeReturn() as NodeExpr)).toThrow('indexed expression is not an expression node.');
            expect(() => AST.nodeIndexExpr(AST.nodeIdentifier('A'), AST.nodeListFirst(AST.nodeReturn()))).toThrow('index argument 1 is not an expression node.');
            expect(() => AST.nodeSuperclassConstructor(AST.nodeReturn() as NodeExpr, AST.nodeIdentifier('Base'))).toThrow('superclass constructor instance is not an expression node.');
            expect(() => AST.nodeSuperclassConstructor(AST.nodeIdentifier('obj'), AST.nodeIdentifier('Base'), AST.nodeListFirst(AST.nodeReturn()))).toThrow(
                'superclass constructor argument 1 is not an expression node.',
            );
        });

        it('Should create range, colon, end-range, and superclass constructor nodes.', () => {
            const start = AST.nodeNumber('1') as NodeExpr;
            const stride = AST.nodeNumber('2') as NodeExpr;
            const stop = AST.nodeNumber('5') as NodeExpr;
            const range = AST.nodeRange(start, stop, stride);

            expect(range.type).toBe('RANGE');
            expect(range.start_).toBe(start);
            expect(range.stride_).toBe(stride);
            expect(range.stop_).toBe(stop);
            expect(start.parent).toBe(range);
            expect(stride.parent).toBe(range);
            expect(stop.parent).toBe(range);
            expect(AST.nodeColon().type).toBe(':');
            expect(AST.nodeEndRange().type).toBe('ENDRANGE');

            const instance = AST.nodeIdentifier('obj');
            const superclass = AST.nodeIdentifier('Base');
            const arg = AST.nodeIdentifier('x');
            const ctor = AST.nodeSuperclassConstructor(instance, superclass, AST.nodeListFirst(arg));

            expect(ctor.type).toBe('SUPERCLASS_CTOR');
            expect(ctor.instance).toBe(instance);
            expect(ctor.superclass).toBe(superclass);
            expect(ctor.args).toEqual([arg]);
            expect(instance.parent).toBe(ctor);
            expect(superclass.parent).toBe(ctor);
            expect(arg.parent).toBe(ctor);

            const className = AST.nodeIdentifier('Sample');
            const metaclass = AST.nodeMetaClass(className);
            expect(metaclass.className).toBe(className);
            expect(className.parent).toBe(metaclass);
        });

        it('Should reject non-expression values in range and operation factories.', () => {
            expect(() => AST.nodeRange(AST.nodeReturn() as NodeExpr, AST.nodeNumber('2') as NodeExpr)).toThrow('range start is not an expression node.');
            expect(() => AST.nodeRange(AST.nodeNumber('1') as NodeExpr, AST.nodeReturn() as NodeExpr)).toThrow('range stop is not an expression node.');
            expect(() => AST.nodeRange(AST.nodeNumber('1') as NodeExpr, AST.nodeNumber('2') as NodeExpr, AST.nodeReturn() as NodeExpr)).toThrow('range stride is not an expression node.');
            expect(() => AST.nodeOperation('+', AST.nodeReturn() as NodeExpr, AST.nodeIdentifier('x'))).toThrow('left operand for + is not an expression node.');
            expect(() => AST.nodeOperation('+', AST.nodeIdentifier('x'), AST.nodeReturn() as NodeExpr)).toThrow('right operand for + is not an expression node.');
            expect(() => AST.nodeOperation('+_', AST.nodeReturn() as NodeExpr)).toThrow('operand for +_ is not an expression node.');
            expect(() => AST.nodeOperation('_++', AST.nodeReturn() as NodeExpr)).toThrow('operand for _++ is not an expression node.');
            expect(() => AST.nodeOperation('+', AST.nodeIdentifier('x'))).toThrow('right operand for + is missing.');
            expect(() => AST.nodeOperation('+', AST.nodeIdentifier('x'), AST.nodeListFirst(AST.nodeIdentifier('y')) as unknown as NodeExpr)).toThrow(
                'right operand for + is not an expression node.',
            );
            const assignmentCarrier = AST.nodeOperation('=', AST.nodeIdentifier('x'), AST.nodeListFirst(AST.nodeIdentifier('y')) as unknown as NodeExpr);
            expect(AST.isNodeBinaryOperation(assignmentCarrier)).toBe(true);
            expect(AST.isNodeBinaryOperation(assignmentCarrier) ? assignmentCarrier.right.type : '').toBe('LIST');
        });

        it('Should build unary, binary, postfix, and assignment operation nodes.', () => {
            const left = AST.nodeIdentifier('a');
            const right = AST.nodeIdentifier('b');
            const sum = AST.nodeOperation('+', left, right);

            expect(sum).toMatchObject({ type: '+', left, right, omitAnswer: false, omitOutput: false });
            expect(left.parent).toBe(sum);
            expect(right.parent).toBe(sum);

            const negArg = AST.nodeIdentifier('x');
            const neg = AST.nodeOperation('-_', negArg);
            expect(neg).toMatchObject({ type: '-_', right: negArg, omitAnswer: false, omitOutput: false });
            expect(negArg.parent).toBe(neg);

            const postArg = AST.nodeIdentifier('i');
            const post = AST.nodeOperation('_++', postArg);
            expect(post).toMatchObject({ type: '_++', left: postArg, omitAnswer: true, omitOutput: false });
            expect(postArg.parent).toBe(post);

            const target = AST.nodeIdentifier('x');
            const value = AST.nodeNumber('1') as NodeExpr;
            const assignment = AST.nodeOperation('=', target, value);
            expect(assignment.omitAnswer).toBe(true);
        });

        it('Should append indirect references to an existing reference chain.', () => {
            const base = AST.nodeIdentifier('obj');
            const first = AST.nodeIndirectRef(base, 'field');
            const dynamic = AST.nodeIdentifier('dynamic');
            const second = AST.nodeIndirectRef(first, dynamic);

            expect(second).toBe(first);
            expect(base.parent).toBe(first);
            expect(second.field).toHaveLength(2);
            expect(second.field[0]).toBe('field');
            expect((second.field[1] as NodeIdentifier).id).toBe('dynamic');
            expect(dynamic.parent).toBe(first);
        });

        it('Should reject non-expression values in indirect reference factories.', () => {
            expect(() => AST.nodeIndirectRef(AST.nodeReturn() as NodeExpr, 'field')).toThrow('indirect reference object is not an expression node.');
            expect(() => AST.nodeIndirectRef(AST.nodeIdentifier('obj'), AST.nodeReturn() as NodeExpr)).toThrow('indirect reference field is not an expression node.');
        });
    });

    describe('Function and control-flow node factories', () => {
        it('Should create return lists and reduce them to their first selected value.', () => {
            const first = AST.nodeIdentifier('first');
            const second = AST.nodeIdentifier('second');
            const returnList = AST.nodeReturnList(
                (evaluated, index) => (index === 0 ? first : second),
                (length) => ({ length, first, second }),
            );
            const parent = AST.nodeListFirst(returnList as unknown as NodeInput);

            const reduced = AST.reduceToFirstIfReturnList(returnList as unknown as NodeInput);

            expect(returnList.handler(2)).toMatchObject({ length: 2, first, second });
            expect(reduced).toBe(first);
            expect(reduced.parent).toBe(parent);
            expect(() => AST.ensureReturnList(first).selector(AST.ensureReturnList(first).handler(2), 1)).toThrow('element number 2 undefined in return list');
        });

        it('Should create comma-separated return lists with expansion metadata.', () => {
            const first = AST.nodeIdentifier('first');
            const second = AST.nodeIdentifier('second');
            const returnList = AST.nodeCommaSeparatedReturnList(
                2,
                (evaluated, index) => (index === 0 ? evaluated.first : evaluated.second),
                (length) => ({ length, first, second }),
            );

            const evaluated = returnList.handler(2);

            expect(returnList.commaSeparated).toBe(true);
            expect(returnList.returnListLength).toBe(2);
            expect(evaluated).toMatchObject({ length: 2, first, second });
            expect(returnList.selector(evaluated, 0)).toBe(first);
            expect(returnList.selector(evaluated, 1)).toBe(second);
        });

        it('Should create bounded return lists with standard arity diagnostics.', () => {
            const first = AST.nodeIdentifier('first');
            const second = AST.nodeIdentifier('second');
            const returnList = AST.nodeBoundedReturnList(
                2,
                (evaluated, index) => (index === 0 ? evaluated.first : evaluated.second),
                (length) => ({ length, first, second }),
            );

            const evaluated = returnList.handler(2);

            expect(evaluated).toMatchObject({ length: 2, first, second });
            expect(returnList.selector(evaluated, 1)).toBe(second);
            expect(() => returnList.handler(3)).toThrow('element number 3 undefined in return list');
            expect(() => returnList.selector({ length: 3 }, 0)).toThrow('element number 3 undefined in return list');
        });

        it('Should create declarations and basic jump nodes.', () => {
            const declaration = AST.nodeDeclarationFirst('GLOBAL');
            const x = AST.nodeIdentifier('x');
            const persistent = AST.nodeDeclarationFirst('PERSIST');
            const defaulted = AST.nodeDefaultedParameter(AST.nodeIdentifier('cached'), AST.nodeNumber('1') as NodeExpr);

            AST.nodeAppendDeclaration(declaration, x);
            AST.nodeAppendDeclaration(persistent, defaulted);

            expect(declaration).toMatchObject({ type: 'GLOBAL', list: [x], omitAnswer: true, omitOutput: true });
            expect(persistent.list).toEqual([defaulted]);
            expect(AST.isNodeDefaultedParameter(defaulted)).toBe(true);
            expect(AST.getDeclarationNode({ node: x })).toBe(x);
            expect(AST.getDeclarationNode(x)).toBe(x);
            expect(AST.nodeIgnoredTarget()).toMatchObject({ type: '<~>', omitAnswer: true, omitOutput: false });
            expect(AST.nodeReturn()).toMatchObject({ type: 'RETURN', omitAnswer: true, omitOutput: true });
            expect(AST.nodeBreak()).toMatchObject({ type: 'BREAK', omitAnswer: true, omitOutput: true });
            expect(AST.nodeContinue()).toMatchObject({ type: 'CONTINUE', omitAnswer: true, omitOutput: true });
        });

        it('Should reject invalid declaration entries.', () => {
            expect(() => AST.nodeAppendDeclaration(AST.nodeDeclarationFirst('GLOBAL'), AST.nodeReturn() as NodeExpr)).toThrow('declaration entry has invalid node type.');
        });

        it('Should create function handles and function definitions with parent pointers.', () => {
            const id = AST.nodeIdentifier('f');
            const param = AST.nodeIdentifier('x');
            const expression = AST.nodeIdentifier('x');
            const handle = AST.nodeFunctionHandle(id, AST.nodeListFirst(param), expression);

            expect(handle).toBeInstanceOf(FunctionHandle);
            expect(handle.id).toBe('f');
            expect(param.parent).toBe(handle);
            expect(expression.parent).toBe(handle);

            const ret = AST.nodeIdentifier('y');
            const body = AST.nodeListFirst(AST.nodeReturn());
            const definition = AST.nodeFunctionDefinition(AST.nodeIdentifier('g'), AST.nodeListFirst(ret), AST.nodeListFirst(AST.nodeIdentifier('x')), AST.nodeListFirst(), body);

            expect(definition.type).toBe('FCNDEF');
            expect(definition.id).toBe('g');
            expect(definition.mapper).toBe(true);
            expect(definition.return.parent).toBe(definition);
            expect(definition.parameter.parent).toBe(definition);
            expect(definition.arguments.parent).toBe(definition);
            expect(definition.statements.parent).toBe(definition);
            expect(definition.return.list[0].parent).toBe(definition);
            expect(definition.parameter.list[0].parent).toBe(definition);
            expect(definition.statements.list[0].parent).toBe(definition);
        });

        it('Should create anonymous function handles with validated signatures.', () => {
            const ignored = AST.nodeIgnoredTarget();
            const named = AST.nodeIdentifier('x');
            const variadic = AST.nodeIdentifier('varargin');
            const body = AST.nodeIdentifier('x');
            const handle = AST.nodeFunctionHandle(null, AST.nodeList([ignored, named, variadic]), body);

            expect(handle).toBeInstanceOf(FunctionHandle);
            expect(handle.id).toBeUndefined();
            expect(handle.parameter).toEqual([ignored, named, variadic]);
            expect(ignored.parent).toBe(handle);
            expect(named.parent).toBe(handle);
            expect(variadic.parent).toBe(handle);
            expect(body.parent).toBe(handle);
        });

        it('Should reject non-expression values in function handle factories.', () => {
            expect(() => AST.nodeFunctionHandle(null, AST.nodeListFirst(AST.nodeReturn()), null)).toThrow('function handle parameter 1 has invalid node type.');
            expect(() => AST.nodeFunctionHandle(null, AST.nodeListFirst(), AST.nodeReturn() as NodeExpr)).toThrow('function handle expression is not an expression node.');
        });

        it('Should reject invalid anonymous function signatures and bodies.', () => {
            const defaulted = AST.nodeDefaultedParameter(AST.nodeIdentifier('x'), AST.nodeNumber('1') as NodeExpr);
            const duplicateParameters = AST.nodeList([AST.nodeIdentifier('x'), AST.nodeIdentifier('x')]);
            const misplacedVarargin = AST.nodeList([AST.nodeIdentifier('varargin'), AST.nodeIdentifier('x')]);
            const assignmentBody = AST.nodeOperation('=', AST.nodeIdentifier('x'), AST.nodeNumber('1') as NodeExpr);
            const incrementBody = AST.nodeOperation('_++', AST.nodeIdentifier('x'));
            const nestedAssignmentBody = AST.nodeIndexExpr(AST.nodeIdentifier('f'), AST.nodeListFirst(AST.nodeOperation('+=', AST.nodeIdentifier('x'), AST.nodeNumber('1') as NodeExpr)));

            expect(() => AST.nodeFunctionHandle(null, AST.nodeListFirst(defaulted), AST.nodeIdentifier('x'))).toThrow('invalid parameter list in anonymous function.');
            expect(() => AST.nodeFunctionHandle(null, duplicateParameters, AST.nodeIdentifier('x'))).toThrow("duplicate parameter name 'x' in anonymous function.");
            expect(() => AST.nodeFunctionHandle(null, misplacedVarargin, AST.nodeIdentifier('x'))).toThrow('varargin must be the last parameter in anonymous function.');
            expect(() => AST.nodeFunctionHandle(null, AST.nodeListFirst(AST.nodeIdentifier('x')), assignmentBody)).toThrow(
                'anonymous function bodies cannot contain assignment, increment, or decrement operators.',
            );
            expect(() => AST.nodeFunctionHandle(null, AST.nodeListFirst(AST.nodeIdentifier('x')), incrementBody)).toThrow(
                'anonymous function bodies cannot contain assignment, increment, or decrement operators.',
            );
            expect(() => AST.nodeFunctionHandle(null, AST.nodeListFirst(AST.nodeIdentifier('x')), nestedAssignmentBody)).toThrow(
                'anonymous function bodies cannot contain assignment, increment, or decrement operators.',
            );
        });

        it('Should reject invalid node types in function definition lists.', () => {
            const id = AST.nodeIdentifier('f');
            const returns = AST.nodeListFirst(AST.nodeIdentifier('y'));
            const parameters = AST.nodeListFirst(AST.nodeIdentifier('x'));
            const args = AST.nodeListFirst();
            const body = AST.nodeListFirst(AST.nodeReturn());

            expect(() => AST.nodeFunctionDefinition(id, AST.nodeListFirst(AST.nodeNumber('1') as NodeInput), parameters, args, body)).toThrow('function return 1 has invalid node type.');
            expect(() => AST.nodeFunctionDefinition(id, returns, AST.nodeListFirst(AST.nodeReturn()), args, body)).toThrow('function parameter 1 has invalid node type.');
            expect(() => AST.nodeFunctionDefinition(id, returns, parameters, AST.nodeListFirst(AST.nodeReturn()), body)).toThrow('function arguments block 1 has invalid node type.');
            expect(() => AST.nodeFunctionDefinition(id, returns, parameters, args, AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow(
                'function statement 1 has invalid node type.',
            );
        });

        it('Should create argument validation blocks with parent pointers.', () => {
            const name = AST.nodeIdentifier('x');
            const size = AST.nodeList([AST.nodeNumber('1') as NodeInput, AST.nodeNumber('2') as NodeInput]);
            const cl = AST.nodeIdentifier('double');
            const validator = AST.nodeIdentifier('mustBeFinite');
            const dflt = AST.nodeNumber('0') as NodeExpr;
            const validation = AST.nodeArgumentValidation(name, size, cl, AST.nodeListFirst(validator), dflt);
            const attribute = AST.nodeIdentifier('Output');
            const args = AST.nodeArguments(attribute, AST.nodeListFirst(validation as unknown as NodeInput));
            const repeatingArgs = AST.nodeArguments(AST.nodeList([AST.nodeIdentifier('Input'), AST.nodeIdentifier('Repeating')]), AST.nodeListFirst());

            expect(validation.type).toBe('ARGVALID');
            expect(name.parent).toBe(validation);
            expect(validation.size.map((node) => node.parent)).toEqual([validation, validation]);
            expect(cl.parent).toBe(validation);
            expect(validator.parent).toBe(validation);
            expect(dflt.parent).toBe(validation);
            expect(args.type).toBe('ARGS');
            expect(attribute.parent).toBe(args);
            expect(args.attribute).toBe(attribute);
            expect(args.attributes).toEqual([attribute]);
            expect(validation.parent).toBe(args);
            expect(repeatingArgs.attributes.map((node) => node.id)).toEqual(['Input', 'Repeating']);
            expect(repeatingArgs.attributes.map((node) => node.parent)).toEqual([repeatingArgs, repeatingArgs]);
        });

        it('Should reject non-expression values in argument validation factories.', () => {
            expect(() => AST.nodeArgumentValidation(AST.nodeIdentifier('x'), AST.nodeListFirst(AST.nodeReturn()), null, AST.nodeListFirst())).toThrow(
                'argument validation size 1 is not an expression node.',
            );
            expect(() => AST.nodeArgumentValidation(AST.nodeIdentifier('x'), AST.nodeListFirst(), AST.nodeReturn(), AST.nodeListFirst())).toThrow(
                'argument validation class has invalid node type.',
            );
            expect(() => AST.nodeArgumentValidation(AST.nodeIdentifier('x'), AST.nodeListFirst(), null, AST.nodeListFirst(AST.nodeReturn()))).toThrow(
                'argument validation function 1 is not an expression node.',
            );
            expect(() => AST.nodeArgumentValidation(AST.nodeReturn() as NodeExpr, AST.nodeListFirst(), null, AST.nodeListFirst())).toThrow(
                'argument validation name is not an expression node.',
            );
            expect(() => AST.nodeArgumentValidation(AST.nodeIdentifier('x'), AST.nodeListFirst(), null, AST.nodeListFirst(), AST.nodeReturn() as NodeExpr)).toThrow(
                'argument validation default is not an expression node.',
            );
            expect(() => AST.nodeArguments(null, AST.nodeListFirst(AST.nodeReturn()))).toThrow('arguments validation 1 has invalid node type.');
        });

        it('Should create branch and loop nodes with parent pointers.', () => {
            const condition = AST.nodeIdentifier('ok');
            const thenList = AST.nodeListFirst(AST.nodeReturn());
            const nodeIf = AST.nodeIfBegin(condition, thenList);
            const elseList = AST.nodeListFirst(AST.nodeBreak());
            const elseifExpr = AST.nodeIdentifier('other');
            const elseifThen = AST.nodeListFirst(AST.nodeContinue());
            const elseifNode = AST.nodeElseIf(elseifExpr, elseifThen);
            const elseNode = AST.nodeElse(elseList);

            expect(elseifExpr.parent).toBe(elseifNode);
            expect(elseifThen.parent).toBe(elseifNode);
            expect(elseList.parent).toBe(elseNode);

            AST.nodeIfAppendElseIf(nodeIf, elseifNode);
            AST.nodeIfAppendElse(nodeIf, elseNode);

            expect(nodeIf.expression).toEqual([condition, elseifExpr]);
            expect(nodeIf.then).toEqual([thenList, elseifThen]);
            expect(nodeIf.else).toBe(elseList);
            expect(condition.parent).toBe(nodeIf);
            expect(elseifExpr.parent).toBe(nodeIf);
            expect(elseList.parent).toBe(nodeIf);

            const whileNode = AST.nodeWhile(AST.nodeIdentifier('keepGoing'), AST.nodeListFirst(AST.nodeBreak()));
            expect(whileNode.expression.parent).toBe(whileNode);
            expect(whileNode.body.parent).toBe(whileNode);

            const doUntilNode = AST.nodeDoUntil(AST.nodeListFirst(AST.nodeContinue()), AST.nodeIdentifier('done'));
            expect(doUntilNode.body.parent).toBe(doUntilNode);
            expect(doUntilNode.expression.parent).toBe(doUntilNode);

            const forNode = AST.nodeFor(AST.nodeIdentifier('k'), AST.nodeRange(AST.nodeNumber('1') as NodeExpr, AST.nodeNumber('3') as NodeExpr), AST.nodeListFirst(), true);
            expect(forNode.parallel).toBe(true);
            expect(forNode.target.parent).toBe(forNode);
            expect(forNode.expression.parent).toBe(forNode);
            expect(forNode.body.parent).toBe(forNode);
        });

        it('Should reject non-expression values in branch and loop factories.', () => {
            expect(() => AST.nodeIfBegin(AST.nodeReturn() as NodeExpr, AST.nodeListFirst())).toThrow('if condition is not an expression node.');
            expect(() => AST.nodeIfBegin(AST.nodeIdentifier('ok'), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('if body 1 has invalid node type.');
            expect(() => AST.nodeElseIf(AST.nodeReturn() as NodeExpr, AST.nodeListFirst())).toThrow('elseif condition is not an expression node.');
            expect(() => AST.nodeElseIf(AST.nodeIdentifier('ok'), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('elseif body 1 has invalid node type.');
            expect(() => AST.nodeElse(AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('else body 1 has invalid node type.');
            expect(() => AST.nodeSwitch(AST.nodeReturn() as NodeExpr, AST.nodeListFirst())).toThrow('switch expression is not an expression node.');
            expect(() => AST.nodeSwitchCase(AST.nodeReturn() as NodeExpr, AST.nodeListFirst())).toThrow('case expression is not an expression node.');
            expect(() => AST.nodeSwitchCase(AST.nodeIdentifier('one'), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('case body 1 has invalid node type.');
            expect(() => AST.nodeSwitch(AST.nodeIdentifier('x'), AST.nodeListFirst(AST.nodeReturn()))).toThrow('switch case 1 has invalid node type.');
            expect(() => AST.nodeSwitch(AST.nodeIdentifier('x'), AST.nodeListFirst(), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow(
                'otherwise body 1 has invalid node type.',
            );
            expect(() => AST.nodeWhile(AST.nodeReturn() as NodeExpr, AST.nodeListFirst())).toThrow('while condition is not an expression node.');
            expect(() => AST.nodeWhile(AST.nodeIdentifier('ok'), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('while body 1 has invalid node type.');
            expect(() => AST.nodeDoUntil(AST.nodeListFirst(), AST.nodeReturn() as NodeExpr)).toThrow('until condition is not an expression node.');
            expect(() => AST.nodeDoUntil(AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())), AST.nodeIdentifier('done'))).toThrow('do body 1 has invalid node type.');
            expect(() => AST.nodeFor(AST.nodeReturn() as NodeExpr, AST.nodeIdentifier('values'), AST.nodeListFirst())).toThrow('for target is not an expression node.');
            expect(() => AST.nodeFor(AST.nodeIdentifier('k'), AST.nodeReturn() as NodeExpr, AST.nodeListFirst())).toThrow('for expression is not an expression node.');
            expect(() => AST.nodeFor(AST.nodeIdentifier('k'), AST.nodeIdentifier('values'), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow(
                'for body 1 has invalid node type.',
            );
            expect(() => AST.nodeFor(AST.nodeIdentifier('k'), AST.nodeIdentifier('values'), AST.nodeListFirst(), true, AST.nodeReturn() as NodeExpr)).toThrow(
                'for workers is not an expression node.',
            );
            expect(() => AST.nodeSpmd(AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('spmd body 1 has invalid node type.');
            expect(() => AST.nodeSpmd(AST.nodeListFirst(), AST.nodeListFirst(AST.nodeReturn()))).toThrow('spmd worker 1 is not an expression node.');
            expect(() => AST.nodeTry(AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('try body 1 has invalid node type.');
            expect(() => AST.nodeTry(AST.nodeListFirst(), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow('catch body 1 has invalid node type.');
            expect(() => AST.nodeUnwindProtect(AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())), AST.nodeListFirst())).toThrow('unwind_protect body 1 has invalid node type.');
            expect(() => AST.nodeUnwindProtect(AST.nodeListFirst(), AST.nodeListFirst(AST.nodeArguments(null, AST.nodeListFirst())))).toThrow(
                'unwind_protect cleanup 1 has invalid node type.',
            );
        });
    });

    describe('Class node factories and external factories', () => {
        it('Should create class definitions, sections, members, and attribute tables.', () => {
            const classAttr = AST.nodeClassAttribute(AST.nodeIdentifier('Sealed'));
            const methodAttr = AST.nodeClassAttribute(AST.nodeIdentifier('Static'));
            const property = AST.nodeClassProperty(AST.nodeIdentifier('value'), AST.nodeNumber('1') as NodeExpr);
            const event = AST.nodeClassEvent(AST.nodeIdentifier('Changed'));
            const enumeration = AST.nodeClassEnumeration(AST.nodeIdentifier('On'), AST.nodeListFirst(AST.nodeNumber('1') as NodeInput));
            const method = AST.nodeFunctionDefinition(
                AST.nodeIdentifier('step'),
                AST.nodeListFirst(),
                AST.nodeListFirst(AST.nodeIdentifier('obj')),
                AST.nodeListFirst(),
                AST.nodeListFirst(),
            );
            const section = AST.nodeClassSection('PROPERTIES', AST.nodeListFirst(property), AST.nodeListFirst(methodAttr));
            const methods = AST.nodeClassSection('METHODS', AST.nodeListFirst(method));
            const events = AST.nodeClassSection('EVENTS', AST.nodeListFirst(event));
            const enumerations = AST.nodeClassSection('ENUMERATION', AST.nodeListFirst(enumeration));
            const classDef = AST.nodeClassDef(AST.nodeIdentifier('Sample'), AST.nodeListFirst(section), AST.nodeListFirst(classAttr), AST.nodeListFirst(AST.nodeIdentifier('Base')));

            expect(section.attributeTable.Static).toEqual([methodAttr]);
            expect(classDef.attributeTable.Sealed).toEqual([classAttr]);
            expect(classDef.sections).toEqual([section]);
            expect(classDef.superclasses[0].parent).toBe(classDef);
            expect(section.parent).toBe(classDef);
            expect(section.members.parent).toBe(section);
            expect(property.parent).toBe(section);
            expect(property.validation.parent).toBe(property);
            expect(property.validation.default).toBe(property.defaultValue);
            expect(property.defaultValue!.parent).toBe(property.validation);
            expect(method.parent).toBe(methods);
            expect(event.parent).toBe(events);
            expect(enumeration.parent).toBe(enumerations);
            expect(enumeration.args[0].parent).toBe(enumeration);
        });

        it('Should reject non-expression values in class member expression slots.', () => {
            expect(() => AST.nodeClassAttribute(AST.nodeIdentifier('Access'), AST.nodeReturn() as NodeExpr)).toThrow('class attribute value is not an expression node.');
            expect(() => AST.nodeClassEnumeration(AST.nodeIdentifier('On'), AST.nodeListFirst(AST.nodeReturn()))).toThrow('enumeration argument 1 is not an expression node.');
            expect(() => AST.nodeClassProperty(AST.nodeIdentifier('value'), AST.nodeReturn() as NodeExpr)).toThrow('argument validation default is not an expression node.');
        });

        it('Should reject invalid node types in classdef structural lists.', () => {
            const section = AST.nodeClassSection('PROPERTIES', AST.nodeListFirst());
            const attribute = AST.nodeClassAttribute(AST.nodeIdentifier('Sealed'));

            expect(() => AST.nodeClassDef(AST.nodeIdentifier('Sample'), AST.nodeListFirst(AST.nodeReturn()), AST.nodeListFirst(), AST.nodeListFirst())).toThrow(
                'class section 1 has invalid node type.',
            );
            expect(() => AST.nodeClassDef(AST.nodeIdentifier('Sample'), AST.nodeListFirst(section), AST.nodeListFirst(AST.nodeReturn()), AST.nodeListFirst())).toThrow(
                'class attribute 1 has invalid node type.',
            );
            expect(() => AST.nodeClassDef(AST.nodeIdentifier('Sample'), AST.nodeListFirst(section), AST.nodeListFirst(), AST.nodeListFirst(AST.nodeReturn()))).toThrow(
                'superclass 1 has invalid node type.',
            );
            expect(() => AST.nodeClassSection('PROPERTIES', AST.nodeListFirst(), AST.nodeListFirst(AST.nodeReturn()))).toThrow('class section attribute 1 has invalid node type.');
            expect(() => AST.nodeClassSection('PROPERTIES', AST.nodeListFirst(AST.nodeClassEvent(AST.nodeIdentifier('Changed'))))).toThrow('properties member 1 has invalid node type.');
            expect(() => AST.nodeClassSection('METHODS', AST.nodeListFirst(AST.nodeClassProperty(AST.nodeIdentifier('value'))))).toThrow('methods member 1 has invalid node type.');
            expect(() => AST.nodeClassSection('EVENTS', AST.nodeListFirst(AST.nodeClassEnumeration(AST.nodeIdentifier('On'))))).toThrow('events member 1 has invalid node type.');
            expect(() => AST.nodeClassSection('ENUMERATION', AST.nodeListFirst(AST.nodeClassEvent(AST.nodeIdentifier('Changed'))))).toThrow('enumeration member 1 has invalid node type.');
            expect(
                AST.nodeClassDef(AST.nodeIdentifier('SampleOk'), AST.nodeListFirst(section), AST.nodeListFirst(attribute), AST.nodeListFirst(AST.nodeIdentifier('Base'))).sections,
            ).toEqual([section]);
        });

        it('Should expose string, number, and row factories before interpreter reload.', () => {
            const text = AST.nodeString('abc', '"');
            const number = AST.nodeNumber('2');
            const row = AST.nodeList([number, Complex.one()] as unknown as NodeInput[]);
            const matrix = AST.nodeFirstRow(row);
            const appended = AST.nodeAppendRow(matrix, AST.nodeListFirst(Complex.zero() as unknown as NodeInput));
            const empty = AST.nodeFirstRow();
            const firstElement = matrix.array[0][0];
            const appendedElement = appended.array[1][0];

            expect(text).toBeInstanceOf(CharString);
            expect(text.str).toBe('abc');
            expect(Complex.realToNumber(number)).toBe(2);
            expect(matrix).toBeInstanceOf(MultiArray);
            expect(firstElement).toBeDefined();
            expect(firstElement?.parent).toBe(matrix);
            expect(appended.dimension[0]).toBe(2);
            expect(appendedElement).toBeDefined();
            expect(appendedElement?.parent).toBe(appended);
            expect(empty).toBeInstanceOf(MultiArray);
            expect(AST.nodeFirstRow(AST.nodeListFirst(AST.nodeString('cell') as unknown as NodeInput), true).isCell).toBe(true);
        });

        it('Should reject non-expression values in matrix and cell row factories.', () => {
            expect(() => AST.nodeFirstRow(AST.nodeListFirst(AST.nodeReturn()))).toThrow('array element 1 is not an expression node.');
            expect(() => AST.nodeAppendRow(AST.nodeFirstRow(), AST.nodeListFirst(AST.nodeReturn()))).toThrow('array element 1 is not an expression node.');
            expect(() => AST.nodeFirstRow(AST.nodeListFirst(AST.nodeReturn()), true)).toThrow('array element 1 is not an expression node.');
        });
    });
});
