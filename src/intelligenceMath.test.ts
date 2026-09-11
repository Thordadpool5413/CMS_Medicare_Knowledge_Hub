import { describe, expect, it } from 'vitest';
import { buildEvidenceAlignment, solveGrowth } from './intelligenceMath';

describe('growth solver', () => {
  it('requires enough admissions to offset attrition while moving toward the target', () => {
    const result = solveGrowth({ currentAdc: 50, targetAdc: 65, losDays: 60, conversionPct: 50, horizonDays: 90 });
    expect(result.admissionsPerMonth).toBeGreaterThan(0);
    expect(result.referralsPerMonth).toBeCloseTo(result.admissionsPerMonth * 2, 6);
    expect(result.projectedAdcWithoutAdmissions).toBeLessThan(50);
  });

  it('never returns negative required admissions when the target is below natural attrition projection', () => {
    const result = solveGrowth({ currentAdc: 100, targetAdc: 10, losDays: 365, conversionPct: 50, horizonDays: 30 });
    expect(result.admissionsPerDay).toBe(0);
  });
});

describe('source period alignment', () => {
  it('applies no second penalty when too few core periods resolve', () => {
    const alignment = buildEvidenceAlignment({ periods: { cahpsDate: '' }, history: [{ year: '2024' }] }, null, []);
    expect(alignment.status).toBe('PARTIAL VINTAGE');
    expect(alignment.confidencePenalty).toBe(0);
  });

  it('penalizes a material period mismatch explicitly', () => {
    const alignment = buildEvidenceAlignment({ periods: { cahpsDate: '2026', qualityDate: '2025' }, history: [{ year: '2022' }] }, null, [{ label: 'Medicare Monthly Enrollment', freshness: 'August 2026' }]);
    expect(alignment.status).toBe('PERIOD MISMATCH');
    expect(alignment.confidencePenalty).toBe(8);
  });
});
