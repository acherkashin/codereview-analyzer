import { BaseChartTooltip } from './BaseChartTooltip';

export interface BaseReviewTooltipProps {
  reviewer: string;
  author: string;
  count: number;
}

export function BaseReviewTooltip({ reviewer, author, count }: BaseReviewTooltipProps) {
  return (
    <BaseChartTooltip>
      <strong>{author}</strong> requested review from <strong>{reviewer} </strong>
      <strong>{count}</strong> times
    </BaseChartTooltip>
  );
}
