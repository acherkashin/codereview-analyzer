import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhoRequestsReview, getWhoRequestsReviewArray } from './ReviewRequestDistributionUtils';
import { BaseChartTooltip, BaseReviewTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';
import { percentString } from '../../../utils/StringUtils';

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
    <ChartContainer title={`${user!.userName} requests review from`}>
      <BarChart
        data={data}
        keys={['value', 'reviewed']}
        groupMode="grouped"
        tooltip={(props) => {
          const author = user!.userName as string;
          const reviewer = props.indexValue as string;
          const { value: count = 0, reviewed = 0 } = props.data as typeof data[number];

          return (
            <BaseChartTooltip>
              <Stack spacing={1}>
                <div>
                  <strong>{author}</strong> requested review from <strong>{reviewer} </strong>
                  <strong>{count}</strong> times.
                </div>
                <div>
                  <strong>
                    {reviewed}/{count} ({percentString(reviewed, count)})
                  </strong>{' '}
                  pull requests were reviewed.
                </div>
              </Stack>
            </BaseChartTooltip>
          );
          // return <BaseReviewTooltip author={author} count={item.value} reviewer={props.indexValue as string} />;
        }}
      />
    </ChartContainer>
  );
}
