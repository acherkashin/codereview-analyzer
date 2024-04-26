import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { Comment } from '../../../services/types';
import { convertToCommentsLeftPieChart } from './CommentsLeftChartUtils';
import { useMemo } from 'react';
import { chartColor } from '../../../utils/ColorUtils';

export interface CommentsLeftPieChartProps {
  comments: Comment[];
  onClick: (userId: string) => void;
}

export function CommentsLeftPieChart({ comments, onClick }: CommentsLeftPieChartProps) {
  const data = useMemo(() => {
    return convertToCommentsLeftPieChart(comments);
  }, [comments]);

  return (
    <ChartContainer title="Comments left by person">
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
