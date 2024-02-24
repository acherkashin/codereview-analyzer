import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoGetReviewRequests } from './ReviewRequestRecipientsUtils';

export interface ReviewRequestRecipientsProps {
  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who receive review requests
 */
export function ReviewRequestRecipients({ users, pullRequests }: ReviewRequestRecipientsProps) {
  const { data, authors } = useMemo(() => {
    return getBarChartData(pullRequests, users, getWhoGetReviewRequests);
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Review Requested From">
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
