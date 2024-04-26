import { useMemo } from 'react';
import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { Comment } from '../../../services/types';
import { convertToCommentsReceivedPieChart } from './CommentsReceivedChartUtils';
import { chartColor } from '../../../utils/ColorUtils';

export interface CommentsReceivedPieChartProps {
  comments: Comment[];
  onClick: (authorName: string) => void;
}

export function CommentsReceivedPieChart({ comments, onClick }: CommentsReceivedPieChartProps) {
  const data = useMemo(() => convertToCommentsReceivedPieChart(comments), [comments]);

  return (
    <ChartContainer title="Comments received by person">
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
