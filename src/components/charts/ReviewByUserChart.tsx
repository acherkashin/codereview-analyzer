import { useMemo } from 'react';
import { PullRequest, User } from '../../services/types';
import { getReviewDataByUser } from '../../utils/ChartUtils';
import { ChartContainer } from '../ChartContainer';
import { BarChart } from './BarChart';
import { BaseChartTooltip } from '../BaseChartTooltip';
import { Avatar, Stack } from '@mui/material';

export interface ReviewByUserChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

export function ReviewByUserChart({ users, pullRequests }: ReviewByUserChartProps) {
  const data = useMemo(() => getReviewDataByUser(users, pullRequests), [users, pullRequests]);
  const keys: (keyof typeof data[0])[] = ['Assigned', 'Reviewed', 'Approved', 'Requested Changes'];

  return (
    <ChartContainer title={`Pull Requests reviews by user`} style={{ width: 1020 }}>
      <BarChart
        width={1020}
        indexBy="userName"
        keys={keys}
        data={data}
        margin={{ top: 50, right: 150, bottom: 120, left: 50 }}
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
          const barData = props.data as typeof data[0];
          const { userAvatarUrl, userName, Reviewed = 0, Assigned = 0, Approved = 0 } = barData;
          const requestedChanges = barData['Requested Changes'] || 0;
          const reviewedPercent = Math.ceil((Reviewed / Assigned) * 100) + '%';
          const approvedPercent = Math.ceil((Approved / Assigned) * 100) + '%';
          const requestChangesPercent = Math.ceil((requestedChanges / Assigned) * 100) + '%';

          return (
            <BaseChartTooltip>
              <Stack direction="column" alignItems="center">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Avatar src={userAvatarUrl} alt={`${userName}'s avatar`} />
                  <strong>{userName}</strong>
                </Stack>
                <Stack direction="row" alignItems="center">
                  <ul>
                    <li>Pull Requests assigned - {Assigned}</li>
                    <li>
                      Reviewed - {Reviewed}/{Assigned} - <strong>{reviewedPercent}</strong>
                    </li>
                    <li>
                      Approved - {Approved}/{Assigned} - <strong>{approvedPercent}</strong>
                    </li>
                    <li>
                      Request Changes - {requestedChanges}/{Assigned} - <strong>{requestChangesPercent}</strong>
                    </li>
                  </ul>
                </Stack>
              </Stack>
            </BaseChartTooltip>
          );
        }}
      />
    </ChartContainer>
  );
}
