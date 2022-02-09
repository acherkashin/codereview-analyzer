import { getAuthorReviewerFromComments, UserComment } from './GitLabUtils';
import { arrange, asc, groupBy, summarize, tidy, n } from '@tidyjs/tidy';

export function convertToCommentsReceivedPieChart(comments: UserComment[]) {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map((item) => ({
    id: item.author,
    label: item.author,
    value: item.total,
  }));

  return data;
}

export function convertToCommentsLeftPieChart(comments: UserComment[]) {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('reviewer', summarize({ total: n() })), arrange([asc('total')])).map((item) => ({
    id: item.reviewer,
    label: item.reviewer,
    value: item.total,
  }));

  return data;
}
