import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest } from '../../../services/types';

export function getWhoUserApprovesArray(mergeRequests: PullRequest[], userId: string) {
  const approvedByUser = mergeRequests.filter((item) => item.approvedByUserIds.includes(userId));
  const authors = approvedByUser.map((item) => item.author);

  const whoUserApproves = tidy(authors, groupBy('displayName', [summarize({ total: n() })]), arrange([asc('total')]));

  return whoUserApproves;
}

export function getWhomUserApproves(mergeRequests: PullRequest[], userId: string): Record<string, number> {
  const whoUserApproves = getWhoUserApprovesArray(mergeRequests, userId);
  const result = whoUserApproves.reduce((acc, { displayName, total }) => {
    acc[displayName] = total;
    return acc;
  }, {} as Record<string, number>);

  return result;
}
