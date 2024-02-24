import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { Comment } from '../../../services/types';
import { convertToCommentsLeftPieChart } from './CommentsLeftChartUtils';
import { useMemo } from 'react';

export interface CommentsLeftChartProps {
  comments: Comment[];
  onClick: (userId: string) => void;
}

export function CommentsLeftChart({ comments, onClick }: CommentsLeftChartProps) {
  const data = useMemo(() => {
    return convertToCommentsLeftPieChart(comments);
  }, [comments]);

  return (
    <ChartContainer title="Comments left by person">
      <PieChart
        data={data}
        onClick={(e) => {
          onClick(e.id as string);
        }}
      />
    </ChartContainer>
  );
}
