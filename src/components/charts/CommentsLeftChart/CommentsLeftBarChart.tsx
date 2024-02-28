import { useMemo } from 'react';
import { Comment } from '../../../services/types';
import { BaseChartTooltip } from '../../BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { convertToCommentsLeftBarChart } from './CommentsLeftChartUtils';

export interface CommentsLeftBarChartProps {
  comments: Comment[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function CommentsLeftBarChart({ comments, onClick }: CommentsLeftBarChartProps) {
  const data = useMemo(() => convertToCommentsLeftBarChart(comments), [comments]);

  return (
    <ChartContainer title="Comments left by person">
      <BarChart
        {...data}
        tooltip={(props) => {
          const { indexValue, value, id } = props;

          return (
            <BaseChartTooltip {...props}>
              <strong>{indexValue}</strong> left <strong>{value}</strong> comments to <strong>{id}</strong>
            </BaseChartTooltip>
          );
        }}
        onClick={(e) => {
          const reviewerName = e.indexValue as string;

          onClick(reviewerName, e.id as string);
        }}
      />
    </ChartContainer>
  );
}
