import path from 'node:path';
import { Evaluator as EvaluatorDefinition } from '../../src/Evaluator';
// @ts-expect-error ignore
import { Evaluator as namedEvaluator } from '../../lib/mathjslab.web.umd2015';
// import * as mathjslabNamespace from '../../lib/mathjslab.web.umd2015';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const bundleName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${bundleName} bundle test (.${testExtension} test file).`, () => {
    it('Evaluator (definition) should be defined.', () => {
        expect(EvaluatorDefinition).toBeDefined();
    }, 10);

    // it('Evaluator (named import) should be defined, can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', () => {
    //     expect(namedEvaluator).toBeDefined();
    //     const evaluatorNamed = new namedEvaluator();
    //     expect(evaluatorNamed).toBeInstanceOf(namedEvaluator);
    //     const tree = evaluatorNamed.Parse('1+2*3');
    //     const value = evaluatorNamed.Evaluate(tree);
    //     const unparsed = evaluatorNamed.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);

    // it('mathjslab (namespace) should be defined, evaluator can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', () => {
    //     // @ts-expect-error ignore
    //     expect(mathjslabNamespace).toBeDefined();
    //     // @ts-expect-error ignore
    //     const evaluatorNamespace = new mathjslabNamespace.Evaluator() as EvaluatorDefinition;
    //     // @ts-expect-error ignore
    //     expect(evaluatorNamespace).toBeInstanceOf(mathjslabNamespace.Evaluator);
    //     const tree = evaluatorNamespace.Parse('1+2*3');
    //     const value = evaluatorNamespace.Evaluate(tree);
    //     const unparsed = evaluatorNamespace.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);

    // it('mathjslab (commonjs) should be defined, evaluator can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', () => {
    //     const mathjslabCJS = require(`../../lib/${__bundlename}`);
    //     expect(mathjslabCJS).toBeDefined();
    //     const evaluatorCJS = new mathjslabCJS.Evaluator();
    //     expect(evaluatorCJS).toBeInstanceOf(mathjslabCJS.Evaluator);
    //     const tree = evaluatorCJS.Parse('1+2*3');
    //     const value = evaluatorCJS.Evaluate(tree);
    //     const unparsed = evaluatorCJS.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);

    // it('mathjslab (dynamic) should be defined, evaluator can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', async () => {
    //     const mathjslabDynamic = await import(`../../lib/${__bundlename}`);
    //     expect(mathjslabDynamic).toBeDefined();
    //     // @ts-expect-error ignore
    //     const evaluatorDynamic = new mathjslabDynamic.Evaluator() as EvaluatorDefinition;
    //     // @ts-expect-error ignore
    //     expect(evaluatorDynamic).toBeInstanceOf(mathjslabDynamic.Evaluator);
    //     const tree = evaluatorDynamic.Parse('1+2*3');
    //     const value = evaluatorDynamic.Evaluate(tree);
    //     const unparsed = evaluatorDynamic.Unparse(tree);
    //     expect(value.list[0].re.toNumber()).toBe(7);
    //     expect(unparsed === '1+2*3\n').toBe(true);
    // }, 200);
});
