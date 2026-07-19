/// <reference types="jest" />
import type { NodeArguments, NodeClassDef, NodeClassSection, NodeFor, NodeFunctionDefinition, NodeImport, NodeInput, NodeOperation, NodeSpmd } from './AST';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

const idsOf = (list: { list: NodeInput[] }): string[] => list.list.map((node: any) => node.id);

describe('Parser AST compatibility fixtures.', () => {
    it('Should preserve dynamic field access followed by vector indexing with end.', () => {
        const tree = Interpreter.Create().Parse('dynamicPick = nested.inner.(dyn)([2,end]);') as any;
        const assignment = tree.list[0];
        const index = assignment.right;
        const target = index.expr;
        const vectorIndex = index.args[0];

        expect(assignment.type).toBe('=');
        expect(index.type).toBe('IDX');
        expect(index.delim).toBe('()');
        expect(target.type).toBe('.');
        expect(target.obj.id).toBe('nested');
        expect(target.field[0]).toBe('inner');
        expect(target.field[1].type).toBe('IDENT');
        expect(target.field[1].id).toBe('dyn');
        expect(vectorIndex.dimension).toEqual([1, 2]);
        expect(vectorIndex.array[0][1].type).toBe('ENDRANGE');
    });

    it('Should preserve keyword-like dot fields as literal field names.', () => {
        const tree = Interpreter.Create().Parse('picked = s.properties.methods.events.enumeration.end;') as any;
        const assignment = tree.list[0];
        const access = assignment.right;

        expect(assignment.type).toBe('=');
        expect(access.type).toBe('.');
        expect(access.obj.id).toBe('s');
        expect(access.field).toEqual(['properties', 'methods', 'events', 'enumeration', 'end']);
    });

    it('Should preserve matrix and cell dimensions with trailing row separators.', () => {
        const tree = Interpreter.Create().Parse(['A = [1, 2;];', 'C = {A, [3, 4;', ']};'].join('\n')) as any;
        const matrix = tree.list[0].right;
        const cell = tree.list[1].right;
        const nestedMatrix = cell.array[0][1];

        expect(matrix.dimension).toEqual([1, 2]);
        expect(matrix.isCell).toBe(false);
        expect(cell.dimension).toEqual([1, 2]);
        expect(cell.isCell).toBe(true);
        expect(nestedMatrix.dimension).toEqual([1, 2]);
        expect(nestedMatrix.isCell).toBe(false);
    });

    it('Should ignore empty matrix and cell rows structurally.', () => {
        const tree = Interpreter.Create().Parse(['A = [; 1;; 2;];', 'C = {; A;;; 3;};', 'E = [;];'].join('\n')) as any;
        const matrix = tree.list[0].right;
        const cell = tree.list[1].right;
        const empty = tree.list[2].right;

        expect(matrix.dimension).toEqual([2, 1]);
        expect(matrix.array[0][0].re.toNumber()).toBe(1);
        expect(matrix.array[1][0].re.toNumber()).toBe(2);
        expect(cell.dimension).toEqual([2, 1]);
        expect(cell.isCell).toBe(true);
        expect(cell.array[0][0].id).toBe('A');
        expect(cell.array[1][0].re.toNumber()).toBe(3);
        expect(empty.dimension).toEqual([0, 0]);
    });

    it('Should expose assignment target lists with indexed, dynamic-field, and ignored targets.', () => {
        const tree = Interpreter.Create().Parse('[A(1) S.(dyn) ~] = pair(10);') as any;
        const assignment = tree.list[0];
        const targets = assignment.left;
        const indexed = targets.array[0][0];
        const dynamicField = targets.array[0][1];
        const ignored = targets.array[0][2];

        expect(assignment.type).toBe('=');
        expect(targets.dimension).toEqual([1, 3]);
        expect(indexed.type).toBe('IDX');
        expect(indexed.expr.id).toBe('A');
        expect(indexed.args[0].re.toNumber()).toBe(1);
        expect(dynamicField.type).toBe('.');
        expect(dynamicField.obj.id).toBe('S');
        expect(dynamicField.field[0].type).toBe('IDENT');
        expect(dynamicField.field[0].id).toBe('dyn');
        expect(ignored.type).toBe('<~>');
    });

    it('Should expose empty arguments blocks as empty validation lists.', () => {
        const tree = Interpreter.Create().Parse(['function y = emptyarguments(x)', '  arguments', '  end', '  arguments (Output)', '  end', '  y = x;', 'end'].join('\n')) as any;
        const func = tree.list[0] as NodeFunctionDefinition;
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
        const tree = Interpreter.Create().Parse(['function y = explicitendarguments(x)', '  arguments', '    x double', '  endarguments', '  y = x;', 'end'].join('\n')) as any;
        const func = tree.list[0] as NodeFunctionDefinition;
        const args = func.arguments.list[0] as NodeArguments;

        expect(args.type).toBe('ARGS');
        expect(args.validation).toHaveLength(1);
        expect((args.validation[0].name as any).id).toBe('x');
        expect((args.validation[0].class as any).id).toBe('double');
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
        const [foo, bar, qualified] = methods.members.list as NodeFunctionDefinition[];

        expect(classDef.type).toBe('CLASSDEF');
        expect(classDef.id).toBe('PrototypeClass');
        expect(classDef.sections.map((section) => section.parent)).toEqual([classDef, classDef]);
        expect(properties.members.list[0].parent).toBe(properties);
        expect(methods.members.parent).toBe(methods);

        expect((dependent.value as NodeOperation).type).toBe('~');
        expect((hidden.value as NodeOperation).type).toBe('!');
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

        expect(qualified.id).toBe('pkg.Factory.make');
        expect(qualified.attributes?.prototype).toBe(true);
        expect(idsOf(qualified.return)).toEqual(['z']);
        expect(idsOf(qualified.parameter)).toEqual(['obj']);
        expect(qualified.parent).toBe(methods);
    });

    it('Should expose classdef property validation declarations structurally.', () => {
        const classDef = parseClass(['classdef ValidatedProperties', '  properties', '    x (1,1) double {mustBePositive} = 1', '  end', 'end'].join('\n'));
        const properties = classDef.sections[0] as NodeClassSection;
        const property = properties.members.list[0] as any;

        expect(property.type).toBe('CLASS_PROPERTY');
        expect(property.id).toBe('x');
        expect(property.name.id).toBe('x');
        expect(property.validation.type).toBe('ARGVALID');
        expect(property.validation.name).toBe(property.name);
        expect(property.validation.size).toBe(property.size);
        expect(property.validation.class).toBe(property.class);
        expect(property.validation.functions).toBe(property.functions);
        expect(property.validation.default).toBe(property.defaultValue);
        expect(property.size.map((node: any) => node.re.toNumber())).toEqual([1, 1]);
        expect(property.class.id).toBe('double');
        expect(idsOf({ list: property.functions })).toEqual(['mustBePositive']);
        expect(property.defaultValue.re.toNumber()).toBe(1);
        expect(property.validation.parent).toBe(property);
        expect(property.name.parent).toBe(property.validation);
        expect(property.size.map((node: any) => node.parent)).toEqual([property.validation, property.validation]);
        expect(property.class.parent).toBe(property.validation);
        expect(property.functions[0].parent).toBe(property.validation);
        expect(property.defaultValue.parent).toBe(property.validation);
    });

    it('Should expose adjacent class events and enumerations structurally.', () => {
        const classDef = parseClass(['classdef AdjacentClassMembers', '  events Started Finished', '  end', '  enumeration Red(1) Blue(2)', '  end', 'end'].join('\n'));
        const events = classDef.sections[0] as NodeClassSection;
        const enumeration = classDef.sections[1] as NodeClassSection;

        expect(events.kind).toBe('EVENTS');
        expect(events.members.list.map((node: any) => node.id)).toEqual(['Started', 'Finished']);
        expect(events.members.list.map((node: any) => node.parent)).toEqual([events, events]);
        expect(enumeration.kind).toBe('ENUMERATION');
        expect(enumeration.members.list.map((node: any) => node.id)).toEqual(['Red', 'Blue']);
        expect(enumeration.members.list.map((node: any) => node.parent)).toEqual([enumeration, enumeration]);
        expect((enumeration.members.list[0] as any).args[0].re.toNumber()).toBe(1);
        expect((enumeration.members.list[1] as any).args[0].re.toNumber()).toBe(2);
    });

    it('Should expose ampersand superclass lists structurally.', () => {
        const classDef = parseClass(['classdef pkg.Child < pkg.Base & handle', 'end'].join('\n'));

        expect(classDef.id).toBe('pkg.Child');
        expect(classDef.superclasses.map((node) => node.id)).toEqual(['pkg.Base', 'handle']);
        expect(classDef.superclasses.map((node) => node.parent)).toEqual([classDef, classDef]);
    });

    it('Should expose function parameter defaults structurally.', () => {
        const tree = Interpreter.Create().Parse(['function y = defaultparams(x = 4, z = x + 1)', '  y = z;', 'end'].join('\n')) as any;
        const func = tree.list[0] as NodeFunctionDefinition;
        const xDefault = func.parameter.list[0] as any;
        const zDefault = func.parameter.list[1] as any;

        expect(xDefault.type).toBe('=');
        expect(xDefault.left.id).toBe('x');
        expect(xDefault.right.re.toNumber()).toBe(4);
        expect(zDefault.type).toBe('=');
        expect(zDefault.left.id).toBe('z');
        expect(zDefault.right.type).toBe('+');
        expect(xDefault.parent).toBe(func);
        expect(zDefault.parent).toBe(func);
    });

    it('Should expose space-separated function return lists structurally.', () => {
        const tree = Interpreter.Create().Parse(['function [a b] = spacereturns(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n')) as any;
        const func = tree.list[0] as NodeFunctionDefinition;

        expect(func.return.list.map((node: any) => node.id)).toEqual(['a', 'b']);
        expect(func.return.list.map((node: any) => node.parent)).toEqual([func, func]);
    });

    it('Should expose space-separated class method return lists structurally.', () => {
        const classDef = parseClass(['classdef ReturnListClass', '  methods', '    function [a b] = pair(obj, x)', '      a = x;', '      b = x + 1;', '    end', '  end', 'end'].join('\n'));
        const methods = classDef.sections[0] as NodeClassSection;
        const method = methods.members.list[0] as NodeFunctionDefinition;

        expect(method.id).toBe('pair');
        expect(method.return.list.map((node: any) => node.id)).toEqual(['a', 'b']);
        expect(method.return.list.map((node: any) => node.parent)).toEqual([method, method]);
    });

    it('Should expose parenthesized parfor worker expressions structurally.', () => {
        const tree = Interpreter.Create().Parse(['parfor (i = 1:4, workers + 1)', '  total = i;', 'end'].join('\n')) as any;
        const loop = tree.list[0] as NodeFor;

        expect(loop.parallel).toBe(true);
        expect(loop.target.type).toBe('IDENT');
        expect(loop.expression.type).toBe('RANGE');
        expect(loop.workers?.type).toBe('+');
        expect(loop.workers?.parent).toBe(loop);
    });

    it('Should expose MATLAB-style spmd worker specifications structurally.', () => {
        const tree = Interpreter.Create().Parse(['spmd (minWorkers, maxWorkers + 1)', '  value = 1;', 'end'].join('\n')) as any;
        const block = tree.list[0] as NodeSpmd;

        expect(block.type).toBe('SPMD');
        expect(block.workers).not.toBeNull();
        expect(block.workers!.list).toHaveLength(2);
        expect((block.workers!.list[0] as any).id).toBe('minWorkers');
        expect(block.workers!.list[1].type).toBe('+');
        expect(block.workers!.parent).toBe(block);
        expect(block.workers!.list.map((node) => node.parent)).toEqual([block.workers, block.workers]);
        expect(block.body.parent).toBe(block);
    });

    it('Should expose declaration initializers structurally.', () => {
        const tree = Interpreter.Create().Parse('global a, b = 2, c = a + b') as any;
        const declaration = tree.list[0];
        const first = declaration.list[0];
        const second = declaration.list[1] as any;
        const third = declaration.list[2] as any;

        expect(declaration.type).toBe('GLOBAL');
        expect(first.type).toBe('IDENT');
        expect(first.id).toBe('a');
        expect(second.type).toBe('=');
        expect(second.left.id).toBe('b');
        expect(second.right.re.toNumber()).toBe(2);
        expect(third.type).toBe('=');
        expect(third.left.id).toBe('c');
        expect(third.right.type).toBe('+');
        expect(first.parent).toBe(declaration);
        expect(second.parent).toBe(declaration);
        expect(third.parent).toBe(declaration);
    });

    it('Should expose MATLAB package imports structurally.', () => {
        const tree = Interpreter.Create().Parse('import matlab.graphics.*, pkg.sub.ClassName') as any;
        const declaration = tree.list[0] as NodeImport;

        expect(declaration.type).toBe('IMPORT');
        expect(declaration.imports.map((entry) => entry.id)).toEqual(['matlab.graphics.*', 'pkg.sub.ClassName']);
        expect(declaration.imports[0].parent).toBe(declaration);
        expect(declaration.imports[0].index).toBe(0);
        expect(declaration.imports[1].parent).toBe(declaration);
        expect(declaration.imports[1].index).toBe(1);
        expect(declaration.omitAnswer).toBe(true);
        expect(declaration.omitOutput).toBe(true);
    });
});
