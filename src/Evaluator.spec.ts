import path from 'node:path';
import { Evaluator } from './Evaluator';

let evaluator: Evaluator;
const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        evaluator = new Evaluator();
    });

    it(`${unitName} should be defined.`, () => {
        expect(Evaluator).toBeDefined();
        expect(evaluator).toBeInstanceOf(Evaluator);
    });

    it('Should parse, evaluate and unparse a simple real expression.', () => {
        const tree = evaluator.Parse('1+2*3');
        const value = evaluator.Evaluate(tree);
        const unparsed = evaluator.Unparse(tree);
        expect(value.list[0].re.toNumber()).toBe(7);
        expect(unparsed === '1+2*3\n').toBe(true);
    }, 10000);
});
