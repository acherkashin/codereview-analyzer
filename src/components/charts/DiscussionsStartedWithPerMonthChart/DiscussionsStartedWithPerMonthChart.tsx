import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { User, UserDiscussion } from '../../../services/types';
import { useMemo } from 'react';
import { getDiscussionStartedWithData } from './DiscussionsStartedWithPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';

export interface DiscussionsStartedWithPerMonthChartProps {
  user?: User;
  discussions: UserDiscussion[];
}

export function DiscussionsStartedWithPerMonthChart({ discussions, user }: DiscussionsStartedWithPerMonthChartProps) {
  const data = useMemo(() => getDiscussionStartedWithData(discussions, user ? [user.displayName] : []), [discussions, user]);

  return (
    <ChartContainer title="Discussions started with person per month">
      <LineChart legendYLabel="Discussions count" data={data} sliceTooltip={CommentsLineChartTooltip} />
    </ChartContainer>
  );
}
