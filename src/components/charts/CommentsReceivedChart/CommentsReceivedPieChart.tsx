import { useMemo } from 'react';
import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { Comment } from '../../../services/types';
import { convertToCommentsReceivedPieChart } from './CommentsReceivedChartUtils';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface CommentsReceivedPieChartProps {
  comments: Comment[];
  onClick: (authorName: string) => void;
}

export function CommentsReceivedPieChart({ comments, onClick }: CommentsReceivedPieChartProps) {
  const data = useMemo(() => convertToCommentsReceivedPieChart(comments), [comments]);

  return (
    <ChartContainer title="Comments received by person" description={<CommentsRecievedDescription />}>
      <PieChart
        data={data}
        colors={chartColor}
        onClick={(e) => {
          onClick(e.id as string);
        }}
      />
    </ChartContainer>
  );
}

function CommentsRecievedDescription() {
  return (
    <Stack gap={1}>
      <div>Shows how comments are distributed among authors of pull requests</div>
      <div>Click on the slice to see the list of pull requests where user left comments.</div>
    </Stack>
  );
}
