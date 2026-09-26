import { ParforAnalyzer } from './ParforAnalyzer';

describe('ParforAnalyzer', () => {
    test('classifies sliced, loop, and broadcast variables', () => {
        const analysis = ParforAnalyzer.analyze('parfor k=1:4; A(k)=scale*k^2; end; A');
        expect(analysis).toMatchObject({
            eligible: true,
            plan: { classifications: { k: 'loop', A: 'sliced', scale: 'broadcast' } },
        });
    });

    test('rejects effects and loop-carried output reads', () => {
        expect(ParforAnalyzer.analyze('parfor k=1:4; A(k)=load("x"); end').eligible).toBe(false);
        expect(ParforAnalyzer.analyze('parfor k=1:4; A(k)=A(k)+1; end').eligible).toBe(false);
        expect(ParforAnalyzer.analyze('parfor k=1:4; A(k)=k; total += k; end').eligible).toBe(false);
    });
});
