import { Stack } from '@mui/material';
import { BaseChartTooltip } from './BaseChartTooltip';
import { toPercentString } from '../../utils/PercentUtils';

export interface ReviewRequestTooltipProps {
  authorName: string;
  reviewerName: string;
  count: number;
  reviewed: number;
}

export function ReviewRequestTooltip({ count, reviewed, reviewerName, authorName }: ReviewRequestTooltipProps) {
  return (
    <BaseChartTooltip>
      <Stack spacing={1}>
        <div>
          <strong>{authorName}</strong> requested review from <strong>{reviewerName} </strong>
          <strong>{count}</strong> times.
        </div>
        <div>
          <strong>
            {reviewed}/{count} ({toPercentString(reviewed, count)})
          </strong>{' '}
          pull requests were reviewed.
        </div>
      </Stack>
    </BaseChartTooltip>
  );
}
