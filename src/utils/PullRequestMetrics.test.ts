import { describe, expect, it } from 'vitest';
import { getPullRequestSizeTierForLines } from './PullRequestMetrics';

describe('PullRequestMetrics', () => {
  it('maps size thresholds to the expected labels', () => {
    expect(getPullRequestSizeTierForLines(120)).toBe('compact');
    expect(getPullRequestSizeTierForLines(121)).toBe('medium');
    expect(getPullRequestSizeTierForLines(399)).toBe('medium');
    expect(getPullRequestSizeTierForLines(400)).toBe('large');
    expect(getPullRequestSizeTierForLines(799)).toBe('large');
    expect(getPullRequestSizeTierForLines(800)).toBe('veryLarge');
  });
});
