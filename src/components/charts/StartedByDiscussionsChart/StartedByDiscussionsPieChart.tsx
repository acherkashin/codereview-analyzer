import { useMemo } from 'react';
import { UserDiscussion } from '../../../services/types';
import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { convertToDiscussionsStartedPieChart } from './StartedByDiscussionsChartUtils';
import { chartColor } from '../../../utils/ColorUtils';

export interface StartedByDiscussionsPieChartProps {
  discussions: UserDiscussion[];
  onClick: (reviewerName: string) => void;
}

export function StartedByDiscussionsPieChart({ discussions, onClick }: StartedByDiscussionsPieChartProps) {
  const data = useMemo(() => convertToDiscussionsStartedPieChart(discussions), [discussions]);
  return (
    <ChartContainer title="Discussions started by person">
      <PieChart
        data={data}
        colors={chartColor}
        onClick={(e) => {
          const reviewerName = e.id as string;
          onClick(reviewerName);
        }}
      />
    </ChartContainer>
  );
}
