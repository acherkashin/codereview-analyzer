import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoRequestsReview, getWhoRequestsReviewArray } from './ReviewRequestDistributionUtils';
import { BaseReviewTooltip, ReviewRequestTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

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
    <ChartContainer title="Review Requested By" description={<ReviewRequestDescription />}>
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        // axisBottom={{}}
        indexBy="approverName"
        keys={authors}
        data={data}
        colors={chartColor}
        tooltip={(props) => {
          return <BaseReviewTooltip author={props.indexValue as string} count={props.value} reviewer={props.id as string} />;
        }}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}

function ReviewRequestForUser({ user, pullRequests }: ReviewRequestDistributionChartProps) {
  const data = useMemo(() => {
    return getWhoRequestsReviewArray(pullRequests, user!.id).map(({ displayName, total, reviewed }) => ({
      id: displayName,
      value: total,
      reviewed,
    }));
  }, [pullRequests, user]);

  return (
    <ChartContainer title={`${user!.userName} requests review from`} description={<ReviewRequestDescription />}>
      <BarChart
        data={data}
        keys={['value', 'reviewed']}
        groupMode="grouped"
        tooltip={(props) => {
          const author = user!.userName as string;
          const reviewer = props.indexValue as string;
          const { value: count = 0, reviewed = 0 } = props.data as typeof data[number];

          return <ReviewRequestTooltip authorName={author} reviewerName={reviewer} count={count} reviewed={reviewed} />;
        }}
      />
    </ChartContainer>
  );
}

function ReviewRequestDescription() {
  return (
    <Stack gap={1}>
      <div>
        Shows which users frequently request reviews from others and displays the individuals they ask to review their changes.
      </div>
      <div>Filter by a particular user to easily identify who he or she ask for reviews from.</div>
    </Stack>
  );
}
