import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest, User } from '../../../services/types';

export function getWhomUserApprovesArray(mergeRequests: PullRequest[], userId: string) {
  const userPrs = mergeRequests.filter((item) => item.author.id === userId);
  const authors = userPrs.flatMap((item) => item.approvedByUser);

  const whoReceivedApprovals = tidy(authors, groupBy('displayName', [summarize({ total: n() })]), arrange([asc('total')]));

  return whoReceivedApprovals;
}

export function getWhomUserApproves(mergeRequests: PullRequest[], users: User[], userId: string): Record<string, number> {
  const array = getWhomUserApprovesArray(mergeRequests, userId);

  const result = array.reduce((acc, { displayName, total }) => {
    acc[displayName] = total;
    return acc;
  }, {} as Record<string, number>);

  return result;
}
