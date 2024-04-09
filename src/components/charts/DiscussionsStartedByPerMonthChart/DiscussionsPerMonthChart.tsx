import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { User, UserDiscussion } from '../../../services/types';
import { useMemo } from 'react';
import { getDiscussionStartedByData } from './DiscussionsStartedByPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';

export interface DiscussionsStartedByPerMonthChartProps {
  user?: User;
  discussions: UserDiscussion[];
}

export function DiscussionsStartedByPerMonthChart({ discussions, user }: DiscussionsStartedByPerMonthChartProps) {
  const data = useMemo(() => getDiscussionStartedByData(discussions, user ? [user.displayName] : []), [discussions, user]);

  return (
    <ChartContainer title="Discussions started by person per month">
      <LineChart
        legendYLabel="Discussions count"
        data={data}
        sliceTooltip={CommentsLineChartTooltip}
        onClick={(event) => {
          // console.log();
          const filtered = discussions.filter((item) => {
            const date = new Date(item.comments[0].createdAt);
            const pointDate = (event as any).points[0].data.x as Date;

            return date.getMonth() === pointDate.getMonth() && date.getFullYear() === pointDate.getFullYear();
          });

          console.log(filtered);
        }}
      />
    </ChartContainer>
  );
}
