import { groupBy, summarize, tidy, n } from '@tidyjs/tidy';
import { Comment } from '../../../services/types';

export function convertToCommentsLineChart(comments: Comment[], reviewerNames: string[] = []) {
  if (reviewerNames.length !== 0) {
    comments = comments.filter((item) => reviewerNames.includes(item.reviewerName));
  }

  const data = comments.map((item) => {
    const date = new Date(item.createdAt);

    return {
      id: item.reviewerName,
      x: new Date(date.getFullYear(), date.getMonth()),
    };
  });

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
