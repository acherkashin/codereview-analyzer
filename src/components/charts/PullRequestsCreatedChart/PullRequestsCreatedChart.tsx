import { useMemo } from 'react';
import { ChartContainer } from '../../';
import { PullRequest } from '../../../services/types';
import { BarChart } from '../BarChart';
import { arrange, asc, groupBy, n, summarize, tidy } from '@tidyjs/tidy';

export interface PullRequestsCreatedChartProps {
  pullRequests: PullRequest[];
}

export function PullRequestsCreatedChart({ pullRequests }: PullRequestsCreatedChartProps) {
  const createdPullRequestsPieChart = useMemo(() => getPullRequestCreatedData(pullRequests), [pullRequests]);

  return (
    <ChartContainer title="Pull Requests Created">
      <BarChart {...createdPullRequestsPieChart} onClick={() => {}} />
    </ChartContainer>
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
