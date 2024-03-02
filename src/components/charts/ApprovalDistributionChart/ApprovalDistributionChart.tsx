import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { getWhomUserApproves } from './ApprovalDistributionUtils';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { BarDatum, BarTooltipProps } from '@nivo/bar';
import { BaseChartTooltip } from '../../BaseChartTooltip';

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
    <ChartContainer title="Approved By">
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        indexBy="approverName"
        keys={authors}
        data={data}
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
    const obj = getWhomUserApproves(pullRequests, user!.id);
    const array = Object.entries(obj).map((item) => ({ id: item[0], label: item[0], value: item[1] }));
    return array;
  }, [pullRequests, user]);

  return (
    <ChartContainer title={`${user!.userName} gives approvals to`}>
      <BarChart
        data={data}
        tooltip={(props) => {
          return <BaseApprovalsTooltip approver={user!.displayName} author={props.indexValue as string} count={props.value} />;
        }}
      />
    </ChartContainer>
  );
}

interface BaseApprovalsTooltipProps {
  approver: string;
  author: string;
  count: number;
}

function BaseApprovalsTooltip({ approver, author, count }: BaseApprovalsTooltipProps) {
  return (
    <BaseChartTooltip>
      <strong>{approver}</strong> approved <strong>{count}</strong> pull requests of <strong>{author}</strong>
    </BaseChartTooltip>
  );
}
