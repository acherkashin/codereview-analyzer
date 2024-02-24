import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest } from '../../../services/types';

export function getWhomUserApproves(mergeRequests: PullRequest[], userId: string): Record<string, number> {
  const approvedByUser = mergeRequests.filter((item) => item.approvedByUserIds.includes(userId));
  const authors = approvedByUser.map((item) => item.author);

  const reviewedByUser = tidy(authors, groupBy('displayName', [summarize({ total: n() })]), arrange([asc('total')]));

  const result = reviewedByUser.reduce((acc, { displayName, total }) => {
    acc[displayName] = total;
    return acc;
  }, {} as Record<string, number>);

  return result;
}
