import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { getAuthorReviewerFromDiscussions } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';
import { User, UserDiscussion } from '../../../services/types';
import { getCommentsLeftByUser, getItemsLeft } from '../../../utils/ChartUtils';

export function convertToDiscussionsStartedPieChart(discussions: UserDiscussion[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromDiscussions(discussions);
  const data = tidy(rawData, groupBy('reviewer', summarize({ total: n() })), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.reviewer,
      label: item.reviewer,
      value: item.total,
    })
  );

  return data;
}

export function getDiscussionsStarted(discussions: UserDiscussion[]) {
  const rawData = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  return getItemsLeft(rawData);
}

export function getDiscussionStartedByUserData(discussions: UserDiscussion[], user: User) {
  const items = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  const commentsByUser = getCommentsLeftByUser(items, user.userName);

  const data = commentsByUser.map((item) => ({ id: item.author, value: item.total })).sort((a, b) => a.value - b.value);

  return data;
}
