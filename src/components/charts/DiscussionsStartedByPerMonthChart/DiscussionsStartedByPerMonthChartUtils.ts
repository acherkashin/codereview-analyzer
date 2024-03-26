import { UserDiscussion } from '../../../services/types';
import { convertToLineChartData } from '../CommentsPerMonthChart/CommentsPerMonthChartUtils';

export function getDiscussionStartedByData(discussions: UserDiscussion[], reviewerNames: string[] = []) {
  if (reviewerNames.length !== 0) {
    discussions = discussions.filter((item) => reviewerNames.includes(item.reviewerName));
  }

  const data = discussions.map((item) => {
    const date = new Date(item.comments[0].createdAt);

    return {
      id: item.reviewerName,
      x: new Date(date.getFullYear(), date.getMonth()),
    };
  });

  return convertToLineChartData(data);
}
