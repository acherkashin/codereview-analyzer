import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { getAuthorReviewerFromComments } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';
import { Comment, User } from '../../../services/types';
import { getItemsLeft, getStatisticForUserDatum } from '../../../utils/ChartUtils';

export function convertToCommentsLeftPieChart(comments: Comment[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('reviewer', summarize({ total: n() })), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.reviewer,
      label: item.reviewer,
      value: item.total,
    })
  );

  return data;
}

export function getCommentsLeftData(comments: Comment[]) {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return getItemsLeft(rawData);
}

export function getCommentsLeftByUserData(comments: Comment[], user: User) {
  const items = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  const { datum } = getStatisticForUserDatum(items, 'reviewer', user.userName);

  const data = Object.entries(datum)
    .map((item) => ({ id: item[0], label: item[0], value: item[1] as number }))
    .sort((a, b) => a.value - b.value);

  return data;
}
