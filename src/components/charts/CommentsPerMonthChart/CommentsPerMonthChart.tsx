import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { Comment } from '../../../clients/types';
import { useMemo, useReducer, useState } from 'react';
import { convertToCommentsLineChart } from './CommentsPerMonthChartUtils';

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
