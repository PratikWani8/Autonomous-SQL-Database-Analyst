import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, cleanColumnLabel } from './formatters';

describe('formatters utility suite', () => {
  it('formatNumber correctly formats Indian locale numbers', () => {
    expect(formatNumber(12442373)).toBe('1,24,42,373');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(null)).toBe('—');
  });

  it('formatPercent correctly appends % and fixes 2 decimals', () => {
    expect(formatPercent(6.4)).toBe('6.40%');
    expect(formatPercent(12.3456)).toBe('12.35%');
    expect(formatPercent(null)).toBe('—');
  });

  it('cleanColumnLabel transforms snake_case to human readable titles', () => {
    expect(cleanColumnLabel('overall_unemployment_rate')).toBe('Overall Unemployment Rate');
    expect(cleanColumnLabel('institutional_births_pct')).toBe('Institutional Births (%)');
    expect(cleanColumnLabel('avg_literacy_rate')).toBe('Average Literacy Rate');
  });
});
