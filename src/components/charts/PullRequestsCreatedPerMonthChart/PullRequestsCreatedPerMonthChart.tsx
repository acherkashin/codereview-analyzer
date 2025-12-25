import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest, User } from '../../../services/types';
import { useMemo, useState } from 'react';
import { getPullRequestsLineChartData } from './PullRequestsCreatedPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';
import { PullRequestDialog } from '../../dialogs/PullRequestDialog';
import dayjs from 'dayjs';

export interface PullRequestsCreatedPerMonthChartProps {
  user?: User;
  pullRequests: PullRequest[];
}

export function PullRequestsCreatedPerMonthChart({ pullRequests, user }: PullRequestsCreatedPerMonthChartProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPullRequests, setSelectedPullRequests] = useState<PullRequest[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');

  const data = useMemo(() => getPullRequestsLineChartData(pullRequests, user ? [user.displayName] : []), [pullRequests, user]);

  const handlePointClick = (point: any) => {
    const clickedDate = point.data.x;
    const clickedUser = point.serieId;

    // Filter PRs by month and user (if specific user)
    const monthStart = dayjs(clickedDate).startOf('month');
    const monthEnd = dayjs(clickedDate).endOf('month');

    const filteredPRs = pullRequests.filter((pr) => {
      const prDate = dayjs(pr.createdAt);
      const dateMatch = prDate.isAfter(monthStart) && prDate.isBefore(monthEnd);
      const userMatch = !user || pr.author.displayName === clickedUser;
      return dateMatch && userMatch;
    });

    setSelectedPullRequests(filteredPRs);
    setDialogTitle(`Pull Requests - ${dayjs(clickedDate).format('MMMM YYYY')}${user ? ` by ${user.displayName}` : ''}`);
    setDialogOpen(true);
  };

  return (
    <>
      <ChartContainer
        title="Pull requests created per month"
        description={
          <Stack gap={1}>
            <div>Shows the number of pull requests created by each user on a monthly basis.</div>
            <div>Filter by individual users to view the quantity of pull requests created by them over time.</div>
            <div>Click on a data point to see the detailed list of pull requests for that month.</div>
          </Stack>
        }
      >
        <LineChart
          legendYLabel="Pull requests count"
          colors={chartColor}
          data={data}
          sliceTooltip={CommentsLineChartTooltip}
          onClick={handlePointClick}
        />
      </ChartContainer>

      <PullRequestDialog
        open={dialogOpen}
        title={dialogTitle}
        pullRequests={selectedPullRequests}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
