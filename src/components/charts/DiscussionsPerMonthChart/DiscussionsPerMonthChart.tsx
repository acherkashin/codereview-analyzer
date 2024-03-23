import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { User, UserDiscussion } from '../../../services/types';
import { useMemo } from 'react';
import { getDiscussionLineChartData } from './DiscussionsPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';

export interface DiscussionsPerMonthChartProps {
  user?: User;
  discussions: UserDiscussion[];
}

export function DiscussionsPerMonthChart({ discussions, user }: DiscussionsPerMonthChartProps) {
  const data = useMemo(() => getDiscussionLineChartData(discussions, user ? [user.displayName] : []), [discussions, user]);

  return (
    <ChartContainer title="Discussions per month">
      <LineChart legendYLabel="Discussions count" data={data} sliceTooltip={CommentsLineChartTooltip} />
    </ChartContainer>
  );
}
