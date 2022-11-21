import {
  getAuthorReviewerFromComments,
  getAuthorReviewerFromDiscussions,
  getAuthorReviewerFromMergeRequests,
  UserComment,
  UserDiscussion,
} from './GitLabUtils';
import { arrange, asc, groupBy, summarize, tidy, n } from '@tidyjs/tidy';
import { MergeRequestSchema, MergeRequestLevelMergeRequestApprovalSchema } from '@gitbeaker/core/dist/types/types';
import { BarDatum } from '@nivo/bar';
import { Resources } from '@gitbeaker/core';

export interface PieChartDatum extends BarDatum {
  id: string;
  label: string;
  value: number;
}

export function convertToCommentsReceivedPieChart(comments: UserComment[]): PieChartDatum[] {
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

export function convertToCommentsLeftPieChart(comments: UserComment[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('reviewer', summarize({ total: n() })), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.reviewer,
      label: item.reviewer,
      value: item.total,
    })
  );

  return data;
}

export function convertToDiscussionsReceivedPieChart(discussions: UserDiscussion[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromDiscussions(discussions);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.author,
      label: item.author,
      value: item.total,
    })
  );

  return data;
}

export function convertToDiscussionsStartedPieChart(discussions: UserDiscussion[]): PieChartDatum[] {
  const rawData = getAuthorReviewerFromDiscussions(discussions);
  const data = tidy(rawData, groupBy('reviewer', summarize({ total: n() })), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.reviewer,
      label: item.reviewer,
      value: item.total,
    })
  );

  return data;
}

/**
 * Methods calculates whom author of merge requests assign merge requests to review
 */
export function getWhomAuthorAssignsToReview(mrs: MergeRequestSchema[]): PieChartDatum[] {
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
export function getWhoAssignsToAuthorToReview(mrs: MergeRequestSchema[]): PieChartDatum[] {
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

export interface MergeRequestWithApprovals {
  mergeRequest: MergeRequestSchema;
  approvals: MergeRequestLevelMergeRequestApprovalSchema;
}

export function getMergeRequestsWithApprovals(
  client: Resources.Gitlab,
  projectId: number,
  mrs: MergeRequestSchema[]
): Promise<MergeRequestWithApprovals[]> {
  return Promise.all(
    mrs.map((mr) =>
      client.MergeRequestApprovals.configuration(projectId, {
        mergerequestIid: mr.iid,
      }).then((approvals) => ({
        mergeRequest: mr,
        approvals,
      }))
    )
  );
}

export function getWhoApprovesUser(mergeRequests: MergeRequestWithApprovals[], userId: number): PieChartDatum[] {
  const authorMrs = mergeRequests.filter((item) => item.mergeRequest.author.id === userId);
  const approvers = authorMrs.flatMap((mr) => (mr.approvals.approved_by ?? []).map((item) => item.user));

  return tidy(approvers, groupBy('username', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>(
    (item) => ({
      id: item.username,
      label: item.username,
      value: item.total,
    })
  );
}

export function getWhomUserApproves(mergeRequests: MergeRequestWithApprovals[], userId: number): PieChartDatum[] {
  const approvedByUser = mergeRequests.filter((item) =>
    (item.approvals.approved_by ?? []).some(({ user }) => user.id === userId)
  );
  const authors = approvedByUser.filter((item) => item.mergeRequest.author).map((item) => item.mergeRequest.author);

  return tidy(authors, groupBy('username', [summarize({ total: n() })]), arrange([asc('total')])).map<PieChartDatum>((item) => ({
    id: item.username as string,
    label: item.username as string,
    value: item.total,
  }));
}
