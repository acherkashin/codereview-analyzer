import { useMemo } from 'react';
import { PullRequest, User } from '../../clients/types';
import { getReviewDataByUser } from '../../utils/ChartUtils';
import { ChartContainer } from '../ChartContainer';
import { BarChart } from './BarChart';

export interface ReviewByUserChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

export function ReviewByUserChart({ users, pullRequests }: ReviewByUserChartProps) {
  const data = useMemo(() => getReviewDataByUser(users, pullRequests), [users, pullRequests]);

  return (
    <ChartContainer title={`Reviews by user`}>
      <BarChart
        indexBy="userName"
        keys={['reviewRequestedCount', 'reviewedCount']}
        data={data}
        margin={{ bottom: 100, left: 50 }}
        groupMode="grouped"
        layout="vertical"
        borderRadius={4}
        axisLeft={{}}
        axisBottom={{
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 90,
        }}
        // tooltip={(props) => {
        //   const { indexValue: pullRequestName, value: commentsCount, data } = props;
        //   const authorAvatarUrl = data.authorAvatarUrl as string;
        //   const authorName = data.authorName as string;

        //   return (
        //     <BaseChartTooltip {...props}>
        //       <Avatar src={authorAvatarUrl} alt={`${authorName}'s avatar`} />
        //       <div>{data.authorName}</div> got <strong>{commentsCount}</strong> comments for <strong>{pullRequestName}</strong>
        //     </BaseChartTooltip>
        //   );
        // }}
      />
    </ChartContainer>
  );
}
