/// <reference types="jest" />
import fs from 'node:fs';
import path from 'node:path';
import { runMFileTest } from '../helper/runMFileTest';

interface MFileTestEntry {
    file: string;
    caption: string;
    description: string;
    variable?: string;
}

const mfile = JSON.parse(fs.readFileSync(path.join(__dirname, 'mfile.json'), 'utf8')) as Record<string, MFileTestEntry>;

describe('m-file tests.', () => {
    for (const [test, mfileTest] of Object.entries(mfile)) {
        const variable = mfileTest.variable;
        if (variable) {
            it(`Should complete the m-file test script: ${test}: ${mfileTest.caption}: ${mfileTest.description}`, () => {
                const result = runMFileTest(path.join(__dirname, mfileTest.file), variable);
                expect(result.resultSource).toBe('true');
                expect(result.passed).toBe(true);
            });
        }
    }
});
