/// <reference types="jest" />
import {
    AST,
    type BinaryOperation,
    type NodeArguments,
    type NodeClassDef,
    type NodeClassSection,
    type NodeFor,
    type NodeFunctionDefinition,
    type NodeIdentifier,
    type NodeIf,
    type NodeIndexExpr,
    type NodeIndirectRef,
    type NodeInput,
    type NodeList,
    type NodeOperation,
    type NodeSpmd,
    type NodeTry,
} from './AST';
import { Complex, type ComplexType } from './Complex';
import { Interpreter } from './Interpreter';
import { MultiArray } from './MultiArray';

const expectNode = <T extends NodeInput>(value: unknown, guard: (candidate: unknown) => candidate is T, name: string): T => {
    const matches = guard(value);
    expect(matches).toBe(true);
    if (!matches) {
        throw new Error(`Expected ${name} node.`);
    }
    return value as T;
};

const parseList = (source: string): NodeList => expectNode(Interpreter.Create().Parse(source), AST.isNodeList, 'list');

const firstParsedNode = <T extends NodeInput>(source: string, guard: (candidate: unknown) => candidate is T, name: string): T => expectNode(parseList(source).list[0], guard, name);

const parseClass = (source: string): NodeClassDef => firstParsedNode(source, AST.isNodeClassDef, 'classdef');

const identifierNode = (node: unknown): NodeIdentifier => expectNode(node, AST.isNodeIdentifier, 'identifier');

const operationNode = (node: unknown): NodeOperation => expectNode(node, AST.isNodeOperation, 'operation');

const binaryOperationNode = (node: unknown): BinaryOperation => expectNode(node, AST.isNodeBinaryOperation, 'binary operation');

const indexNode = (node: unknown): NodeIndexExpr => expectNode(node, AST.isNodeIndexExpr, 'index expression');

const indirectRefNode = (node: unknown): NodeIndirectRef => expectNode(node, AST.isNodeIndirectRef, 'dot reference');

const matrixNode = (node: unknown): MultiArray => {
    expect(MultiArray.isInstanceOf(node)).toBe(true);
    return node as MultiArray;
};

const numericValue = (node: unknown): number => {
    expect(Complex.isInstanceOf(node)).toBe(true);
    return Complex.realToNumber(node as ComplexType);
};

const idsOf = (list: { list: NodeInput[] }): string[] => list.list.map((node) => identifierNode(node).id);

