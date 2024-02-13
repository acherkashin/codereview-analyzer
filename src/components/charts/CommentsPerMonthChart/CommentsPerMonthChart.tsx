import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { Comment } from '../../../clients/types';
import { useMemo } from 'react';
import { convertToCommentsLineChart } from './CommentsPerMonthChartUtils';

export interface CommentsPerMonthChartProps {
  comments: Comment[];
}

export function CommentsPerMonthChart({ comments }: CommentsPerMonthChartProps) {
  const data = useMemo(() => convertToCommentsLineChart(comments), [comments]);

  return (
    <ChartContainer title="Comments per month" style={{ width: 1020, height: 500 }}>
      <LineChart legendYLabel="Comments count" data={data} />
    </ChartContainer>
  );
}
