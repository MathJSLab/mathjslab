import path from 'node:path';
import { FunctionHandle } from './FunctionHandle';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    it(`${unitName} and its methods should be defined.`, () => {
        expect(FunctionHandle).toBeDefined();
    });
});
