import { useMemo } from 'react';
import { PullRequest, User } from '../../../services/types';
import { BarChart } from '../BarChart';
import { ChartContainer } from '../../ChartContainer';
import { getBarChartData } from '../../../utils/ChartUtils';
import { getWhomUserApproves } from './ApprovalRecipientsUtils';

export interface ApprovalRecipientsChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

/**
 * Represents who receive approvals
 */
export function ApprovalRecipientsChart({ users, pullRequests }: ApprovalRecipientsChartProps) {
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
