import { useMemo } from 'react';
import { PullRequest, User } from '../../clients/types';
import { getReviewDataByUser } from '../../utils/ChartUtils';
import { ChartContainer } from '../ChartContainer';
import { BarChart } from './BarChart';
import { BaseChartTooltip } from '../BaseChartTooltip';
import { Avatar } from '@mui/material';

export interface ReviewByUserChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

export function ReviewByUserChart({ users, pullRequests }: ReviewByUserChartProps) {
  const data = useMemo(() => getReviewDataByUser(users, pullRequests), [users, pullRequests]);

  return (
    <ChartContainer title={`Reviews by user`}>
      <BarChart
        width={1000}
        indexBy="userName"
        keys={['reviewRequestedCount', 'reviewedCount', 'approvedCount', 'requestedChangesCount']}
        data={data}
        margin={{ bottom: 100, left: 50 }}
        groupMode="grouped"
        layout="vertical"
        borderRadius={4}
        axisBottom={{
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 90,
        }}
        tooltip={(props) => {
          const { userAvatarUrl, userName, reviewedCount, reviewRequestedCount } = props.data as typeof data[0];
          const percents = Math.floor((reviewedCount / reviewRequestedCount) * 100) + '%';

          return (
            <BaseChartTooltip {...props}>
              <Avatar src={userAvatarUrl} alt={`${userName}'s avatar`} />
              <div>{userName}</div> reviewed <strong>{reviewedCount}</strong> pull requests from{' '}
              <strong>{reviewRequestedCount}</strong> ({percents})
            </BaseChartTooltip>
          );
        }}
      />
    </ChartContainer>
  );
}
