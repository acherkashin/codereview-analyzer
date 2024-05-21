import { Stack } from '@mui/material';
import { BaseChartTooltip } from './BaseChartTooltip';
import { percentString } from '../../utils/StringUtils';

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
            {reviewed}/{count} ({percentString(reviewed, count)})
          </strong>{' '}
          pull requests were reviewed.
        </div>
      </Stack>
    </BaseChartTooltip>
  );
}
