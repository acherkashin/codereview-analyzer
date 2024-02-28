import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { getWhomUserApproves } from './ApprovalDistributionUtils';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';

export interface ApprovalDistributionProps {
  user?: User | null;

  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who gives approvals
 */
export function ApprovalDistributionChart(props: ApprovalDistributionProps) {
  if (props.user) return <ApprovalDistributionForUser {...props} />;

  return <ApprovalDistributionForAll {...props} />;
}

function ApprovalDistributionForAll({ pullRequests, users }: ApprovalDistributionProps) {
  const { data, authors } = useMemo(() => {
    return getBarChartData(pullRequests, users, getWhomUserApproves);
  }, [users, pullRequests]);

  return (
    <ChartContainer title="Approvals Given By">
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

function ApprovalDistributionForUser({ pullRequests, user }: ApprovalDistributionProps) {
  const data = useMemo(() => {
    const obj = getWhomUserApproves(pullRequests, user!.id);
    const array = Object.entries(obj).map((item) => ({ id: item[0], label: item[0], value: item[1] }));
    return array;
  }, [pullRequests, user]);

  return (
    <ChartContainer title={`${user!.userName} gives approvals to`}>
      <BarChart data={data} />
    </ChartContainer>
  );
}
