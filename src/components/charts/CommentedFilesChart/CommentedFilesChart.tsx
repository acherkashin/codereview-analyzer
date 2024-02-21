import { useMemo } from 'react';
import { Comment } from '../../../services/types';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { convertToFilesCommented } from './CommentedFilesChartUtils';

export interface CommentedFilesChart {
  comments: Comment[];
}

export function CommentedFilesChart({ comments }: CommentedFilesChart) {
  const { data, authors } = useMemo(() => convertToFilesCommented(comments), [comments]);

  return (
    <ChartContainer title="Commented Files">
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        axisBottom={{}}
        indexBy="extension"
        keys={authors}
        data={data}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}
