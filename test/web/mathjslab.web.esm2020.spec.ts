import path from 'node:path';
import { Evaluator as EvaluatorDefinition } from '../../src/Evaluator';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const bundleName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${bundleName} bundle test (.${testExtension} test file).`, () => {
    it('Evaluator (definition) should be defined.', () => {
        expect(EvaluatorDefinition).toBeDefined();
    }, 10);
});
