import { useMemo } from 'react';
import { UserDiscussion } from '../../../services/types';
import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { convertToDiscussionsReceivedPieChart } from './StartedWithDiscussionsChartUtils';

export interface StartedWithDiscussionsPieChartProps {
  discussions: UserDiscussion[];
  onClick: (authorName: string) => void;
}

export function StartedWithDiscussionsPieChart({ discussions, onClick }: StartedWithDiscussionsPieChartProps) {
  const data = useMemo(() => convertToDiscussionsReceivedPieChart(discussions), [discussions]);

  return (
    <ChartContainer title="Discussions started with person">
      <PieChart
        data={data}
        onClick={(e) => {
          const authorName = e.id as string;
          onClick(authorName);
        }}
      />
    </ChartContainer>
  );
}
