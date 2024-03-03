import { BaseChartTooltip, BaseChartTooltipProps } from './BaseChartTooltip';

export interface BaseDiscussionsTooltipProps extends BaseChartTooltipProps {
  reviewer: string;
  author: string;
  count: number;
}

export function BaseDiscussionsTooltip({ reviewer, author, count, ...props }: BaseDiscussionsTooltipProps) {
  return (
    <BaseChartTooltip {...props}>
      <strong>{reviewer}</strong> started <strong>{count}</strong> discussions with <strong>{author}</strong>
    </BaseChartTooltip>
  );
}
