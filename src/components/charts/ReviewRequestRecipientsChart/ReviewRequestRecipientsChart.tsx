import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoRequestReviews, getWhoRequestReviewsArray } from './ReviewRequestRecipientsUtils';
import { BaseReviewTooltip, ReviewRequestTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface ReviewRequestRecipientsProps {
  user?: User | null;
  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who receive review requests.
 * On y-axis it shows who get review requests.
 * On x-axis it shows number of pull requests that user asked to review.
 */
export function ReviewRequestRecipientsChart(props: ReviewRequestRecipientsProps) {
  if (props.user) return <ReviewRequestForUser {...props} />;

  return <ReviewRequestForAll {...props} />;
}

function ReviewRequestForAll({ users, pullRequests }: ReviewRequestRecipientsProps) {
  const { data, authors } = useMemo(() => {
    // we will build data that shows who request review from every user
    return getBarChartData(pullRequests, users, getWhoRequestReviews);
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Review Requested From" description={<ReviewRequestDescription />}>
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        indexBy="approverName"
        keys={authors}
        data={data}
        colors={chartColor}
        tooltip={(props) => {
          return <BaseReviewTooltip reviewer={props.indexValue as string} count={props.value} author={props.id as string} />;
        }}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}

function ReviewRequestForUser({ user, pullRequests }: ReviewRequestRecipientsProps) {
  const data = useMemo(() => {
    return getWhoRequestReviewsArray(pullRequests, user!.id).map((item) => ({
      id: item.displayName,
      total: item.total,
      reviewed: item.reviewed,
    }));
  }, [pullRequests, user]);

  return (
    <ChartContainer title={`Review requested from ${user!.userName} `} description={<ReviewRequestDescription />}>
      <BarChart
        data={data}
        keys={['total', 'reviewed']}
        groupMode="grouped"
        tooltip={(props) => {
          const reviewer = user!.userName as string;
          const author = props.indexValue as string;
          const { total: count = 0, reviewed = 0 } = props.data as typeof data[number];

          return <ReviewRequestTooltip authorName={author} reviewerName={reviewer} count={count} reviewed={reviewed} />;
        }}
      />
    </ChartContainer>
  );
}

function ReviewRequestDescription() {
  return (
    <Stack gap={1}>
      <div>Shows whom users frequently request reviews from and displays the individuals who ask to review their changes.</div>
      <div>Filter by a particular user to easily identify whom users ask for review.</div>
    </Stack>
  );
}
