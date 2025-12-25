import { useMemo, useState } from 'react';
import { ChartContainer } from '../../';
import { PullRequest } from '../../../services/types';
import { BarChart } from '../BarChart';
import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { Stack } from '@mui/material';
import { PullRequestDialog } from '../../dialogs/PullRequestDialog';

export interface PullRequestsCreatedChartProps {
  pullRequests: PullRequest[];
}

export function PullRequestsCreatedChart({ pullRequests }: PullRequestsCreatedChartProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPullRequests, setSelectedPullRequests] = useState<PullRequest[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');

  const createdPullRequestsPieChart = useMemo(() => getPullRequestCreatedData(pullRequests), [pullRequests]);

  const handleBarClick = (data: any) => {
    const userName = data.indexValue;
    const userPullRequests = pullRequests.filter((pr) => pr.author.displayName === userName);

    setSelectedPullRequests(userPullRequests);
    setDialogTitle(`Pull Requests by ${userName}`);
    setDialogOpen(true);
  };

  return (
    <>
      <ChartContainer
        title="Pull Requests created by user"
        description={
          <Stack gap={1}>
            <div>Displays the number of pull requests contributed by each user.</div>
            <div>Specify date range to see how many pull requests were created in that period.</div>
            <div>Click on a bar to see the detailed list of pull requests.</div>
          </Stack>
        }
      >
        <BarChart {...createdPullRequestsPieChart} onClick={handleBarClick} />
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

export function getPullRequestCreatedData(pullRequests: PullRequest[]) {
  const rawData = pullRequests.map((item) => ({ userName: item.author.displayName }));

  const data = tidy(rawData, groupBy('userName', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    indexBy: 'userName',
    keys: ['total'],
    data,
  };
}
