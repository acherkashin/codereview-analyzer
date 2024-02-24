import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { PullRequest, User } from '../../../services/types';

export function getChartData(pullRequests: PullRequest[], users: User[]) {
  const data = users
    .map((item) => {
      const approves = getWhomUserApproves(pullRequests, item.id);
      const total = Object.values(approves).reduce((acc, value) => acc + value, 0);

      return {
        ...approves,
        total,
        approverName: item.displayName,
      };
    })
    .filter((item) => item.total > 0)
    .toSorted((a, b) => a.total - b.total);

  const authors = users.map((item) => item.displayName);

  return {
    data,
    authors,
  };
}

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
