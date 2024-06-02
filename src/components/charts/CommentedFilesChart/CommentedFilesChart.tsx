import { useMemo } from 'react';
import { Comment, User } from '../../../services/types';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { getCommentedFilesData } from './CommentedFilesChartUtils';
import { chartColor } from '../../../utils/ColorUtils';

export interface CommentedFilesChartProps {
  user?: User | null;
  comments: Comment[];
}

export function CommentedFilesChart(props: CommentedFilesChartProps) {
  if (props.user) return <CommentedFilesForUser {...props} />;

  return <CommentedFilesForAll {...props} />;
}

function CommentedFilesForAll({ comments }: CommentedFilesChartProps) {
  const { data, authors } = useMemo(() => getCommentedFilesData(comments), [comments]);

  return (
    <ChartContainer title="Commented Files" description={<CommentedFilesDescription />}>
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        axisBottom={{}}
        indexBy="extension"
        keys={authors}
        data={data}
        colors={chartColor}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}

function CommentedFilesForUser({ comments, user }: CommentedFilesChartProps) {
  const { data, authors } = useMemo(() => {
    const userComments = comments.filter((item) => item.reviewerId === user!.id);
    const commentsData = getCommentedFilesData(userComments);

    return commentsData;
  }, [comments, user]);

  return (
    <ChartContainer title={`${user!.userName} comments the following files`} description={<CommentedFilesDescription />}>
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        axisBottom={{}}
        indexBy="extension"
        keys={authors}
        data={data}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}

function CommentedFilesDescription() {
  return <div>Displays which files users usually leave comments on during code reviews</div>;
}
