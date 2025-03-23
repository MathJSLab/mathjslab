import fs from 'node:fs';
import path from 'node:path';
import mkDirIfNotExist from './mkDirIfNotExist';
import httpGet from './httpGet';

/**
 * Downloads the file if it does not exist. Recursively creates the base
 * directories if necessary.
 * @param url
 * @param filePath
 */
export default async function (url: string, filePath: string): Promise<boolean | void> {
    let exist = true;
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
    } catch {
        exist = false;
    }
    return new Promise((resolve: (value?: boolean | void) => void, reject: (reason?: any) => void) => {
        if (exist) {
            resolve(true);
        } else {
            console.log(`Downloading ${url} to ${filePath} ...`);
            const paths = filePath.split(path.sep);
            mkDirIfNotExist(paths.slice(0, paths.length - 1).join(path.sep));
            const file = fs.createWriteStream(filePath);
            httpGet(url, function (response) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloading ${url} to ${filePath} done.`);
                    resolve(false);
                });
                file.on('error', (err) => {
                    console.error(`downloadIfNotExist: ${err.message}`);
                    reject(new EvalError(err.message));
                });
            });
        }
    });
}
