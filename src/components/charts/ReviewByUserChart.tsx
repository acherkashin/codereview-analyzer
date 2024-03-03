import { useMemo } from 'react';
import { PullRequest, User } from '../../services/types';
import { getReviewDataByUser } from '../../utils/ChartUtils';
import { ChartContainer } from '../ChartContainer';
import { BarChart } from './BarChart';
import { BaseChartTooltip } from '../tooltips/BaseChartTooltip';
import { Avatar, Stack } from '@mui/material';

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
        tooltip={(props) => {
          const barData = props.data as ReviewDataByUser;
          const { userAvatarUrl, userName, Reviewed = 0, Assigned = 0, Approved = 0 } = barData;
          const requestedChanges = barData['Requested Changes'] || 0;

          return (
            <ReviewByUserTooltip
              userAvatarUrl={userAvatarUrl}
              userName={userName}
              reviewedCount={Reviewed}
              assignedCount={Assigned}
              approvedCount={Approved}
              requestedChangesCount={requestedChanges}
            />
          );
        }}
      />
    </ChartContainer>
  );
}

function ReviewChartForUser({ user, pullRequests }: ReviewByUserChartProps) {
  const reviewByUser = useMemo(() => getReviewDataByUser([user!], pullRequests)[0], [pullRequests, user]);
  const data = useMemo(() => {
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
  }, [reviewByUser]);

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
        tooltip={() => {
          return (
            <ReviewByUserTooltip
              userAvatarUrl={user!.avatarUrl}
              userName={user!.userName}
              reviewedCount={reviewByUser.Reviewed}
              assignedCount={reviewByUser.Assigned}
              approvedCount={reviewByUser.Approved}
              requestedChangesCount={reviewByUser['Requested Changes']}
            />
          );
        }}
      />
    </ChartContainer>
  );
}

interface ReviewByUserTooltipProps {
  userAvatarUrl: string;
  userName: string;
  reviewedCount: number;
  assignedCount: number;
  approvedCount: number;
  requestedChangesCount?: number;
}

function ReviewByUserTooltip({
  userAvatarUrl,
  userName,
  approvedCount,
  reviewedCount,
  assignedCount,
  requestedChangesCount,
}: ReviewByUserTooltipProps) {
  const requestedChanges = requestedChangesCount || 0;
  const reviewedPercent = Math.ceil((reviewedCount / assignedCount) * 100) + '%';
  const approvedPercent = Math.ceil((approvedCount / assignedCount) * 100) + '%';
  const requestChangesPercent = Math.ceil((requestedChanges / assignedCount) * 100) + '%';

  return (
    <BaseChartTooltip>
      <Stack direction="column" alignItems="center">
        <Stack direction="row" alignItems="center" gap={1}>
          <Avatar src={userAvatarUrl} alt={`${userName}'s avatar`} />
          <strong>{userName}</strong>
        </Stack>
        <Stack direction="row" alignItems="center">
          <ul>
            <li>Pull Requests assigned - {assignedCount}</li>
            <li>
              Reviewed - {reviewedCount}/{assignedCount} - <strong>{reviewedPercent}</strong>
            </li>
            <li>
              Approved - {approvedCount}/{assignedCount} - <strong>{approvedPercent}</strong>
            </li>
            <li>
              Request Changes - {requestedChanges}/{assignedCount} - <strong>{requestChangesPercent}</strong>
            </li>
          </ul>
        </Stack>
      </Stack>
    </BaseChartTooltip>
  );
}
