import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { UserDiscussion } from '../../../services/types';
import { getAuthorReviewerFromDiscussions } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';

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
