import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { Comment, User } from '../../../services/types';
import { useMemo } from 'react';
import { convertToCommentsReceived, getDiscussionStartedByUserData } from './CommentsReceivedChartUtils';
import { BaseCommentsTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

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
    <ChartContainer title="Comments received by person" description={<CommentsReceivedDescription />}>
      <BarChart
        {...data}
        colors={chartColor}
        tooltip={(props) => {
          return <BaseCommentsTooltip reviewer={props.id as string} author={props.indexValue as string} count={props.value} />;
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
    <ChartContainer title={`${user!.displayName} received comments from`} description={<CommentsReceivedDescription />}>
      <BarChart
        data={data}
        tooltip={(props) => {
          return <BaseCommentsTooltip reviewer={props.indexValue as string} author={user!.displayName} count={props.value} />;
        }}
        onClick={(e) => {
          onClick(e.indexValue as string, user!.displayName);
        }}
      />
    </ChartContainer>
  );
}

function CommentsReceivedDescription() {
  return (
    <Stack gap={1}>
      <div>Shows how comments are distributed among authors of pull requests.</div>
      <div>Click on the slice to see the list of pull requests where user left comments.</div>
    </Stack>
  );
}
