import { Stack } from '@mui/material';
import { BaseChartTooltip, BaseChartTooltipProps } from './BaseChartTooltip';

export interface BaseDiscussionsTooltipProps extends BaseChartTooltipProps {
  reviewer: string;
  author: string;
  count: number;
  total?: number;
}

export function BaseDiscussionsTooltip({ reviewer, author, count, total, ...props }: BaseDiscussionsTooltipProps) {
  return (
    <BaseChartTooltip {...props}>
      <Stack gap={1}>
        <div>
          <strong>{reviewer}</strong> started <strong>{count}</strong> discussions with <strong>{author}</strong>
        </div>
        {total != null && <div>Total discussions: {total}</div>}
      </Stack>
    </BaseChartTooltip>
  );
}
