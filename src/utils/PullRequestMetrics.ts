import dayjs from 'dayjs';
import { PullRequest } from '../services/types';

export type PullRequestSizeTier = 'compact' | 'medium' | 'large' | 'veryLarge';

export function getPullRequestSize(pullRequest: PullRequest) {
  return pullRequest.linesAdded + pullRequest.linesRemoved;
}

export function getPullRequestOpenDays(pullRequest: PullRequest) {
  const endDate = pullRequest.mergedAt ?? pullRequest.updatedAt ?? new Date().toISOString();
  return Math.max(dayjs(endDate).diff(dayjs(pullRequest.createdAt), 'day'), 0);
}

export function getPullRequestSizeTierForLines(linesChanged: number): PullRequestSizeTier {
  if (linesChanged <= 120) {
    return 'compact';
  }

  if (linesChanged <= 399) {
    return 'medium';
  }

  if (linesChanged <= 799) {
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
