/**
 * build-resources.ts: This script obtains the resources needed to build the
 * project, such as downloading the latest version of ANTLR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import getHtmlParsed from './helper/getHtmlParsed';
import downloadIfNotExist from './helper/downloadIfNotExist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourceDir = 'res';

(async () => {
    console.log(`Running ${__filename} ...`);
    console.warn('Getting the latest version of ANTLR ...');
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
    console.warn('Getting the latest version of ANTLR done.');
    console.log(`Running ${__filename} done.\n\n`);
})();
