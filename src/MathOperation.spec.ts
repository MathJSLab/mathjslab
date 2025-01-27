import path from 'node:path';
import { MathOperation } from './MathOperation';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    it(`${unitName} and its generic methods should be defined.`, () => {
        expect(MathOperation).toBeDefined();
        expect(MathOperation.copy).toBeDefined();
        expect(MathOperation.mand).toBeDefined();
        expect(MathOperation.mor).toBeDefined();
    });

    it('MathOperation.unaryOperations and its methods should be defined', () => {
        expect(MathOperation.unaryOperations).toBeDefined();
        expect(MathOperation.uplus).toBeDefined();
        expect(MathOperation.uminus).toBeDefined();
        expect(MathOperation.not).toBeDefined();
        expect(MathOperation.transpose).toBeDefined();
        expect(MathOperation.ctranspose).toBeDefined();
    });

    it('MathOperation.binaryOperations and its methods should be defined', () => {
        expect(MathOperation.binaryOperations).toBeDefined();
        expect(MathOperation.minus).toBeDefined();
        expect(MathOperation.mod).toBeDefined();
        expect(MathOperation.rem).toBeDefined();
        expect(MathOperation.rdivide).toBeDefined();
        expect(MathOperation.mrdivide).toBeDefined();
        expect(MathOperation.ldivide).toBeDefined();
        expect(MathOperation.mldivide).toBeDefined();
        expect(MathOperation.power).toBeDefined();
        expect(MathOperation.mpower).toBeDefined();
        expect(MathOperation.le).toBeDefined();
        expect(MathOperation.ge).toBeDefined();
        expect(MathOperation.gt).toBeDefined();
        expect(MathOperation.eq).toBeDefined();
        expect(MathOperation.ne).toBeDefined();
    });

    it('MathOperation.leftAssociativeMultipleOperations and its methods should be defined', () => {
        expect(MathOperation.leftAssociativeMultipleOperations).toBeDefined();
        expect(MathOperation.plus).toBeDefined();
        expect(MathOperation.times).toBeDefined();
        expect(MathOperation.mtimes).toBeDefined();
        expect(MathOperation.and).toBeDefined();
        expect(MathOperation.or).toBeDefined();
        expect(MathOperation.xor).toBeDefined();
    });
});
