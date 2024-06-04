import { useMemo } from 'react';
import { PullRequest, User } from '../../services/types';
import { getReviewDataByUser } from '../../utils/ChartUtils';
import { ChartContainer } from '../ChartContainer';
import { BarChart } from './BarChart';
import { BaseChartTooltip } from '../tooltips/BaseChartTooltip';
import { Avatar, Stack } from '@mui/material';
import { getHostType, useChartsStore } from '../../stores/ChartsStore';
import { toPercentString } from '../../utils/PercentUtils';

export interface ReviewByUserChartProps {
  user?: User | null;

  users: User[];
  pullRequests: PullRequest[];
}

type ReviewDataByUser = ReturnType<typeof getReviewDataByUser>[0];
const giteaKeys: (keyof ReviewDataByUser)[] = ['Assigned', 'Reviewed', 'Approved', 'Requested Changes'];
const gitlabKeys: (keyof ReviewDataByUser)[] = ['Assigned', 'Reviewed', 'Approved'];

export function ReviewByUserChart(props: ReviewByUserChartProps) {
  if (props.user) return <ReviewChartForUser {...props} />;

  return <ReviewChartForAll {...props} />;
}

function ReviewChartForAll({ users, pullRequests }: ReviewByUserChartProps) {
  const hostType = useChartsStore(getHostType);
  const data = useMemo(() => getReviewDataByUser(users, pullRequests), [users, pullRequests]);
  const keys = hostType === 'Gitea' ? giteaKeys : gitlabKeys;

  return (
    <ChartContainer title="Pull Requests reviews by user" description={<ReviewByUserDescription />}>
      <BarChart
        indexBy="userName"
        keys={keys}
        data={data}
        margin={{ top: 50, right: 50, bottom: 100, left: 50 }}
        groupMode="grouped"
        layout="vertical"
        borderRadius={4}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'top',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: -20,
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
        value: reviewByUser?.Assigned ?? 0,
      },
      {
        id: 'Reviewed',
        value: reviewByUser?.Reviewed ?? 0,
      },
      {
        id: 'Approved',
        value: reviewByUser?.Approved ?? 0,
      },
      {
        id: 'Requested Changes',
        value: reviewByUser?.['Requested Changes'] ?? 0,
      },
    ];
  }, [reviewByUser]);

  const width = 500;
  const title = `Pull Requests reviews by ${user!.displayName}`;

  return (
    <ChartContainer title={title} style={{ width }} description={<ReviewByUserDescription />}>
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

function ReviewByUserDescription() {
  return (
    <div>
      Displays how many pull requests were assigned to the user to make a review and how many were actually reviewed and approved.
    </div>
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
  const hostType = useChartsStore(getHostType);
  const requestedChanges = requestedChangesCount || 0;
  const reviewedPercent = toPercentString(reviewedCount, assignedCount);
  const approvedPercent = toPercentString(approvedCount, assignedCount);
  const requestChangesPercent = toPercentString(requestedChanges, assignedCount);

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
            {hostType !== 'Gitlab' && (
              <li>
                Request Changes - {requestedChanges}/{assignedCount} - <strong>{requestChangesPercent}</strong>
              </li>
            )}
          </ul>
        </Stack>
      </Stack>
    </BaseChartTooltip>
  );
}
