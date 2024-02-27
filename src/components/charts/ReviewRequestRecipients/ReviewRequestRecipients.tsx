import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoRequestReviews } from './ReviewRequestRecipientsUtils';

export interface ReviewRequestRecipientsProps {
  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who receive review requests.
 * On y-axis it shows who get review requests.
 * On x-axis it shows number of pull requests that user asked to review.
 */
export function ReviewRequestRecipients({ users, pullRequests }: ReviewRequestRecipientsProps) {
  const { data, authors } = useMemo(() => {
    // we will build data that shows who request review from every user
    return getBarChartData(pullRequests, users, getWhoRequestReviews);
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
