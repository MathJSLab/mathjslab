/** Versioned session-owned pseudorandom stream; no global numeric state. */
export class RandomStream {
    public static readonly type = 'xoshiro128ss-v1';
    private words: number[] = [];
    private seedValue = 0;

    public constructor() {
        this.seed(0);
    }

    public get state(): { seed: number; words: number[] } {
        return { seed: this.seedValue, words: [...this.words] };
    }

    /** Reinitializes the versioned stream from a uint32 seed without retaining caller state. */
    public seed(seed: number): void {
        RandomStream.uint32(seed);
        // Versioned seed expansion: four consecutive Numerical Recipes LCG words.
        let word = seed;
        const words = Array.from({ length: 4 }, () => (word = (Math.imul(word, 1664525) + 1013904223) >>> 0));
        this.restore(seed, words);
    }

    /** Validates all four uint32 words before replacing state; the all-zero state is rejected. */
    public restore(seed: number, words: number[]): void {
        RandomStream.uint32(seed);
        if (words.length !== 4 || !words.some((word) => word !== 0)) throw new EvalError('rng: invalid nonzero four-word state.');
        words.forEach(RandomStream.uint32);
        this.seedValue = seed;
        this.words = [...words];
    }

    /** Rejects values outside the exact unsigned 32-bit integer domain. */
    private static uint32(value: number): void {
        if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new EvalError('rng: seed and state words must be uint32 integers.');
    }

    /** xoshiro128** 1.1, Blackman/Vigna, public-domain reference:
     * https://prng.di.unimi.it/xoshiro128starstar.c */
    public nextUint32(): number {
        const s = this.words;
        const rotl = (x: number, k: number): number => ((x << k) | (x >>> (32 - k))) >>> 0;
        const result = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
        const t = s[1] << 9;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        s[3] = rotl(s[3], 11);
        this.words = s.map((word) => word >>> 0);
        return result;
    }

    /** Uniform grid in [0,1), 53 random bits from two consecutive words. */
    public uniform(): number {
        return ((this.nextUint32() >>> 5) * 67108864 + (this.nextUint32() >>> 6)) / 9007199254740992;
    }

    /** Inclusive integer interval, unbiased by rejection over uint32 words. */
    public integer(min: number, max: number): number {
        const width = max - min + 1;
        if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || width < 1 || width > 4294967296) {
            throw new EvalError('randi: require safe integer bounds with inclusive width at most 2^32.');
        }
        const limit = 4294967296 - (4294967296 % width);
        let value: number;
        do {
            value = this.nextUint32();
        } while (value >= limit);
        return min + (value % width);
    }
}
