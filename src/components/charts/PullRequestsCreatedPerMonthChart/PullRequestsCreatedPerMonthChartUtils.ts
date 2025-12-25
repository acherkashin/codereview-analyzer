import { groupBy, summarize, tidy, n } from '@tidyjs/tidy';
import { PullRequest } from '../../../services/types';

export function getPullRequestsLineChartData(pullRequests: PullRequest[], authorNames: string[] = []) {
  let filteredPullRequests = pullRequests;

  if (authorNames.length !== 0) {
    filteredPullRequests = pullRequests.filter((item) => authorNames.includes(item.author.displayName));
  }

  const data = filteredPullRequests.map((item) => {
    const date = new Date(item.createdAt);

    return {
      id: item.author.displayName,
      x: new Date(date.getFullYear(), date.getMonth()),
    };
  });

  return convertToLineChartData(data);
}

export function convertToLineChartData(
  data: {
    id: string;
    x: Date;
  }[]
) {
  const grouped = tidy(data, groupBy(['id', 'x'], [summarize({ y: n() })]));

  const transformedData = grouped.reduce((result, item) => {
    const foundIndex = result.findIndex((i) => i.id === item.id);
    if (foundIndex !== -1) {
      result[foundIndex].data.push({ x: item.x, y: item.y });
    } else {
      result.push({ id: item.id, data: [{ x: item.x, y: item.y }] });
    }
    return result;
  }, [] as Array<{ id: string; data: { x: Date; y: number }[] }>);

  const filtered = transformedData.filter((item) => item.data.every((i) => i.y !== 0));

  filtered.forEach((item) => {
    item.data.sort((a, b) => a.x.getTime() - b.x.getTime());
  });

  return filtered;
}
