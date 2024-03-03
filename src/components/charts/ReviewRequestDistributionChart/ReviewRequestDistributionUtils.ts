import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest } from '../../../services/types';

export function getWhoRequestsReviewArray(mergeRequests: PullRequest[], userId: string) {
  const userPrs = mergeRequests.filter((item) => item.author.id === userId);
  const authors = userPrs.flatMap((item) => item.requestedReviewers);

  const reviewedByUser = tidy(authors, groupBy('displayName', [summarize({ total: n() })]), arrange([asc('total')]));

  return reviewedByUser;
}

export function getWhoRequestsReview(mergeRequests: PullRequest[], userId: string): Record<string, number> {
  const reviewedByUser = getWhoRequestsReviewArray(mergeRequests, userId);

  const result = reviewedByUser.reduce((acc, { displayName, total }) => {
    acc[displayName] = total;
    return acc;
  }, {} as Record<string, number>);

  return result;
}
