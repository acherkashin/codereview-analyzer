import { BaseChartTooltip } from '../../tooltips/BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { Comment, User } from '../../../services/types';
import { useMemo } from 'react';
import { convertToCommentsReceived, getDiscussionStartedByUserData } from './CommentsReceivedChartUtils';

export interface CommentsReceivedBarChartProps {
  user?: User | null;

  comments: Comment[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function CommentsReceivedBarChart(props: CommentsReceivedBarChartProps) {
  if (props.user) return <CommentsReceivedChartForUser {...props} />;

  return <CommentsReceivedChartForAll {...props} />;
}

function CommentsReceivedChartForAll({ comments, onClick }: CommentsReceivedBarChartProps) {
  const data = useMemo(() => convertToCommentsReceived(comments), [comments]);

  return (
    <ChartContainer title="Comments received by person">
      <BarChart
        {...data}
        tooltip={(props) => {
          const { indexValue, value, id } = props;

          return (
            <BaseChartTooltip {...props}>
              <strong>{id}</strong> left <strong>{value}</strong> comments to <strong>{indexValue}</strong>
            </BaseChartTooltip>
          );
        }}
        onClick={(e) => {
          const authorName = e.indexValue as string;

          onClick(e.id as string, authorName);
        }}
      />
    </ChartContainer>
  );
}

function CommentsReceivedChartForUser({ user, comments, onClick }: CommentsReceivedBarChartProps) {
  const data = useMemo(() => getDiscussionStartedByUserData(comments, user!), [comments, user]);

  return (
    <ChartContainer title={`${user!.displayName} received comments from`}>
      <BarChart
        data={data}
        //TODO: fix onClick
        //TODO: fix tooltip
      />
    </ChartContainer>
  );
}
