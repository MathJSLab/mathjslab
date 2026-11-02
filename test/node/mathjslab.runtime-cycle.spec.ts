import { execFileSync } from 'node:child_process';

describe('Packaged runtime retained-execution contracts', () => {
    test('executes numerical, script, validation, dynamic and class contracts with cancellation in a real Node Worker', () => {
        expect(() => execFileSync(process.execPath, ['script/validate-runtime-cycle.mjs'], { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })).not.toThrow();
    });
});
