import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { Comment } from '../../../services/types';
import { ReviewBarChartSettings, ReviewBarDatum, convertToItemsReceived } from '../../../utils/ChartUtils';
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
  return convertToItemsReceived(rawData);
}
