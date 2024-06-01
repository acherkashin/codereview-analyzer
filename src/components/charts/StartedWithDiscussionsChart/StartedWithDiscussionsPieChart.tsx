import { useMemo } from 'react';
import { UserDiscussion } from '../../../services/types';
import { ChartContainer } from '../../ChartContainer';
import { PieChart } from '../PieChart';
import { convertToDiscussionsReceivedPieChart } from './StartedWithDiscussionsChartUtils';
import { chartColor } from '../../../utils/ColorUtils';
import Stack from '@mui/material/Stack';

export interface StartedWithDiscussionsPieChartProps {
  discussions: UserDiscussion[];
  onClick: (authorName: string) => void;
}

export function StartedWithDiscussionsPieChart({ discussions, onClick }: StartedWithDiscussionsPieChartProps) {
  const data = useMemo(() => convertToDiscussionsReceivedPieChart(discussions), [discussions]);

  return (
    <ChartContainer
      title="Discussions started with person"
      description={
        <Stack gap={1}>
          <div>Shows how discussions are distributed among authors of merge requests.</div>
          <div>Click on any segment to dive into the conversations happening around that author</div>
        </Stack>
      }
    >
      <PieChart
        data={data}
        colors={chartColor}
        onClick={(e) => {
          const authorName = e.id as string;
          onClick(authorName);
        }}
      />
    </ChartContainer>
  );
}
