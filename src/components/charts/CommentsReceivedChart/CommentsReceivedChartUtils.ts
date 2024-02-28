import { Comment } from '../../../services/types';
import { ReviewBarChartSettings, ReviewBarDatum, convertToItemsReceived } from '../../../utils/ChartUtils';
import { getAuthorReviewerFromComments } from '../../../utils/GitUtils';

export function convertToCommentsReceived(comments: Comment[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return convertToItemsReceived(rawData);
}
