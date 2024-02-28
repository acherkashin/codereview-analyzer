import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhomUserApproves } from './ApprovalRecipientsUtils';

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
        // axisBottom={{}}
        indexBy="approverName"
        keys={authors}
        data={data}
        onClick={() => {}}
      />
    </ChartContainer>
  );
}

function ApprovalRecipientsForUser({ user, users, pullRequests }: ApprovalRecipientsChartProps) {
  const data = useMemo(() => {
    const obj = getWhomUserApproves(pullRequests, users, user!.id);
    const array = Object.entries(obj).map((item) => ({ id: item[0], label: item[0], value: item[1] }));
    return array;
  }, [pullRequests, user, users]);

  return (
    <ChartContainer title={`${user!.userName} receives approvals from`}>
      <BarChart data={data} />
    </ChartContainer>
  );
}
