/// <reference types="jest" />
import path from 'node:path';
import { AST, type NodeExpr, type NodeIdentifier, type NodeInput, type NodeList } from './AST';
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

            expect(AST.isNodeBase(identifier)).toBe(true);
            expect(AST.isNodeIdentifier(identifier)).toBe(true);
            expect(AST.isNodeList(list)).toBe(true);
            expect(AST.isNodeIndexExpr(index)).toBe(true);
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
            expect(() => AST.ensureReturnList(first).selector({ length: 1 }, 2)).toThrow('element number 2 undefined in return list');
        });

        it('Should create declarations and basic jump nodes.', () => {
            const declaration = AST.nodeDeclarationFirst('GLOBAL');
            const x = AST.nodeIdentifier('x');

            AST.nodeAppendDeclaration(declaration, x);

            expect(declaration).toMatchObject({ type: 'GLOBAL', list: [x], omitAnswer: true, omitOutput: true });
            expect(AST.getDeclarationNode({ node: x })).toBe(x);
            expect(AST.getDeclarationNode(x)).toBe(x);
            expect(AST.nodeIgnoredTarget()).toMatchObject({ type: '<~>', omitAnswer: true, omitOutput: false });
            expect(AST.nodeReturn()).toMatchObject({ type: 'RETURN', omitAnswer: true, omitOutput: true });
            expect(AST.nodeBreak()).toMatchObject({ type: 'BREAK', omitAnswer: true, omitOutput: true });
            expect(AST.nodeContinue()).toMatchObject({ type: 'CONTINUE', omitAnswer: true, omitOutput: true });
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
            expect(definition.return.list[0].parent).toBe(definition);
            expect(definition.parameter.list[0].parent).toBe(definition);
            expect(definition.statements.list[0].parent).toBe(definition);
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

            expect(validation.type).toBe('ARGVALID');
            expect(name.parent).toBe(validation);
            expect(validation.size.map((node) => node.parent)).toEqual([validation, validation]);
            expect(cl.parent).toBe(validation);
            expect(validator.parent).toBe(validation);
            expect(dflt.parent).toBe(validation);
            expect(args.type).toBe('ARGS');
            expect(attribute.parent).toBe(args);
            expect(validation.parent).toBe(args);
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
    });

    describe('Class node factories and external factories', () => {
        it('Should create class definitions, sections, members, and attribute tables.', () => {
            const classAttr = AST.nodeClassAttribute(AST.nodeIdentifier('Sealed'));
            const methodAttr = AST.nodeClassAttribute(AST.nodeIdentifier('Static'));
            const property = AST.nodeClassProperty(AST.nodeIdentifier('value'), AST.nodeNumber('1') as NodeExpr);
            const event = AST.nodeClassEvent(AST.nodeIdentifier('Changed'));
            const enumeration = AST.nodeClassEnumeration(AST.nodeIdentifier('On'), AST.nodeListFirst(AST.nodeNumber('1') as NodeInput));
            const section = AST.nodeClassSection('PROPERTIES', AST.nodeList([property, event, enumeration] as unknown as NodeInput[]), AST.nodeListFirst(methodAttr));
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
            expect(enumeration.args[0].parent).toBe(enumeration);
        });

        it('Should delegate string, number, and row factories after reload.', () => {
            AST.reload();

            const text = AST.nodeString('abc', '"');
            const number = AST.nodeNumber('2');
            const row = AST.nodeList([number, Complex.one()] as unknown as NodeInput[]);
            const matrix = AST.nodeFirstRow(row);
            const appended = AST.nodeAppendRow(matrix, AST.nodeListFirst(Complex.zero() as unknown as NodeInput));
            const empty = AST.nodeFirstRow();

            expect(text).toBeInstanceOf(CharString);
            expect(text.str).toBe('abc');
            expect(Complex.realToNumber(number)).toBe(2);
            expect(matrix).toBeInstanceOf(MultiArray);
            expect(appended.dimension[0]).toBe(2);
            expect(empty).toBeInstanceOf(MultiArray);
        });
    });
});
