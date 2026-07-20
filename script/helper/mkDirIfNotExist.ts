import fs from 'node:fs';
import path from 'node:path';

/**
 * Create a directory recursively when it does not already exist.
 *
 * @param dirPath Path segments passed to `path.resolve`.
 */
export default (...dirPath: string[]): void => {
    const directory = path.resolve(...dirPath);
    try {
        fs.accessSync(directory, fs.constants.F_OK);
        console.log(`Directory ${directory} already exists.`);
    } catch {
        console.log(`Creating directory ${directory} ...`);
        fs.mkdirSync(directory, { recursive: true });
        console.log(`Creating directory ${directory} done.`);
    }
};
