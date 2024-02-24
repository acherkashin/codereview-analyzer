import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { getChartData } from './ApprovedByChartUtils';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';

export interface ApprovedByChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

export function ApprovedByChart({ users, pullRequests }: ApprovedByChartProps) {
  const { data, authors } = useMemo(() => {
    return getChartData(pullRequests, users);
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Approved By">
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        // axisBottom={{}}
        indexBy="approverName"
        keys={authors}
        data={data}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}
