import { URL } from 'node:url';
import http from 'node:http';
import https from 'node:https';

/**
 * Gets the `http` or `https` module according to the protocol in the `url`
 * and executes the GET method on the `url`.
 * @param url
 * @param callback
 * @returns
 */
export default (url: http.RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void): http.ClientRequest => {
    let protocol: string;
    if (typeof url === 'string') {
        protocol = url.substring(0, url.indexOf(':') + 1);
    } else if (url.constructor.name === 'URL' || typeof url === 'object') {
        protocol = url.protocol ?? 'https:';
    } else {
        const message = 'httpGet: Protocol not recognized.';
        console.error(message);
        throw new URIError(message);
    }
    return (protocol === 'https:' ? https : http).get(url, callback);
};
