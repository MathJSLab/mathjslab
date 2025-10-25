/**
 * get-antlr.ts: This script gets the latest version of ANTLR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import getHtmlParsed from './helper/getHtmlParsed';
import downloadIfNotExist from './helper/downloadIfNotExist';
import { exit } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resourceDir: string;

/* Process command line. */
if (process.argv.length === 2) {
    resourceDir = 'res';
} else if (process.argv.length === 3) {
    resourceDir = process.argv[2];
} else {
    console.log('Usage:\n  tsx get-antlr.ts [directory]');
    exit(1);
}

(async () => {
    console.log(`Running ${__filename} ...`);
    console.log('Getting the latest version of ANTLR ...');
    console.log('Output directory:', resourceDir);
    const links = Array.from(((await getHtmlParsed('https://www.antlr.org/download.html')) as unknown as HTMLElement).querySelectorAll('a'));
    let antlrVersion = '';
    const antlrUrl =
        'https://www.antlr.org/' +
        (
            links.filter((link) => {
                const match = /^download\/antlr\-([0-9\.]+)\-complete\.jar$/.exec((link.attributes as any).href);
                if (match) {
                    antlrVersion = match[1];
                    return true;
                } else {
                    return false;
                }
            })[0].attributes as any
        ).href;
    const antlrPath = path.resolve(__dirname, '..', resourceDir, 'antlr-complete.jar');
    const antlrVersionPath = path.resolve(__dirname, '..', resourceDir, 'antlr-version.txt');
    const antlrLicenseUrl = 'https://raw.githubusercontent.com/antlr/antlr4/refs/heads/dev/LICENSE.txt';
    const antlrLicensePath = path.resolve(__dirname, '..', resourceDir, 'antlr-LICENSE.txt');
    let antlrInstalledVersion: string;
    try {
        fs.accessSync(antlrPath, fs.constants.R_OK);
        fs.accessSync(antlrVersionPath, fs.constants.R_OK);
        fs.accessSync(antlrLicensePath, fs.constants.R_OK);
        antlrInstalledVersion = fs.readFileSync(antlrVersionPath, 'utf-8').trim();
    } catch {
        antlrInstalledVersion = '0.0.0';
    }
    if (antlrInstalledVersion !== antlrVersion) {
        try {
            fs.unlinkSync(antlrPath);
            fs.unlinkSync(antlrVersionPath);
        } catch {}
        console.log(`Downloading ANTLR version ${antlrVersion} ...`);
        await downloadIfNotExist(antlrUrl, antlrPath);
        await downloadIfNotExist(antlrLicenseUrl, antlrLicensePath);
        fs.writeFileSync(antlrVersionPath, antlrVersion);
        console.log(`Downloading ANTLR version ${antlrVersion} done.`);
    } else {
        console.log('The last version of ANTLR is installed.');
    }
    console.log('Getting the latest version of ANTLR done.');
    console.log(`Running ${__filename} done.\n\n`);
})();
