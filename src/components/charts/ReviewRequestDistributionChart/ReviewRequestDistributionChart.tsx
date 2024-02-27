import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoRequestsReview } from './ReviewRequestDistributionUtils';

export interface ReviewRequestDistributionChartProps {
  user?: User | null;

  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who requests reviews
 * On the y-axis, it shows users who request changes. You will see from whom requested changes on hover.
 * On the x-axis, it shows the number of pull requests that the user asked to review.
 */
export function ReviewRequestDistributionChart(props: ReviewRequestDistributionChartProps) {
  if (props.user) return <ReviewRequestForUser {...props} />;

  return <ReviewRequestForAll {...props} />;
}

function ReviewRequestForAll({ users, pullRequests }: ReviewRequestDistributionChartProps) {
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

function ReviewRequestForUser({ user, pullRequests }: ReviewRequestDistributionChartProps) {
  const data = useMemo(() => {
    const obj = getWhoRequestsReview(pullRequests, user!.id);
    const array = Object.entries(obj).map((item) => ({ id: item[0], label: item[0], value: item[1] }));
    return array;
  }, [pullRequests, user]);

  return (
    <ChartContainer title={`${user!.userName} asks following people to review his changes`}>
      <BarChart data={data} />
    </ChartContainer>
  );
}
