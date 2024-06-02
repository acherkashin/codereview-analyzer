import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { Comment, User } from '../../../services/types';
import { ReviewBarChartSettings, ReviewBarDatum, getCommentsReceivedByUser, getItemsReceived } from '../../../utils/ChartUtils';
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
  const rawData = getAuthorReviewerFromComments(comments);
  return getItemsReceived(rawData);
}

export function getDiscussionStartedByUserData(comments: Comment[], user: User) {
  const items = getAuthorReviewerFromComments(comments);
  const commentsPerUser = getCommentsReceivedByUser(items, user.userName);

  const data = commentsPerUser.map((item) => ({ id: item.reviewer, value: item.total })).sort((a, b) => a.value - b.value);

  return data;
}
