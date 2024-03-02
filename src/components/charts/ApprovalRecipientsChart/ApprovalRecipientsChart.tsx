import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhomUserApproves, getWhomUserApprovesArray } from './ApprovalRecipientsUtils';
import { BaseApprovalsTooltip } from '../ApprovalDistributionChart/ApprovalDistributionChart';

export interface ApprovalRecipientsChartProps {
  user?: User | null;

  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who receive approvals
 */
export function ApprovalRecipientsChart(props: ApprovalRecipientsChartProps) {
  if (props.user) return <ApprovalRecipientsForUser {...props} />;

  return <ApprovalRecipientsForAll {...props} />;
}

function ApprovalRecipientsForAll({ users, pullRequests }: ApprovalRecipientsChartProps) {
  const { data, authors } = useMemo(() => {
    return getBarChartData(pullRequests, users, (prs, userId) => getWhomUserApproves(prs, users, userId));
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Approvals Received By">
      <BarChart
        margin={{ left: 100, bottom: 50, right: 30 }}
        indexBy="approverName"
        keys={authors}
        data={data}
        tooltip={(props) => {
          const { indexValue: author, id: approver, value: approvesCount } = props;

          return <BaseApprovalsTooltip approver={approver as string} author={author as string} count={approvesCount} />;
        }}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}

function ApprovalRecipientsForUser({ user, users, pullRequests }: ApprovalRecipientsChartProps) {
  const data = useMemo(
    () =>
      getWhomUserApprovesArray(pullRequests, users, user!.id).map(({ displayName, total }) => ({
        id: displayName,
        value: total,
      })),
    [pullRequests, user, users]
  );

  return (
    <ChartContainer title={`${user!.userName} receives approvals from`}>
      <BarChart data={data} />
    </ChartContainer>
  );
}
