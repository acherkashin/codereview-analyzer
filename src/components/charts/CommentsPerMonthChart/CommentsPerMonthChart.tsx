import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { Comment } from '../../../services/types';
import { useMemo, useReducer } from 'react';
import { convertToCommentsLineChart } from './CommentsPerMonthChartUtils';
import { SquareMarker } from '../../BaseChartTooltip';
import { SliceTooltipProps } from '@nivo/line';

export interface CommentsPerMonthChartProps {
  comments: Comment[];
}

export function CommentsPerMonthChart({ comments }: CommentsPerMonthChartProps) {
  // TODO: Ideally would be to add button that shows popup where would be possible to select several authors at the same time.
  const [selectedAuthors, setSelectedAuthors] = useReducer(authorsReducer, []);
  const data = useMemo(() => convertToCommentsLineChart(comments, selectedAuthors), [comments, selectedAuthors]);

  return (
    <ChartContainer title="Comments per month" style={{ width: 1020, height: 500 }}>
      <LineChart
        legendYLabel="Comments count"
        data={data}
        onLegendClick={(selected) => setSelectedAuthors(selected.id as string)}
        sliceTooltip={CommentsTooltip}
      />
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

function authorsReducer(state: string[], reviewer: string) {
  if (state.includes(reviewer)) {
    return state.filter((item) => item !== reviewer);
  } else {
    return [...state, reviewer];
  }
}
