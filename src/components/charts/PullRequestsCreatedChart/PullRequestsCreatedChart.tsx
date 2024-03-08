import { useMemo } from 'react';
import { ChartContainer } from '../../';
import { PullRequest } from '../../../services/types';
import { convertToPullRequestCreated } from '../../../utils/ChartUtils';
import { BarChart } from '../BarChart';

export interface PullRequestsCreatedChartProps {
  pullRequests: PullRequest[];
}

export function PullRequestsCreatedChart({ pullRequests }: PullRequestsCreatedChartProps) {
  const createdPullRequestsPieChart = useMemo(() => convertToPullRequestCreated(pullRequests), [pullRequests]);

  return (
    <ChartContainer title="Pull Requests Created">
      <BarChart {...createdPullRequestsPieChart} onClick={() => {}} />
    </ChartContainer>
  );
}
