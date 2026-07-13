/// <reference types="jest" />
import path from 'node:path';
import { Interpreter as InterpreterDefinition } from '../../src/Interpreter';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const bundleName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${bundleName} bundle test (.${testExtension} test file).`, () => {
    it('Interpreter (definition) should be defined.', () => {
        expect(InterpreterDefinition).toBeDefined();
    }, 10);
});
