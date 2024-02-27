import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { Comment, User } from '../../../services/types';
import { useMemo } from 'react';
import { convertToCommentsLineChart } from './CommentsPerMonthChartUtils';
import { SquareMarker } from '../../BaseChartTooltip';
import { SliceTooltipProps } from '@nivo/line';

export interface CommentsPerMonthChartProps {
  user?: User;
  comments: Comment[];
}

export function CommentsPerMonthChart({ comments, user }: CommentsPerMonthChartProps) {
  const data = useMemo(() => convertToCommentsLineChart(comments, user ? [user.displayName] : []), [comments, user]);

  return (
    <ChartContainer title="Comments per month" style={{ width: 1020, height: 500 }}>
      <LineChart legendYLabel="Comments count" data={data} sliceTooltip={CommentsTooltip} />
    </ChartContainer>
  );
}

function CommentsTooltip({ slice }: SliceTooltipProps) {
  return (
    <div
      style={{
        background: 'white',
        padding: '9px 12px',
        border: '1px solid #ccc',
      }}
    >
      {slice.points
        .toSorted((a, b) => parseInt(b.data.y.toString()) - parseInt(a.data.y.toString()))
        .map((point) => (
          <div key={point.id} style={{ padding: '3px 0' }}>
            <SquareMarker color={point.serieColor} />
            <span>{point.serieId}</span> <strong style={{ float: 'right', marginLeft: 16 }}>{point.data.y.toString()}</strong>
          </div>
        ))}
    </div>
  );
}
