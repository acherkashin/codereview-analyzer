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
  const keys: (keyof typeof data[0])[] = ['Assigned', 'Reviewed', 'Approved', 'Requested Changes'];

  return (
    <ChartContainer title={`Pull Request reviews by user`} style={{ width: 1020 }}>
      <BarChart
        width={1020}
        indexBy="userName"
        keys={keys}
        data={data}
        margin={{ bottom: 100, left: 50, right: 150 }}
        groupMode="grouped"
        layout="vertical"
        borderRadius={4}
        axisBottom={{
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 90,
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'top-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
        tooltip={(props) => {
          const { userAvatarUrl, userName, Reviewed, Assigned } = props.data as typeof data[0];
          const percents = Math.floor((Reviewed / Assigned) * 100) + '%';

          return (
            <BaseChartTooltip {...props}>
              <Avatar src={userAvatarUrl} alt={`${userName}'s avatar`} />
              <div>{userName}</div> reviewed <strong>{Reviewed}</strong> pull requests from <strong>{Assigned}</strong> (
              {percents})
            </BaseChartTooltip>
          );
        }}
      />
    </ChartContainer>
  );
}
