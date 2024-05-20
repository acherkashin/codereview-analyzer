import { PullRequest } from '../../../services/types';
import { uniqueByProperty } from '../../../utils/ArrayUtils';

/**
 * Returns who requests review from given user and how many PRs were reviewed by the user
 */
export function getWhoRequestReviewsArray(mergeRequests: PullRequest[], userId: string) {
  const requestedReviewForPrs = mergeRequests.filter((item) => item.requestedReviewers.map((item) => item.id).includes(userId));
  // the following authors asks for review
  const authors = requestedReviewForPrs.map((item) => item.author);
  const stats = new Map(
    uniqueByProperty(authors, 'displayName').map(({ displayName }) => [displayName, { total: 0, reviewed: 0 }])
  );

  for (const pr of requestedReviewForPrs) {
    const stat = stats.get(pr.author.displayName)!;
    stat.total++;
    if (pr.reviewedByUser.find((item) => item.user.id === userId)) {
      stat.reviewed++;
    }
  }

  const result = Array.from(stats)
    .map((item) => ({
      displayName: item[0],
      total: item[1].total,
      reviewed: item[1].reviewed,
    }))
    .sort((a, b) => a.total - b.total);

  return result;
}

/**
 * Returns data for who request review from user
 */
export function getWhoRequestReviews(mergeRequests: PullRequest[], userId: string): Record<string, number> {
  // find all prs where review requested from user
  const requestedBy = getWhoRequestReviewsArray(mergeRequests, userId);

  const result = requestedBy.reduce((acc, { displayName, total }) => {
    acc[displayName] = total;
    return acc;
  }, {} as Record<string, number>);

  return result;
}
