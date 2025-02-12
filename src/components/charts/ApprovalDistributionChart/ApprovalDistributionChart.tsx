import { useMemo } from 'react';
import { BarDatum, BarTooltipProps } from '@nivo/bar';
import { PullRequest, User } from '../../../services/types';
import { getWhoUserApprovesArray, getWhomUserApproves } from './ApprovalDistributionUtils';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { BaseApprovalsTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface ApprovalDistributionProps {
  user?: User | null;

  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who gives approvals.
 */
export function ApprovalDistributionChart(props: ApprovalDistributionProps) {
  if (props.user) return <ApprovalDistributionForUser {...props} />;

  return <ApprovalDistributionForAll {...props} />;
}

/**
 * On y-axis - who gives approvals,
 * On x-axis - how many approvals is given.
 * Inside every bar is visible to whom approvals were given.
 */
function ApprovalDistributionForAll({ pullRequests, users }: ApprovalDistributionProps) {
  const { data, authors } = useMemo(() => {
    return getBarChartData(pullRequests, users, getWhomUserApproves);
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Approved By" description={<ApprovedByDescription />}>
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        indexBy="approverName"
        keys={authors}
        data={data}
        colors={chartColor}
        tooltip={ApprovalsAllTooltip}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}

function ApprovalsAllTooltip(props: BarTooltipProps<BarDatum>) {
  const { indexValue: approver, id: author, value: approvesCount } = props;

  return <BaseApprovalsTooltip approver={approver as string} author={author as string} count={approvesCount} />;
}

/**
 * On y-axis - who receives approvals from @user
 * On x-axis - how many approvals are received
 */
function ApprovalDistributionForUser({ pullRequests, user }: ApprovalDistributionProps) {
  const data = useMemo(() => {
    return getWhoUserApprovesArray(pullRequests, user!.id).map(({ displayName, total }) => ({
      id: displayName,
      value: total,
    }));
  }, [pullRequests, user]);

  return (
    <ChartContainer title={`${user!.userName} gives approvals to`} description={<ApprovedByDescription />}>
      <BarChart
        data={data}
        tooltip={(props) => {
          return <BaseApprovalsTooltip approver={user!.displayName} author={props.indexValue as string} count={props.value} />;
        }}
      />
    </ChartContainer>
  );
}

function ApprovedByDescription() {
  return (
    <Stack gap={1}>
      <div>Displays whose pool requests each user approves.</div>
      <div>Filter by a particular user to easily identify whose pull requests the user approves.</div>
    </Stack>
  );
}
