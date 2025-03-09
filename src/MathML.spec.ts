import path from 'node:path';
import { MathML } from './MathML';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    it(`${unitName} and its 'format' property should be defined.`, () => {
        expect(MathML).toBeDefined();
        expect(MathML.format).toBeDefined();
    });
});
