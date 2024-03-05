import { UserDiscussion } from '../../../services/types';
import { convertToLineChartData } from '../CommentsPerMonthChart/CommentsPerMonthChartUtils';

export function getDiscussionLineChartData(comments: UserDiscussion[], reviewerNames: string[] = []) {
  if (reviewerNames.length !== 0) {
    comments = comments.filter((item) => reviewerNames.includes(item.reviewerName));
  }

  const data = comments.map((item) => {
    const date = new Date(item.comments[0].createdAt);

    return {
      id: item.reviewerName,
      x: new Date(date.getFullYear(), date.getMonth()),
    };
  });

  return convertToLineChartData(data);
}
