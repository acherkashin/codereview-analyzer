import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest, User } from '../../../services/types';
import { useMemo } from 'react';
import { getPullRequestsLineChartData } from './PullRequestsCreatedPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface PullRequestsCreatedPerMonthChartProps {
  user?: User;
  pullRequests: PullRequest[];
}

export function PullRequestsCreatedPerMonthChart({ pullRequests, user }: PullRequestsCreatedPerMonthChartProps) {
  const data = useMemo(() => getPullRequestsLineChartData(pullRequests, user ? [user.displayName] : []), [pullRequests, user]);

  return (
    <ChartContainer
      title="Pull requests created per month"
      description={
        <Stack gap={1}>
          <div>Shows the number of pull requests created by each user on a monthly basis.</div>
          <div>Filter by individual users to view the quantity of pull requests created by them over time.</div>
        </Stack>
      }
    >
      <LineChart legendYLabel="Pull requests count" colors={chartColor} data={data} sliceTooltip={CommentsLineChartTooltip} />
    </ChartContainer>
  );
}
