import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { Comment } from '../../../services/types';
import { convertToCommentsLeftPieChart } from './CommentsLeftChartUtils';
import { useMemo } from 'react';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface CommentsLeftPieChartProps {
  comments: Comment[];
  onClick: (userId: string) => void;
}

export function CommentsLeftPieChart({ comments, onClick }: CommentsLeftPieChartProps) {
  const data = useMemo(() => {
    return convertToCommentsLeftPieChart(comments);
  }, [comments]);

  return (
    <ChartContainer title="Comments left by person" description={<StartedDiscussionsDescription />}>
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

function StartedDiscussionsDescription() {
  return (
    <Stack gap={1}>
      <div>Shows how comments are distributed among reviewers.</div>
      <div>Click on the slice to see the list of pull requests where user left comments.</div>
    </Stack>
  );
}
