import dayjs from 'dayjs';
import { PullRequest } from '../services/types';

export type PullRequestSizeTier = 'compact' | 'medium' | 'large' | 'veryLarge';

const pullRequestSizeTierRanges: Record<PullRequestSizeTier, { min: number; max?: number }> = {
  compact: { min: 0, max: 150 },
  medium: { min: 151, max: 499 },
  large: { min: 500, max: 999 },
  veryLarge: { min: 1000 },
};

export function getPullRequestSize(pullRequest: PullRequest) {
  return pullRequest.linesAdded + pullRequest.linesRemoved;
}

export function getPullRequestOpenDays(pullRequest: PullRequest) {
  const endDate = pullRequest.mergedAt ?? pullRequest.updatedAt ?? new Date().toISOString();
  return Math.max(dayjs(endDate).diff(dayjs(pullRequest.createdAt), 'day'), 0);
}

export function getPullRequestSizeTierForLines(linesChanged: number): PullRequestSizeTier {
  if (linesChanged <= pullRequestSizeTierRanges.compact.max) {
    return 'compact';
  }

  if (linesChanged <= pullRequestSizeTierRanges.medium.max) {
    return 'medium';
  }

  if (linesChanged <= pullRequestSizeTierRanges.large.max) {
    return 'large';
  }

  return 'veryLarge';
}

export function getPullRequestSizeTier(pullRequest: PullRequest) {
  return getPullRequestSizeTierForLines(getPullRequestSize(pullRequest));
}

export function isLargePullRequest(pullRequest: PullRequest) {
  const sizeTier = getPullRequestSizeTier(pullRequest);
  return sizeTier === 'large' || sizeTier === 'veryLarge';
}

export function getPullRequestSizeTierLabel(sizeTier: PullRequestSizeTier) {
  switch (sizeTier) {
    case 'compact':
      return 'Compact';
    case 'medium':
      return 'Medium';
    case 'large':
      return 'Large';
    case 'veryLarge':
      return 'Very large';
  }
}

export function getPullRequestSizeTierRangeLabel(sizeTier: PullRequestSizeTier) {
  const range = pullRequestSizeTierRanges[sizeTier];

  if (range.max == null) {
    return `${range.min}+ lines`;
  }

  return `${range.min}-${range.max} lines`;
}
