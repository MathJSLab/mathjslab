/// <reference types="jest" />
import path from 'node:path';
import { Interpreter as InterpreterDefinition } from '../../src/Interpreter';

// @ts-expect-error ignore
import { Interpreter as namedInterpreter } from '../../lib/mathjslab.web.umd2022';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const __bundleName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${__bundleName} bundle test (.${testExtension} test file).`, () => {
    it('Interpreter (definition) should be defined.', () => {
        expect(InterpreterDefinition).toBeDefined();
    }, 10);

    it('Interpreter (named import) should be defined, can be instantiated and should parse, evaluate and unparse a simple real expression: 1+2*3.', () => {
        expect(namedInterpreter).toBeDefined();
        const interpreterNamed = new namedInterpreter();
        expect(interpreterNamed).toBeInstanceOf(namedInterpreter);
        const tree = interpreterNamed.Parse('1+2*3');
        const value = interpreterNamed.Evaluate(tree);
        const unparsed = interpreterNamed.Unparse(tree);
        expect(value.list[0].re.toNumber()).toBe(7);
        expect(unparsed === '1+2*3\n').toBe(true);
    }, 200);
});
