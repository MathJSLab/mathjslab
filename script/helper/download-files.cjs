const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

/**
 * Run curl using spawn.
 * @param {*} src
 * @param {*} dest
 * @returns
 */
async function spawnCurl(src, dest) {
    return new Promise((resolve, reject) => {
        const curl = spawn('curl', ['-k', '-o', dest, src]);
        curl.on('exit', (code) => {
            if (code === 0) {
                console.log(`File downloaded to ${dest}`);
                resolve(code);
            } else {
                console.error(`curl process exited with code ${code}`);
                reject(code);
            }
        });
    });
}
/* Parse command line and set configuration file path. */
globalThis.console.log(`Running ${__filename} ...`);
const defaultConfigFile = 'download.config.json';
const argConfigFilePos = process.argv.length > 2 && process.argv[2].trim() === 'clean' ? 3 : 2;
let downloadConfigPath = process.argv.length > argConfigFilePos ? process.argv[argConfigFilePos] : defaultConfigFile;
if (!path.isAbsolute(downloadConfigPath)) {
    downloadConfigPath = path.resolve(downloadConfigPath);
}
/* Read and parse configuration file. */
const downloadConfig = {};
try {
    fs.accessSync(downloadConfigPath, fs.constants.R_OK);
    Object.assign(downloadConfig, JSON.parse(fs.readFileSync(downloadConfigPath, 'utf-8')));
} catch (err) {
    err.message = `cannot load and parse configuration file at ${downloadConfigPath}\n${err.message}`;
    throw err;
}
if (argConfigFilePos === 3) {
    /* Cleanup downloaded files. */
    globalThis.console.warn(`Removing downloaded files specified in ${downloadConfigPath} ...`);
    Promise.all(
        downloadConfig.files.map(async (file) => {
            let filePath;
            try {
                filePath = path.resolve(file.dest);
                globalThis.console.log(`Removing ${filePath} ...`);
                fs.unlinkSync(filePath);
                globalThis.console.log(`Removing ${filePath} done.`);
            } catch {
                globalThis.console.log(`Cannot remove ${filePath} \nIgnoring...`);
            }
        }),
    ).then((_result) => {
        globalThis.console.warn(`Removing downloaded files specified in ${downloadConfigPath} done.`);
        globalThis.console.log(`Running ${__filename} done.\r\n`);
    });
} else {
    /* Download files. */
    globalThis.console.warn(`Downloading files specified in ${downloadConfigPath} ...`);
    Promise.all(
        downloadConfig.files.map(async (file) => {
            if (!path.isAbsolute(file.dest)) {
                file.dest = path.resolve(file.dest);
            }
            fs.mkdirSync(path.dirname(file.dest), { recursive: true });
            return spawnCurl(file.src, file.dest);
        }),
    ).then((_result) => {
        globalThis.console.warn(`Downloading files specified in ${downloadConfigPath} done.`);
        globalThis.console.log(`Running ${__filename} done.\r\n`);
    });
}
