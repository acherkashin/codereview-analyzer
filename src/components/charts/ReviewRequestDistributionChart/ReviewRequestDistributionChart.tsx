import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoRequestsReview } from './ReviewRequestDistributionUtils';

export interface ReviewRequestDistributionChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who requests review
 */
export function ReviewRequestDistributionChart({ users, pullRequests }: ReviewRequestDistributionChartProps) {
  const { data, authors } = useMemo(() => {
    return getBarChartData(pullRequests, users, getWhoRequestsReview);
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Review Requested By">
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
