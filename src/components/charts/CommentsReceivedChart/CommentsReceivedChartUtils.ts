import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { Comment, User } from '../../../services/types';
import { ReviewBarChartSettings, ReviewBarDatum, getItemsReceived, getStatisticForUserDatum } from '../../../utils/ChartUtils';
import { getAuthorReviewerFromComments } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';

export function convertToCommentsReceivedPieChart(comments: Comment[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.author,
      label: item.author,
      value: item.total,
    })
  );

  return data;
}

export function convertToCommentsReceived(comments: Comment[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return getItemsReceived(rawData);
}

export function getDiscussionStartedByUserData(comments: Comment[], user: User) {
  const items = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  const { datum } = getStatisticForUserDatum(items, 'author', user.userName);

  const data = Object.entries(datum)
    .map((item) => ({ id: item[0], label: item[0], value: item[1] as number }))
    .sort((a, b) => a.value - b.value);

  return data;
}
