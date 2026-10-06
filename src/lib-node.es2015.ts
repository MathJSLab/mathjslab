import crypto from 'crypto';
import 'globalthis/polyfill';
// Native crypto can be getter-only; install the legacy Node fallback only when absent.
if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', { value: crypto, configurable: true, writable: true });
}
export * from './lib-core';
