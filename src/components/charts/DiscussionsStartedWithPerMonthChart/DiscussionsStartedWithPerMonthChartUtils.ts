import { UserDiscussion } from '../../../services/types';
import { convertToLineChartData } from '../CommentsPerMonthChart/CommentsPerMonthChartUtils';

export function getDiscussionStartedWithData(discussions: UserDiscussion[], authorNames: string[] = []) {
  if (authorNames.length !== 0) {
    discussions = discussions.filter((item) => authorNames.includes(item.prAuthorName));
  }

  const data = discussions.map((item) => {
    const date = new Date(item.comments[0].createdAt);

    return {
      id: item.prAuthorName,
      x: new Date(date.getFullYear(), date.getMonth()),
    };
  });

  return convertToLineChartData(data);
}
