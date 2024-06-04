import { PullRequest, User } from '../../../services/types';
import { getReviewRationForUser } from '../../../utils/ChartUtils';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';

export interface ReviewRationChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

export function ReviewRationChart({ users, pullRequests }: ReviewRationChartProps) {
  const data = users
    .map((item) => {
      const ration = getReviewRationForUser(pullRequests, item.id);

      return {
        id: item.displayName,
        value: ration,
        userId: item.id,
      };
    })
    .filter((item) => item.value > 0)
    .toSorted((a, b) => a.value - b.value);

  return (
    <ChartContainer
      title="Review ration"
      description={
        <div>
          Shows review ration for every developer - the probability that the developer will review a pull request assigned to him.
        </div>
      }
    >
      <BarChart
        data={data}
        label={({ value }) => `${value}%`}
        onClick={(e) => {
          console.log(e);
        }}
      />
    </ChartContainer>
  );
}
