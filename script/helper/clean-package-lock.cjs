/**
 * clean-package-lock.cjs: This script removes the 'package-lock.json' file
 * and the 'node_modules' directory.
 */
const fs = require('node:fs');
const path = require('node:path');

globalThis.console.log(`Running ${__filename} ...`);
globalThis.console.warn('Removing package-lock.json file and node_modules directory ...');
const root = process.argv.length > 2 ? path.resolve(process.argv[2]) : process.cwd();
globalThis.console.warn('Project root:', root);
const dirPath = path.join(root, 'node_modules');
try {
    fs.accessSync(dirPath, fs.constants.W_OK);
    fs.rmSync(dirPath, { recursive: true, force: true });
    globalThis.console.log(`${dirPath} removed.`);
} catch (err) {
    globalThis.console.error(`Error removing ${dirPath} : ${err.message}`);
    globalThis.console.error('ignoring...');
}
const filePath = path.join(root, 'package-lock.json');
try {
    fs.accessSync(filePath, fs.constants.W_OK);
    fs.unlinkSync(filePath);
    globalThis.console.log(`${filePath} removed.`);
} catch (err) {
    globalThis.console.error(`Error removing ${filePath} : ${err.message}`);
    globalThis.console.error('ignoring...');
}
globalThis.console.warn('Removing package-lock.json file and node_modules directory done.');
globalThis.console.log(`Running ${__filename} done.\r\n`);
