import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { getAuthorReviewerFromDiscussions } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';
import { User, UserDiscussion } from '../../../services/types';
import { getItemsLeft, getStatisticForUserDatum } from '../../../utils/ChartUtils';

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
  const { datum } = getStatisticForUserDatum(items, 'reviewer', user.userName);

  const data = Object.entries(datum)
    .map((item) => ({ id: item[0], label: item[0], value: item[1] as number }))
    .sort((a, b) => a.value - b.value);

  return data;
}
