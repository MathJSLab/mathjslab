import { Complex } from './Complex';
import { ComplexDecimal } from './ComplexDecimal';
import { ComplexNumber } from './ComplexNumber';

/** Convert owned runtime graphs in place, preserving aliases, cycles and class identity. */
export function migrateNumericValues(roots: readonly unknown[]): void {
    const seen = new Set<object>();
    const pending = [...roots];
    while (pending.length) {
        const value = pending.pop();
        if (value === null || typeof value !== 'object' || seen.has(value)) continue;
        seen.add(value);
        if (value instanceof ComplexDecimal || value instanceof ComplexNumber) {
            if ((Complex.engine === 'number' && value instanceof ComplexDecimal) || (Complex.engine === 'decimal' && value instanceof ComplexNumber)) {
                const converted = Complex.create(value.re, value.im, value.type);
                Object.setPrototypeOf(value, Object.getPrototypeOf(converted));
                Object.assign(value, { re: converted.re, im: converted.im });
            }
            // Parent links may lead to active ASTs that also contain numeric literals.
            pending.push(value.parent);
        } else if (value instanceof Map) {
            for (const [key, entry] of value) pending.push(key, entry);
        } else if (value instanceof Set) {
            pending.push(...value);
        } else {
            // Do not invoke host getters or walk prototypes and built-in function closures.
            for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
                if ('value' in descriptor) pending.push(descriptor.value);
            }
        }
    }
}
