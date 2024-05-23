import { useMemo } from 'react';
import { UserDiscussion } from '../../../services/types';
import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { convertToDiscussionsStartedPieChart } from './StartedByDiscussionsChartUtils';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface StartedByDiscussionsPieChartProps {
  discussions: UserDiscussion[];
  onClick: (reviewerName: string) => void;
}

export function StartedByDiscussionsPieChart({ discussions, onClick }: StartedByDiscussionsPieChartProps) {
  const data = useMemo(() => convertToDiscussionsStartedPieChart(discussions), [discussions]);
  return (
    <ChartContainer
      title="Discussions started by person"
      description={
        <Stack gap={1}>
          <div>
            Allows you to see the ratio of the total number of discussions, who starts more discussions and who starts more.
            discussions.
          </div>
          <div>Click on the slice to see the list of pull requests where user started discussions.</div>
        </Stack>
      }
    >
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
