import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { User, UserDiscussion } from '../../../services/types';
import { getAuthorReviewerFromDiscussions } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';
import { ReviewBarChartSettings, ReviewBarDatum, getCommentsReceivedByUser, getItemsReceived } from '../../../utils/ChartUtils';

export function convertToDiscussionsReceivedPieChart(discussions: UserDiscussion[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromDiscussions(discussions);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.author,
      label: item.author,
      value: item.total,
    })
  );

  return data;
}

export function getDiscussionStartedWithUserData(discussions: UserDiscussion[], user: User) {
  const items = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  const commentsPerUser = getCommentsReceivedByUser(items, user.userName);

  const data = commentsPerUser
    .map((item) => ({ id: item.reviewer, value: item.total as number }))
    .sort((a, b) => a.value - b.value);

  return data;
}

export function convertToDiscussionsReceived(discussions: UserDiscussion[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  return getItemsReceived(rawData);
}
