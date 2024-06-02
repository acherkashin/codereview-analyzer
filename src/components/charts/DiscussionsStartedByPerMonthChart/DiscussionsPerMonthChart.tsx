import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { User, UserDiscussion } from '../../../services/types';
import { useMemo } from 'react';
import { getDiscussionStartedByData } from './DiscussionsStartedByPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface DiscussionsStartedByPerMonthChartProps {
  user?: User;
  discussions: UserDiscussion[];
  onClick: (date: Date) => void;
}

export function DiscussionsStartedByPerMonthChart({ discussions, user, onClick }: DiscussionsStartedByPerMonthChartProps) {
  const data = useMemo(() => getDiscussionStartedByData(discussions, user ? [user.displayName] : []), [discussions, user]);

  return (
    <ChartContainer
      title="Discussions started by person per month"
      description={
        <Stack gap={1}>
          <div>Enables the analysis of how frequently each user initiates discussions on a monthly basis.</div>
          <div>
            It also provides the capability to filter results by individual users to view the quantity of discussions started by
            them.
          </div>
        </Stack>
      }
    >
      <LineChart
        legendYLabel="Discussions count"
        data={data}
        colors={chartColor}
        sliceTooltip={CommentsLineChartTooltip}
        onClick={(event) => {
          const pointDate = (event as any).points[0].data.x as Date;

          onClick(pointDate);
        }}
      />
    </ChartContainer>
  );
}
