import path from 'node:path';
import { LinearAlgebra } from './LinearAlgebra';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    it(`${unitName} should be defined.`, () => {
        expect(LinearAlgebra).toBeDefined();
    });

    it('LinearAlgebra.functions and its methods should be defined', () => {
        expect(LinearAlgebra.functions).toBeDefined();
        expect(LinearAlgebra.trace).toBeDefined();
        expect(LinearAlgebra.transpose).toBeDefined();
        expect(LinearAlgebra.ctranspose).toBeDefined();
        expect(LinearAlgebra.mul).toBeDefined();
        expect(LinearAlgebra.det).toBeDefined();
        expect(LinearAlgebra.inv).toBeDefined();
        expect(LinearAlgebra.gauss).toBeDefined();
        expect(LinearAlgebra.lu).toBeDefined();
    });
});
