import { BaseChartTooltip, BaseChartTooltipProps } from './BaseChartTooltip';

export interface BaseCommentsTooltipProps extends BaseChartTooltipProps {
  reviewer: string;
  author: string;
  count: number;
}

export function BaseCommentsTooltip({ reviewer, author, count, ...otherProps }: BaseCommentsTooltipProps) {
  return (
    <BaseChartTooltip {...otherProps}>
      <strong>{reviewer}</strong> left <strong>{count}</strong> comments to <strong>{author}</strong>
    </BaseChartTooltip>
  );
}
