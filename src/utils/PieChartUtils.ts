import { getAuthorReviewerFromComments, getAuthorReviewerFromMergeRequests } from './GitUtils';
import { arrange, asc, groupBy, summarize, tidy, n } from '@tidyjs/tidy';
import { BarDatum } from '@nivo/bar';
import { Comment, PullRequest } from '../services/types';

export interface PieChartDatum extends BarDatum {
  id: string;
  label: string;
  value: number;
}

export function convertToCommentsReceivedPieChart(comments: Comment[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.author,
      label: item.author,
      value: item.total,
    })
  );

  return data;
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

/**
 * Methods calculates who authors of merge requests assign their merge requests to review
 */
export function getWhoAssignsToAuthorToReview(mrs: PullRequest[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromMergeRequests(mrs);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.author,
      label: item.author,
      value: item.total,
    })
  );

  return data;
}
