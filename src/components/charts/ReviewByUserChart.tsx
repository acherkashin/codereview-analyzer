import { useMemo } from 'react';
import { PullRequest, User } from '../../services/types';
import { getReviewDataByUser } from '../../utils/ChartUtils';
import { ChartContainer } from '../ChartContainer';
import { BarChart } from './BarChart';
import { BaseChartTooltip } from '../BaseChartTooltip';
import { Avatar, Stack } from '@mui/material';
import { BarDatum, BarTooltipProps } from '@nivo/bar';

export interface ReviewByUserChartProps {
  user?: User | null;

  users: User[];
  pullRequests: PullRequest[];
}

type ReviewDataByUser = ReturnType<typeof getReviewDataByUser>[0];
const keys: (keyof ReviewDataByUser)[] = ['Assigned', 'Reviewed', 'Approved', 'Requested Changes'];

export function ReviewByUserChart(props: ReviewByUserChartProps) {
  if (props.user) return <ReviewChartForUser {...props} />;

  return <ReviewChartForAll {...props} />;
}

function ReviewChartForAll({ users, pullRequests }: ReviewByUserChartProps) {
  const data = useMemo(() => getReviewDataByUser(users, pullRequests), [users, pullRequests]);
  const width = 1020;

  return (
    <ChartContainer title={'Pull Requests reviews by user'} style={{ width }}>
      <BarChart
        width={width}
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
        tooltip={ReviewByUserTooltip}
      />
    </ChartContainer>
  );
}

function ReviewChartForUser({ user, users, pullRequests }: ReviewByUserChartProps) {
  const data = useMemo(() => {
    const reviewByUser = getReviewDataByUser([user!], pullRequests)[0];

    return [
      {
        id: 'Assigned',
        value: reviewByUser.Assigned,
      },
      {
        id: 'Reviewed',
        value: reviewByUser.Reviewed,
      },
      {
        id: 'Approved',
        value: reviewByUser.Approved,
      },
      {
        id: 'Requested Changes',
        value: reviewByUser['Requested Changes'],
      },
    ];
  }, [user, pullRequests]);

  const width = 500;
  const title = `Pull Requests reviews by ${user!.displayName}`;

  return (
    <ChartContainer title={title} style={{ width }}>
      <BarChart
        width={width}
        data={data}
        margin={{ top: 0, right: 30, bottom: 50, left: 120 }}
        groupMode="grouped"
        layout="horizontal"
        borderRadius={4}
        axisBottom={{
          tickSize: 10,
          tickPadding: 5,
          tickRotation: 90,
        }}
        legends={undefined}
        tooltip={user ? undefined : ReviewByUserTooltip}
      />
    </ChartContainer>
  );
}

function ReviewByUserTooltip({ data }: BarTooltipProps<BarDatum>) {
  const barData = data as ReviewDataByUser;
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
}
