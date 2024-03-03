import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest } from '../../../services/types';

export function getWhoRequestReviewsArray(mergeRequests: PullRequest[], userId: string) {
  const requestedReviewForPrs = mergeRequests.filter((item) => item.requestedReviewers.map((item) => item.id).includes(userId));
  // the following authors asks for review
  const authors = requestedReviewForPrs.map((item) => item.author);
  const requestedBy = tidy(authors, groupBy('displayName', [summarize({ total: n() })]), arrange([asc('total')]));

  return requestedBy;
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
