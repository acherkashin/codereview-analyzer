import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest } from '../../../services/types';

/**
 * Returns data for who get review requests
 */
export function getWhoGetReviewRequests(mergeRequests: PullRequest[], userId: string): Record<string, number> {
  const requestedReviewForPrs = mergeRequests.filter((item) => item.requestedReviewers.map((item) => item.id).includes(userId));
  // the following authors asks for review
  const authors = requestedReviewForPrs.map((item) => item.author);

  const reviewedByUser = tidy(authors, groupBy('displayName', [summarize({ total: n() })]), arrange([asc('total')]));

  const result = reviewedByUser.reduce((acc, { displayName, total }) => {
    acc[displayName] = total;
    return acc;
  }, {} as Record<string, number>);

  return result;
}
