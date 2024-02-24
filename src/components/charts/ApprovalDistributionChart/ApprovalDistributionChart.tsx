import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { getWhomUserApproves } from './ApprovalDistributionUtils';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';

export interface ApprovalDistributionProps {
  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who gives approvals
 */
export function ApprovalDistributionChart({ users, pullRequests }: ApprovalDistributionProps) {
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
