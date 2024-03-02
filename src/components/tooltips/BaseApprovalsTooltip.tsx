import { BaseChartTooltip } from './BaseChartTooltip';

export interface BaseApprovalsTooltipProps {
  approver: string;
  author: string;
  count: number;
}

export function BaseApprovalsTooltip({ approver, author, count }: BaseApprovalsTooltipProps) {
  return (
    <BaseChartTooltip>
      <strong>{approver}</strong> approved <strong>{count}</strong> pull requests of <strong>{author}</strong>
    </BaseChartTooltip>
  );
}
