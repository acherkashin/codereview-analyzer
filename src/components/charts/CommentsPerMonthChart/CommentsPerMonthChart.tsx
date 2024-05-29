import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { Comment, User } from '../../../services/types';
import { useMemo } from 'react';
import { getCommentsLineChartData } from './CommentsPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface CommentsPerMonthChartProps {
  user?: User;
  comments: Comment[];
}

export function CommentsPerMonthChart({ comments, user }: CommentsPerMonthChartProps) {
  const data = useMemo(() => getCommentsLineChartData(comments, user ? [user.displayName] : []), [comments, user]);

  return (
    <ChartContainer
      title="Comments left by person per month"
      description={
        <Stack gap={1}>
          <div>Enables the analysis of how frequently each user initiates discussions on a monthly basis.</div>
          <div>
            It also provides the capability to filter results by individual users to view the quantity of comments made by them.
          </div>
        </Stack>
      }
    >
      <LineChart legendYLabel="Comments count" colors={chartColor} data={data} sliceTooltip={CommentsLineChartTooltip} />
    </ChartContainer>
  );
}
