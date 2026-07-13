/// <reference types="jest" />
import type { NodeArguments, NodeClassDef, NodeClassSection, NodeFunctionDefinition, NodeInput, NodeOperation } from './AST';
import { Interpreter } from './Interpreter';

const parseClass = (source: string): NodeClassDef => (Interpreter.Create().Parse(source) as any).list[0] as NodeClassDef;

const idsOf = (list: { list: NodeInput[] }): string[] => list.list.map((node: any) => node.id);

describe('Parser AST compatibility fixtures.', () => {
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
});
