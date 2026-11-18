import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, formatPct, formatUsdCompact, salaryDeltaPct } from './format';

describe('format', () => {
  it('formats money in whole units with the right symbol', () => {
    expect(formatMoney(85_000, 'USD')).toBe('$85,000');
    expect(formatMoney(2_400_000, 'INR')).toContain('2,400,000');
  });

  it('formats compact USD for dense spots', () => {
    expect(formatUsdCompact(85_000)).toBe('$85K');
    expect(formatUsdCompact(1_250_000)).toBe('$1.25M');
  });

  it('signs percentages', () => {
    expect(formatPct(5.25)).toBe('+5.3%');
    expect(formatPct(-2)).toBe('-2.0%');
  });

  it('formats ISO dates without timezone drift', () => {
    expect(formatDate('2022-04-01')).toBe('01 Apr 2022');
  });

  it('computes salary change percentage and handles the first entry', () => {
    expect(salaryDeltaPct(100, 110)).toBeCloseTo(10);
    expect(salaryDeltaPct(null, 100)).toBeNull();
  });
});
