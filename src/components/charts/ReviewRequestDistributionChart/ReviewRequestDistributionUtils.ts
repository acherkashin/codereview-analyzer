import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest } from '../../../services/types';
import { uniqueByProperty } from '../../../utils/ArrayUtils';

/**
 * Returns who @param userId aks to review his pull requests
 */
export function getWhoRequestsReviewArray(mergeRequests: PullRequest[], userId: string) {
  const userPrs = mergeRequests.filter((item) => item.author.id === userId);
  const reviewersAssigned = userPrs.flatMap((item) => item.requestedReviewers);
  const reviewedBy = userPrs.flatMap((item) =>
    uniqueByProperty(
      item.reviewedByUser.map((item) => item.user),
      'displayName'
    )
  );

  const reviewedByStats = tidy(reviewedBy, groupBy('displayName', [summarize({ total: n() })]), arrange([asc('total')])).map(
    (item) => [item.displayName, item.total] as const
  );
  const reviewedByStatsMap = new Map(reviewedByStats);

  const reviewRequestedStats = tidy(
    reviewersAssigned,
    groupBy('displayName', [summarize({ total: n() })]),
    arrange([asc('total')])
  ).map((item) => [item.displayName, item.total] as const);

  const reviewRequestedMap = new Map(reviewRequestedStats);

  const stats = uniqueByProperty([...reviewersAssigned, ...reviewedBy], 'displayName')
    .filter((item) => item.id !== userId)
    .map(({ displayName }) => ({
      displayName,
      total: reviewRequestedMap.get(displayName) || 0,
      reviewed: reviewedByStatsMap.get(displayName) || 0,
    }))
    .sort((a, b) => a.total - b.total);

  return stats;
}

export function getWhoRequestsReview(mergeRequests: PullRequest[], userId: string): Record<string, number> {
  const reviewedByUser = getWhoRequestsReviewArray(mergeRequests, userId);

  const result = reviewedByUser.reduce((acc, { displayName, total }) => {
    acc[displayName] = total;
    return acc;
  }, {} as Record<string, number>);

  return result;
}
