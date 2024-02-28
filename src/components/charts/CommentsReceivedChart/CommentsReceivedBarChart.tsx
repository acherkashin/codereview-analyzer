import { BaseChartTooltip } from '../../BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { Comment } from '../../../services/types';
import { useMemo } from 'react';
import { convertToCommentsReceived } from './CommentsReceivedChartUtils';

export interface CommentsReceivedBarChartProps {
  comments: Comment[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function CommentsReceivedBarChart({ comments, onClick }: CommentsReceivedBarChartProps) {
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