describe('Parser AST compatibility fixtures.', () => {
    it('Should expose source ranges and semicolon output suppression for statement lists.', () => {
        const tree = parseList(['a = 1; b = 2', 'if true', '  c = 3; d = 4', 'end'].join('\n'));
        const first = binaryOperationNode(tree.list[0]);
        const second = binaryOperationNode(tree.list[1]);
        const block = expectNode(tree.list[2], AST.isNodeBase, 'if block');
        const ifBlock = expectNode(block, (node): node is NodeIf => AST.isNodeBase(node) && node.type === 'IF', 'if block');
        const innerFirst = binaryOperationNode(ifBlock.then[0].list[0]);
        const innerSecond = binaryOperationNode(ifBlock.then[0].list[1]);

        expect(first.start).toEqual({ line: 1, column: 0 });
        expect(first.stop).toEqual({ line: 1, column: 4 });
        expect(first.omitOutput).toBe(true);
        expect(second.start).toEqual({ line: 1, column: 7 });
        expect(second.stop).toEqual({ line: 1, column: 11 });
        expect(second.omitOutput).toBe(false);
        expect(ifBlock.start).toEqual({ line: 2, column: 0 });
        expect(ifBlock.stop).toEqual({ line: 4, column: 2 });
        expect(innerFirst.start).toEqual({ line: 3, column: 2 });
        expect(innerFirst.stop).toEqual({ line: 3, column: 6 });
        expect(innerFirst.omitOutput).toBe(true);
        expect(innerSecond.start).toEqual({ line: 3, column: 9 });
        expect(innerSecond.stop).toEqual({ line: 3, column: 13 });
        expect(innerSecond.omitOutput).toBe(false);
    });

    it('Should preserve dynamic field access followed by vector indexing with end.', () => {
        const assignment = binaryOperationNode(parseList('dynamicPick = nested.inner.(dyn)([2,end]);').list[0]);
        const index = indexNode(assignment.right);
        const target = indirectRefNode(index.expr);
        const vectorIndex = matrixNode(index.args[0]);

        expect(assignment.type).toBe('=');
        expect(index.type).toBe('IDX');
        expect(index.delim).toBe('()');
        expect(target.type).toBe('.');
        expect(identifierNode(target.obj).id).toBe('nested');
        expect(target.field[0]).toBe('inner');
        expect(identifierNode(target.field[1]).id).toBe('dyn');
        expect(vectorIndex.dimension).toEqual([1, 2]);
        expect(expectNode(vectorIndex.array[0][1], AST.isNodeBase, 'end-range').type).toBe('ENDRANGE');
    });

    it('Should preserve arithmetic expressions inside cell-indexing braces.', () => {
        const assignment = binaryOperationNode(parseList('picked = C{2*k - 1};').list[0]);
        const index = indexNode(assignment.right);
        const argument = binaryOperationNode(index.args[0]);

        expect(index.delim).toBe('{}');
        expect(identifierNode(index.expr).id).toBe('C');
        expect(argument.type).toBe('-');
        expect(binaryOperationNode(argument.left).type).toBe('*');
        expect(numericValue(argument.right)).toBe(1);
    });

    it('Should preserve end expressions inside cell-indexing braces.', () => {
        const assignment = binaryOperationNode(parseList('picked = C{end - 1};').list[0]);
        const index = indexNode(assignment.right);
        const argument = binaryOperationNode(index.args[0]);

        expect(index.delim).toBe('{}');
        expect(argument.type).toBe('-');
        expect(expectNode(argument.left, AST.isNodeBase, 'end-range').type).toBe('ENDRANGE');
        expect(numericValue(argument.right)).toBe(1);
    });

    it('Should preserve keyword-like dot fields as literal field names.', () => {
        const assignment = binaryOperationNode(parseList('picked = s.properties.methods.events.enumeration.end;').list[0]);
        const access = indirectRefNode(assignment.right);

        expect(assignment.type).toBe('=');
        expect(access.type).toBe('.');
        expect(identifierNode(access.obj).id).toBe('s');
        expect(access.field).toEqual(['properties', 'methods', 'events', 'enumeration', 'end']);
    });

    it('Should preserve matrix and cell dimensions with trailing row separators.', () => {
        const tree = parseList(['A = [1, 2;];', 'C = {A, [3, 4;', ']};'].join('\n'));
        const matrix = matrixNode(binaryOperationNode(tree.list[0]).right);
        const cell = matrixNode(binaryOperationNode(tree.list[1]).right);
        const nestedMatrix = matrixNode(cell.array[0][1]);

        expect(matrix.dimension).toEqual([1, 2]);
        expect(matrix.isCell).toBe(false);
        expect(cell.dimension).toEqual([1, 2]);
        expect(cell.isCell).toBe(true);
        expect(nestedMatrix.dimension).toEqual([1, 2]);
        expect(nestedMatrix.isCell).toBe(false);
    });

    it('Should ignore empty matrix and cell rows structurally.', () => {
        const tree = parseList(['A = [; 1;; 2;];', 'C = {; A;;; 3;};', 'E = [;];'].join('\n'));
        const matrix = matrixNode(binaryOperationNode(tree.list[0]).right);
        const cell = matrixNode(binaryOperationNode(tree.list[1]).right);
        const empty = matrixNode(binaryOperationNode(tree.list[2]).right);

        expect(matrix.dimension).toEqual([2, 1]);
        expect(numericValue(matrix.array[0][0])).toBe(1);
        expect(numericValue(matrix.array[1][0])).toBe(2);
        expect(cell.dimension).toEqual([2, 1]);
        expect(cell.isCell).toBe(true);
        expect(identifierNode(cell.array[0][0]).id).toBe('A');
        expect(numericValue(cell.array[1][0])).toBe(3);
        expect(empty.dimension).toEqual([0, 0]);
    });

    it('Should expose assignment target lists with indexed, dynamic-field, and ignored targets.', () => {
        const assignment = binaryOperationNode(parseList('[A(1) S.(dyn) ~] = pair(10);').list[0]);
        const targets = matrixNode(assignment.left);
        const indexed = indexNode(targets.array[0][0]);
        const dynamicField = indirectRefNode(targets.array[0][1]);
        const ignored = expectNode(targets.array[0][2], AST.isNodeIgnoredTarget, 'ignored target');

        expect(assignment.type).toBe('=');
        expect(targets.dimension).toEqual([1, 3]);
        expect(indexed.type).toBe('IDX');
        expect(identifierNode(indexed.expr).id).toBe('A');
        expect(numericValue(indexed.args[0])).toBe(1);
        expect(dynamicField.type).toBe('.');
        expect(identifierNode(dynamicField.obj).id).toBe('S');
        expect(identifierNode(dynamicField.field[0]).id).toBe('dyn');
        expect(ignored.type).toBe('<~>');
    });

    it('Should expose empty arguments blocks as empty validation lists.', () => {
        const func = firstParsedNode(
            ['function y = emptyarguments(x)', '  arguments', '  end', '  arguments (Output)', '  end', '  y = x;', 'end'].join('\n'),
            AST.isNodeFunctionDefinition,
            'function definition',
        );
        const [inputArguments, outputArguments] = func.arguments.list as NodeArguments[];

        expect(func.type).toBe('FCNDEF');
        expect(func.id).toBe('emptyarguments');
        expect(inputArguments.type).toBe('ARGS');
        expect(inputArguments.attribute).toBeNull();
        expect(inputArguments.validation).toEqual([]);
        expect(outputArguments.type).toBe('ARGS');
        expect(outputArguments.attribute!.id).toBe('Output');
        expect(outputArguments.validation).toEqual([]);
    });

    it('Should expose endarguments blocks as ordinary arguments nodes.', () => {
        const func = firstParsedNode(
            ['function y = explicitendarguments(x)', '  arguments', '    x double', '  endarguments', '  y = x;', 'end'].join('\n'),
            AST.isNodeFunctionDefinition,
            'function definition',
        );
        const args = func.arguments.list[0] as NodeArguments;

        expect(args.type).toBe('ARGS');
        expect(args.validation).toHaveLength(1);
        expect(identifierNode(args.validation[0].name).id).toBe('x');
        expect(identifierNode(args.validation[0].class).id).toBe('double');
        expect(args.parent).toBe(func);
        expect(args.validation[0].parent).toBe(args);
    });

    it('Should expose classdef method prototypes and negated attributes structurally.', () => {
        const classDef = parseClass(
            [
                'classdef PrototypeClass',
                '  properties (~Dependent, !Hidden)',
                '    x',
                '  end',
                '  methods (Abstract)',
                '    y = foo(obj, x)',
                '    bar(obj)',
                '    [] = reset(obj)',
                '    z = pkg.Factory.make(obj)',
                '  end',
                'end',
            ].join('\n'),
        );

        const properties = classDef.sections.find((section) => section.kind === 'PROPERTIES') as NodeClassSection;
        const methods = classDef.sections.find((section) => section.kind === 'METHODS') as NodeClassSection;
        const dependent = properties.attributeTable.Dependent[0];
        const hidden = properties.attributeTable.Hidden[0];
        const abstract = methods.attributeTable.Abstract[0];
        const [foo, bar, reset, qualified] = methods.members.list as NodeFunctionDefinition[];

        expect(classDef.type).toBe('CLASSDEF');
        expect(classDef.id).toBe('PrototypeClass');
        expect(classDef.sections.map((section) => section.parent)).toEqual([classDef, classDef]);
        expect(properties.members.list[0].parent).toBe(properties);
        expect(methods.members.parent).toBe(methods);

        expect(operationNode(dependent.value).type).toBe('~');
        expect(operationNode(hidden.value).type).toBe('!');
        expect(dependent.value!.parent).toBe(dependent);
        expect(hidden.value!.parent).toBe(hidden);
        expect(abstract.parent).toBe(methods);

        expect(foo.type).toBe('FCNDEF');
        expect(foo.id).toBe('foo');
        expect(foo.attributes?.prototype).toBe(true);
        expect(idsOf(foo.return)).toEqual(['y']);
        expect(idsOf(foo.parameter)).toEqual(['obj', 'x']);
        expect(foo.statements.list).toEqual([]);
        expect(foo.parent).toBe(methods);

        expect(bar.id).toBe('bar');
        expect(bar.attributes?.prototype).toBe(true);
        expect(idsOf(bar.return)).toEqual([]);
        expect(idsOf(bar.parameter)).toEqual(['obj']);
        expect(bar.parent).toBe(methods);

        expect(reset.id).toBe('reset');
        expect(reset.attributes?.prototype).toBe(true);
        expect(idsOf(reset.return)).toEqual([]);
        expect(idsOf(reset.parameter)).toEqual(['obj']);
        expect(reset.parent).toBe(methods);

        expect(qualified.id).toBe('pkg.Factory.make');
        expect(qualified.attributes?.prototype).toBe(true);
        expect(idsOf(qualified.return)).toEqual(['z']);
        expect(idsOf(qualified.parameter)).toEqual(['obj']);
        expect(qualified.parent).toBe(methods);
    });

    it('Should expose classdef attributes before separated class names structurally.', () => {
        const classDef = parseClass(['classdef (Sealed)', 'SeparatedClassAttributes', 'end'].join('\n'));
        const sealed = classDef.attributeTable.Sealed[0];

        expect(classDef.id).toBe('SeparatedClassAttributes');
        expect(classDef.attributes).toHaveLength(1);
        expect(sealed.id).toBe('Sealed');
        expect(sealed.parent).toBe(classDef);
        expect(classDef.sections).toEqual([]);
    });

    it('Should expose classdef property validation declarations structurally.', () => {
        const classDef = parseClass(['classdef ValidatedProperties', '  properties', '    x (1,1) double {mustBePositive} = 1', '  end', 'end'].join('\n'));
        const properties = classDef.sections[0] as NodeClassSection;
        const property = expectNode(properties.members.list[0], AST.isNodeClassProperty, 'class property');

        expect(property.type).toBe('CLASS_PROPERTY');
        expect(property.id).toBe('x');
        expect(property.name.id).toBe('x');
        expect(property.validation.type).toBe('ARGVALID');
        expect(property.validation.name).toBe(property.name);
        expect(property.validation.size).toBe(property.size);
        expect(property.validation.class).toBe(property.class);
        expect(property.validation.functions).toBe(property.functions);
        expect(property.validation.default).toBe(property.defaultValue);
        expect(property.size.map(numericValue)).toEqual([1, 1]);
        expect(identifierNode(property.class).id).toBe('double');
        expect(idsOf({ list: property.functions })).toEqual(['mustBePositive']);
        expect(numericValue(property.defaultValue)).toBe(1);
        expect(property.validation.parent).toBe(property);
        expect(property.name.parent).toBe(property.validation);
        expect(property.size.map((node) => node.parent)).toEqual([property.validation, property.validation]);
        expect(property.class.parent).toBe(property.validation);
        expect(property.functions[0].parent).toBe(property.validation);
        expect(property.defaultValue.parent).toBe(property.validation);
    });

    it('Should expose adjacent class events and enumerations structurally.', () => {
        const classDef = parseClass(['classdef AdjacentClassMembers', '  events Started Finished', '  end', '  enumeration Red(1) Blue(2)', '  end', 'end'].join('\n'));
        const events = classDef.sections[0] as NodeClassSection;
        const enumeration = classDef.sections[1] as NodeClassSection;
        const eventMembers = events.members.list.map((node) => expectNode(node, AST.isNodeClassEvent, 'class event'));
        const enumerationMembers = enumeration.members.list.map((node) => expectNode(node, AST.isNodeClassEnumeration, 'class enumeration'));

        expect(events.kind).toBe('EVENTS');
        expect(eventMembers.map((node) => node.id)).toEqual(['Started', 'Finished']);
        expect(eventMembers.map((node) => node.parent)).toEqual([events, events]);
        expect(enumeration.kind).toBe('ENUMERATION');
        expect(enumerationMembers.map((node) => node.id)).toEqual(['Red', 'Blue']);
        expect(enumerationMembers.map((node) => node.parent)).toEqual([enumeration, enumeration]);
        expect(numericValue(enumerationMembers[0].args[0])).toBe(1);
        expect(numericValue(enumerationMembers[1].args[0])).toBe(2);
    });

    it('Should expose ampersand superclass lists structurally.', () => {
        const classDef = parseClass(['classdef pkg.Child < pkg.Base & handle', 'end'].join('\n'));

        expect(classDef.id).toBe('pkg.Child');
        expect(classDef.superclasses.map((node) => node.id)).toEqual(['pkg.Base', 'handle']);
        expect(classDef.superclasses.map((node) => node.parent)).toEqual([classDef, classDef]);
    });

    it('Should expose function parameter defaults structurally.', () => {
        const func = firstParsedNode(['function y = defaultparams(x = 4, z = x + 1)', '  y = z;', 'end'].join('\n'), AST.isNodeFunctionDefinition, 'function definition');
        const xDefault = binaryOperationNode(func.parameter.list[0]);
        const zDefault = binaryOperationNode(func.parameter.list[1]);

        expect(xDefault.type).toBe('=');
        expect(identifierNode(xDefault.left).id).toBe('x');
        expect(numericValue(xDefault.right)).toBe(4);
        expect(zDefault.type).toBe('=');
        expect(identifierNode(zDefault.left).id).toBe('z');
        expect(zDefault.right.type).toBe('+');
        expect(xDefault.parent).toBe(func);
        expect(zDefault.parent).toBe(func);
    });

    it('Should expose space-separated function return lists structurally.', () => {
        const func = firstParsedNode(['function [a b] = spacereturns(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'), AST.isNodeFunctionDefinition, 'function definition');

        expect(idsOf(func.return)).toEqual(['a', 'b']);
        expect(func.return.list.map((node) => node.parent)).toEqual([func, func]);
    });

    it('Should expose scalar and empty function return lists structurally.', () => {
        const scalar = firstParsedNode(['function y = scalarreturn(x)', '  y = x;', 'end'].join('\n'), AST.isNodeFunctionDefinition, 'function definition');
        const empty = firstParsedNode(['function [] = emptyreturn(x)', '  x = x + 1;', 'end'].join('\n'), AST.isNodeFunctionDefinition, 'function definition');

        expect(idsOf(scalar.return)).toEqual(['y']);
        expect(scalar.return.list[0].parent).toBe(scalar);
        expect(empty.return.list).toEqual([]);
        expect(empty.return.parent).toBe(empty);
    });

    it('Should expose space-separated class method return lists structurally.', () => {
        const classDef = parseClass(['classdef ReturnListClass', '  methods', '    function [a b] = pair(obj, x)', '      a = x;', '      b = x + 1;', '    end', '  end', 'end'].join('\n'));
        const methods = classDef.sections[0] as NodeClassSection;
        const method = methods.members.list[0] as NodeFunctionDefinition;

        expect(method.id).toBe('pair');
        expect(idsOf(method.return)).toEqual(['a', 'b']);
        expect(method.return.list.map((node) => node.parent)).toEqual([method, method]);
    });

    it('Should expose parenthesized parfor worker expressions structurally.', () => {
        const loop = firstParsedNode(['parfor (i = 1:4, workers + 1)', '  total = i;', 'end'].join('\n'), (node): node is NodeFor => AST.isNodeBase(node) && node.type === 'FOR', 'for loop');

        expect(loop.parallel).toBe(true);
        expect(loop.target.type).toBe('IDENT');
        expect(loop.expression.type).toBe('RANGE');
        expect(loop.workers?.type).toBe('+');
        expect(loop.workers?.parent).toBe(loop);
    });

    it('Should expose MATLAB-style spmd worker specifications structurally.', () => {
        const block = firstParsedNode(
            ['spmd (minWorkers, maxWorkers + 1)', '  value = 1;', 'end'].join('\n'),
            (node): node is NodeSpmd => AST.isNodeBase(node) && node.type === 'SPMD',
            'spmd block',
        );

        expect(block.type).toBe('SPMD');
        expect(block.workers).not.toBeNull();
        expect(block.workers!.list).toHaveLength(2);
        expect(identifierNode(block.workers!.list[0]).id).toBe('minWorkers');
        expect(block.workers!.list[1].type).toBe('+');
        expect(block.workers!.parent).toBe(block);
        expect(block.workers!.list.map((node) => node.parent)).toEqual([block.workers, block.workers]);
        expect(block.body.parent).toBe(block);
    });

    it('Should expose catch identifiers only for simple first body statements.', () => {
        const withIdentifier = firstParsedNode(
            ['try', '  x = 1;', 'catch ME', '  y = 2;', '  z = 3;', 'end'].join('\n'),
            (node): node is NodeTry => AST.isNodeBase(node) && node.type === 'TRY',
            'try block',
        );
        const indexedExpression = firstParsedNode(
            ['try', '  x = 1;', 'catch ME(1)', '  y = 2;', 'end'].join('\n'),
            (node): node is NodeTry => AST.isNodeBase(node) && node.type === 'TRY',
            'try block',
        );
        const dottedExpression = firstParsedNode(
            ['try', '  x = 1;', 'catch ME.message', '  y = 2;', 'end'].join('\n'),
            (node): node is NodeTry => AST.isNodeBase(node) && node.type === 'TRY',
            'try block',
        );

        expect(identifierNode(withIdentifier.catchIdentifier).id).toBe('ME');
        expect(withIdentifier.catchIdentifier!.parent).toBe(withIdentifier);
        expect(withIdentifier.catchBody!.list).toHaveLength(2);
        expect(withIdentifier.catchBody!.parent).toBe(withIdentifier);
        expect(withIdentifier.catchBody!.list.map((node) => node.parent)).toEqual([withIdentifier.catchBody, withIdentifier.catchBody]);
        expect(withIdentifier.catchBody!.list.map((node) => node.index)).toEqual([0, 1]);
        expect(identifierNode(binaryOperationNode(withIdentifier.catchBody!.list[0]).left).id).toBe('y');

        expect(indexedExpression.catchIdentifier).toBeNull();
        expect(indexNode(indexedExpression.catchBody!.list[0]).expr).toMatchObject({ id: 'ME' });
        expect(indexedExpression.catchBody!.list[0].parent).toBe(indexedExpression.catchBody);

        expect(dottedExpression.catchIdentifier).toBeNull();
        expect(indirectRefNode(dottedExpression.catchBody!.list[0]).field).toEqual(['message']);
        expect(dottedExpression.catchBody!.list[0].parent).toBe(dottedExpression.catchBody);
    });

    it('Should expose declaration initializers structurally.', () => {
        const declaration = firstParsedNode('global a, b = 2, c = a + b', AST.isNodeDeclaration, 'declaration');
        const first = declaration.list[0];
        const second = binaryOperationNode(declaration.list[1]);
        const third = binaryOperationNode(declaration.list[2]);

        expect(declaration.type).toBe('GLOBAL');
        expect(first.type).toBe('IDENT');
        expect(identifierNode(first).id).toBe('a');
        expect(second.type).toBe('=');
        expect(identifierNode(second.left).id).toBe('b');
        expect(numericValue(second.right)).toBe(2);
        expect(third.type).toBe('=');
        expect(identifierNode(third.left).id).toBe('c');
        expect(third.right.type).toBe('+');
        expect(first.parent).toBe(declaration);
        expect(second.parent).toBe(declaration);
        expect(third.parent).toBe(declaration);
    });

    it('Should expose MATLAB package imports structurally.', () => {
        const declaration = firstParsedNode('import matlab.graphics.*, pkg.sub.ClassName', AST.isNodeImport, 'import declaration');

        expect(declaration.type).toBe('IMPORT');
        expect(declaration.imports.map((entry) => entry.id)).toEqual(['matlab.graphics.*', 'pkg.sub.ClassName']);
        expect(declaration.imports[0].parent).toBe(declaration);
        expect(declaration.imports[0].index).toBe(0);
        expect(declaration.imports[1].parent).toBe(declaration);
        expect(declaration.imports[1].index).toBe(1);
        expect(declaration.omitAnswer).toBe(true);
        expect(declaration.omitOutput).toBe(true);
    });

    it('Should expose bare import queries structurally.', () => {
        const declaration = firstParsedNode('import', AST.isNodeImport, 'import query');

        expect(declaration.type).toBe('IMPORT');
        expect(declaration.imports).toEqual([]);
        expect(declaration.omitAnswer).toBeUndefined();
        expect(declaration.omitOutput).toBeUndefined();
    });

    it('Should expose import queries in expression position.', () => {
        const assignment = binaryOperationNode(firstParsedNode('L = import', AST.isNodeOperation, 'assignment'));
        const query = expectNode(assignment.right, AST.isNodeImport, 'import query');

        expect(query.imports).toEqual([]);
        expect(query.parent).toBe(assignment);
    });
});
