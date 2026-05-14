import { describe, expect, it } from 'vitest';
import { getPullRequestSizeTierForLines, getPullRequestSizeTierRangeLabel } from './PullRequestMetrics';

describe('PullRequestMetrics', () => {
  it('maps size thresholds to the expected labels', () => {
    expect(getPullRequestSizeTierForLines(150)).toBe('compact');
    expect(getPullRequestSizeTierForLines(151)).toBe('medium');
    expect(getPullRequestSizeTierForLines(499)).toBe('medium');
    expect(getPullRequestSizeTierForLines(500)).toBe('large');
    expect(getPullRequestSizeTierForLines(999)).toBe('large');
    expect(getPullRequestSizeTierForLines(1000)).toBe('veryLarge');
  });

  it('returns human-readable size tier ranges', () => {
    expect(getPullRequestSizeTierRangeLabel('compact')).toBe('0-150 lines');
    expect(getPullRequestSizeTierRangeLabel('medium')).toBe('151-499 lines');
    expect(getPullRequestSizeTierRangeLabel('large')).toBe('500-999 lines');
    expect(getPullRequestSizeTierRangeLabel('veryLarge')).toBe('1000+ lines');
  });
});
