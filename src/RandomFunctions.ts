import { Complex } from './Complex';
import { CharString } from './CharString';
import { CoreFunctions } from './CoreFunctions';
import { MultiArray, type ElementType } from './MultiArray';
import { Structure } from './Structure';
import { RandomStream } from './RandomStream';
import { AST, type FunctionSignatureEntry } from './AST';

/** Interpreter-owned bindings. Direct Complex.random remains a host utility. */
export class RandomFunctions {
    private readonly stream = new RandomStream();

    /** Restores the interpreter stream to seed zero, matching session reset semantics. */
    public reset(): void {
        this.stream.seed(0);
    }

    /** Extracts a real integer scalar before seed or integer-range validation. */
    private real(value: ElementType): number {
        if (!Complex.isInstanceOf(value) || !Complex.imagIsZero(value) || !Complex.realIsInteger(value)) throw new EvalError('rng/randi: expected real integer scalar.');
        return Complex.realToNumber(value);
    }

    /** Copies generator identity, seed and words into a restorable language-level structure. */
    private snapshot(): Structure {
        const state = this.stream.state;
        const words = new MultiArray([1, 4]);
        words.array[0] = state.words.map((word) => Complex.create(word));
        MultiArray.setType(words);
        return new Structure({ Type: new CharString(RandomStream.type), Seed: Complex.create(state.seed), State: words });
    }

    private rng = (...args: ElementType[]): Structure => {
        const previous = this.snapshot();
        if (!args.length) return previous;
        const [value, type] = args;
        if (type !== undefined && (!CharString.isInstanceOf(type) || type.str !== RandomStream.type)) throw new EvalError(`rng: supported generator is '${RandomStream.type}'.`);
        if (Structure.isInstanceOf(value)) {
            if (
                args.length !== 1 ||
                !CharString.isInstanceOf(value.field.Type) ||
                value.field.Type.str !== RandomStream.type ||
                !MultiArray.isInstanceOf(value.field.State) ||
                value.field.State.isCell
            ) {
                throw new EvalError('rng: invalid state structure.');
            }
            this.stream.restore(
                this.real(value.field.Seed),
                MultiArray.linearize(value.field.State).map((word) => this.real(word)),
            );
        } else if (CharString.isInstanceOf(value)) {
            if (value.str === 'default' && args.length === 1) this.reset();
            else if (value.str === 'shuffle') this.stream.seed((Math.floor(Math.random() * 4294967296) ^ Date.now()) >>> 0);
            else throw new EvalError('rng: expected seed, state, default or shuffle.');
        } else this.stream.seed(this.real(value));
        return previous;
    };

    private randi = (range: ElementType, ...dimensions: ElementType[]): ElementType => {
        const bounds = MultiArray.isInstanceOf(range) ? MultiArray.linearize(range) : [range];
        if (!bounds.length || bounds.length > 2) throw new EvalError('randi: expected imax or [imin,imax].');
        const min = bounds.length === 1 ? 1 : this.real(bounds[0]);
        const max = this.real(bounds[bounds.length - 1]);
        // Validate before allocation or consumption, including empty dimensions.
        if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min || max - min + 1 > 4294967296) {
            throw new EvalError('randi: require safe integer bounds with inclusive width at most 2^32.');
        }
        return CoreFunctions.randomArray(() => Complex.create(this.stream.integer(min, max)), ...dimensions);
    };

    public readonly functions: Record<string, FunctionSignatureEntry> = {
        rand: { func: (...dimensions: ElementType[]) => CoreFunctions.randomArray(() => Complex.create(this.stream.uniform()), ...dimensions), signature: CoreFunctions.randSignature },
        randi: { func: this.randi, signature: CoreFunctions.randiSignature },
        rng: {
            func: (...args: ElementType[]) => {
                const value = this.rng(...args);
                return AST.nodeBoundedReturnList(
                    1,
                    () => value,
                    (length) => ({ length }),
                );
            },
            signature: { inputs: [{ arity: 0 }, { arity: 1 }, { arity: 2 }], outputs: { arity: 1 } },
        },
    };
}
