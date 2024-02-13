import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { Comment } from '../../../clients/types';
import { useMemo, useReducer, useState } from 'react';
import { convertToCommentsLineChart } from './CommentsPerMonthChartUtils';
import { SquareMarker } from '../../BaseChartTooltip';

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
        sliceTooltip={({ slice }) => {
          return (
            <div
              style={{
                background: 'white',
                padding: '9px 12px',
                border: '1px solid #ccc',
              }}
            >
              {slice.points
                .toSorted((a, b) => parseInt(b.data.yFormatted.toString()) - parseInt(a.data.yFormatted.toString()))
                .map((point) => (
                  <div key={point.id} style={{ padding: '3px 0' }}>
                    <SquareMarker color={point.serieColor} />
                    <span>{point.serieId}</span>{' '}
                    <strong style={{ float: 'right', marginLeft: 16 }}>{point.data.yFormatted}</strong>
                  </div>
                ))}
            </div>
          );
        }}
      />
    </ChartContainer>
  );
}

function authorsReducer(state: string[], reviewer: string) {
  if (state.includes(reviewer)) {
    return state.filter((item) => item !== reviewer);
  } else {
    return [...state, reviewer];
  }
}
