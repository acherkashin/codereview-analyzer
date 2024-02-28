import { getAuthorReviewerFromMergeRequests } from './GitUtils';
import { arrange, asc, groupBy, summarize, tidy, n } from '@tidyjs/tidy';
import type { BarDatum } from '@nivo/bar';
import { PullRequest } from '../services/types';

export interface PieChartDatum extends BarDatum {
  id: string;
  label: string;
  value: number;
}

/**
 * Methods calculates whom author of merge requests assign merge requests to review
 */
export function getWhomAuthorAssignsToReview(mrs: PullRequest[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromMergeRequests(mrs);
  const data = tidy(rawData, groupBy('reviewer', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.reviewer,
      label: item.reviewer,
      value: item.total,
    })
  );

  return data;
}
