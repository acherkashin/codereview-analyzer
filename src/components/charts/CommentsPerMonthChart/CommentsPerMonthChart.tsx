import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { Comment, User } from '../../../services/types';
import { useMemo } from 'react';
import { getCommentsLineChartData } from './CommentsPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';

export interface CommentsPerMonthChartProps {
  user?: User;
  comments: Comment[];
}

export function CommentsPerMonthChart({ comments, user }: CommentsPerMonthChartProps) {
  const data = useMemo(() => getCommentsLineChartData(comments, user ? [user.displayName] : []), [comments, user]);

  return (
    <ChartContainer title="Comments per month">
      <LineChart legendYLabel="Comments count" colors={chartColor} data={data} sliceTooltip={CommentsLineChartTooltip} />
    </ChartContainer>
  );
}
