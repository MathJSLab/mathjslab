import path from 'node:path';
import { Interpreter as InterpreterDefinition } from '../../src/Interpreter';
// @ts-expect-error ignore
import { Interpreter as namedInterpreter } from '../../lib/mathjslab.web.umd2015';
// import * as mathjslabNamespace from '../../lib/mathjslab.web.umd2015';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const bundleName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${bundleName} bundle test (.${testExtension} test file).`, () => {
    it('Interpreter (definition) should be defined.', () => {
        expect(InterpreterDefinition).toBeDefined();
    }, 10);

    // it('Interpreter (named import) should be defined, can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', () => {
    //     expect(namedInterpreter).toBeDefined();
    //     const interpreterNamed = new namedInterpreter();
    //     expect(interpreterNamed).toBeInstanceOf(namedInterpreter);
    //     const tree = interpreterNamed.Parse('1+2*3');
    //     const value = interpreterNamed.Evaluate(tree);
    //     const unparsed = interpreterNamed.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);

    // it('mathjslab (namespace) should be defined, interpreter can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', () => {
    //     // @ts-expect-error ignore
    //     expect(mathjslabNamespace).toBeDefined();
    //     // @ts-expect-error ignore
    //     const interpreterNamespace = new mathjslabNamespace.Evaluator() as InterpreterDefinition;
    //     // @ts-expect-error ignore
    //     expect(interpreterNamespace).toBeInstanceOf(mathjslabNamespace.Evaluator);
    //     const tree = interpreterNamespace.Parse('1+2*3');
    //     const value = interpreterNamespace.Evaluate(tree);
    //     const unparsed = interpreterNamespace.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);

    // it('mathjslab (commonjs) should be defined, interpreter can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', () => {
    //     const mathjslabCJS = require(`../../lib/${__bundlename}`);
    //     expect(mathjslabCJS).toBeDefined();
    //     const interpreterCJS = new mathjslabCJS.Evaluator();
    //     expect(interpreterCJS).toBeInstanceOf(mathjslabCJS.Evaluator);
    //     const tree = interpreterCJS.Parse('1+2*3');
    //     const value = interpreterCJS.Evaluate(tree);
    //     const unparsed = interpreterCJS.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);

    // it('mathjslab (dynamic) should be defined, interpreter can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', async () => {
    //     const mathjslabDynamic = await import(`../../lib/${__bundlename}`);
    //     expect(mathjslabDynamic).toBeDefined();
    //     // @ts-expect-error ignore
    //     const interpreterDynamic = new mathjslabDynamic.Evaluator() as InterpreterDefinition;
    //     // @ts-expect-error ignore
    //     expect(interpreterDynamic).toBeInstanceOf(mathjslabDynamic.Evaluator);
    //     const tree = interpreterDynamic.Parse('1+2*3');
    //     const value = interpreterDynamic.Evaluate(tree);
    //     const unparsed = interpreterDynamic.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);
});
