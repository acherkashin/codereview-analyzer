import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { getAuthorReviewerFromComments } from '../../../utils/GitUtils';
import { PieChartDatum } from '../../../utils/PieChartUtils';
import { Comment } from '../../../services/types';
import { ReviewBarChartSettings, ReviewBarDatum, convertToItemsLeft } from '../../../utils/ChartUtils';

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

export function convertToCommentsLeftBarChart(comments: Comment[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return convertToItemsLeft(rawData);
}
