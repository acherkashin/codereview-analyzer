import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { User, UserDiscussion } from '../../../services/types';
import { useMemo } from 'react';
import { getDiscussionStartedWithData } from './DiscussionsStartedWithPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';

export interface DiscussionsStartedWithPerMonthChartProps {
  user?: User;
  discussions: UserDiscussion[];
  onClick: (date: Date) => void;
}

export function DiscussionsStartedWithPerMonthChart({ discussions, user, onClick }: DiscussionsStartedWithPerMonthChartProps) {
  const data = useMemo(() => getDiscussionStartedWithData(discussions, user ? [user.displayName] : []), [discussions, user]);

  return (
    <ChartContainer
      title="Discussions started with person per month"
      description="Allows to analyze how many discussions started with each user by other users per month"
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
