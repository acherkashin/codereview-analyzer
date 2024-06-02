import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { getAuthorReviewerFromComments } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';
import { Comment, User } from '../../../services/types';
import { getItemsLeft, getCommentsLeftByUser } from '../../../utils/ChartUtils';

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
  const rawData = getAuthorReviewerFromComments(comments);
  return getItemsLeft(rawData);
}

export function getCommentsLeftByUserData(comments: Comment[], user: User) {
  const items = getAuthorReviewerFromComments(comments);
  const commentsPerUser = getCommentsLeftByUser(items, user.userName);

  const data = commentsPerUser.map((item) => ({ id: item.author, value: item.total })).sort((a, b) => a.value - b.value);

  return data;
}
