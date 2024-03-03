import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoRequestReviews, getWhoRequestReviewsArray } from './ReviewRequestRecipientsUtils';
import { BaseReviewTooltip } from '../../tooltips';

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
export function ReviewRequestRecipients(props: ReviewRequestRecipientsProps) {
  if (props.user) return <ReviewRequestForUser {...props} />;

  return <ReviewRequestForAll {...props} />;
}

function ReviewRequestForAll({ users, pullRequests }: ReviewRequestRecipientsProps) {
  const { data, authors } = useMemo(() => {
    // we will build data that shows who request review from every user
    return getBarChartData(pullRequests, users, getWhoRequestReviews);
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Review Requested From">
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        indexBy="approverName"
        keys={authors}
        data={data}
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
    return getWhoRequestReviewsArray(pullRequests, user!.id).map((item) => ({ id: item.displayName, value: item.total }));
  }, [pullRequests, user]);

  return (
    <ChartContainer title={`Review requested from ${user!.userName} `}>
      <BarChart
        data={data}
        tooltip={(props) => (
          <BaseReviewTooltip reviewer={user!.userName} count={props.value} author={props.indexValue as string} />
        )}
      />
    </ChartContainer>
  );
}
