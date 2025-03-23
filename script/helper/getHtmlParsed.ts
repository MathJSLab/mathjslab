import http from 'node:http';
import HTMLParser, { HTMLElement, Options } from 'node-html-parser';
import httpGet from './httpGet';

/**
 * Downloads an HTML file and parses it, returning an object of type
 * HTMLElement.
 * @param url
 * @param options
 */
export default async (url: http.RequestOptions | string | URL, options?: Partial<Options>): Promise<HTMLElement | void> => {
    return new Promise((resolve: (value?: HTMLElement | void) => void, reject: (reason?: any) => void) => {
        console.log(`Downloading ${url} ...`);
        httpGet(url, function (response: http.IncomingMessage) {
            let page: string = '';
            response.on('data', (data: string) => {
                page += data;
            });
            response.on('end', () => {
                console.log(`Downloading ${url} done.`);
                console.log(`Parsing ${url} ...`);
                const root = HTMLParser.parse(page, options) as unknown as HTMLElement | void;
                console.log(`Parsing ${url} done.`);
                resolve(root);
            });
            response.on('error', (err: Error) => {
                console.error(`getHtmlParsed: ${err.message}`);
                reject(err.message);
            });
        });
    });
};
