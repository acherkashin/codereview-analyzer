import { Comment, PullRequest, User } from '../services/types';
import { PieChartDatum } from './PieChartUtils';
import { PullRequestSizeTier, getPullRequestSizeTier } from './PullRequestMetrics';
import dayjs from 'dayjs';

export interface TeamReviewRelationship {
  id: string;
  reviewer: User;
  author: User;
  isAuthorSelectedTeamMember: boolean;
  reviewedPullRequestsCount: number;
  approvalsCount: number;
  discussionsStartedCount: number;
  commentsCount: number;
  pullRequests: PullRequest[];
}

export interface TeamReviewSummary {
  teamMembersCount: number;
  authoredPullRequestsCount: number;
  reviewedPullRequestsCount: number;
  approvalsCount: number;
  discussionsStartedCount: number;
  commentsCount: number;
  sizeTierCounts: Record<PullRequestSizeTier, number>;
}

export interface TeamReviewPieDatum extends PieChartDatum {
  userId: string;
}

export interface TeamReviewMonthlySizeBucket {
  month: string;
  isPartial: boolean;
  counts: Record<PullRequestSizeTier, number>;
  pullRequestIdsByTier: Record<PullRequestSizeTier, string[]>;
}

export interface TeamReviewModel {
  selectedTeamMembers: User[];
  authoredPullRequests: PullRequest[];
  relationships: TeamReviewRelationship[];
  summary: TeamReviewSummary;
  monthlySizeBuckets: TeamReviewMonthlySizeBucket[];
  approvalShare: TeamReviewPieDatum[];
  discussionShare: TeamReviewPieDatum[];
}

export interface TeamReviewModelOptions {
  includeOutsideTeamMembers?: boolean;
  periodStart?: string;
  periodEnd?: string;
}

interface MutableRelationship {
  reviewer: User;
  author: User;
  isAuthorSelectedTeamMember: boolean;
  pullRequestsById: Map<string, PullRequest>;
  approvalPullRequestIds: Set<string>;
  discussionIds: Set<string>;
  commentIds: Set<string>;
}

const emptySizeTierCounts: Record<PullRequestSizeTier, number> = {
  compact: 0,
  medium: 0,
  large: 0,
  veryLarge: 0,
};

export function buildTeamReviewModel(
  pullRequests: PullRequest[],
  selectedTeamMembers: User[],
  options: TeamReviewModelOptions = {}
): TeamReviewModel {
  const includeOutsideTeamMembers = options.includeOutsideTeamMembers ?? true;
  const selectedTeamMembersById = new Map(uniqueUsersById(selectedTeamMembers).map((user) => [user.id, user]));
  const selectedTeamMemberIds = new Set(selectedTeamMembersById.keys());
  const relationships = new Map<string, MutableRelationship>();
  const authoredPullRequests = pullRequests
    .filter((pullRequest) => selectedTeamMemberIds.has(pullRequest.author.id))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  pullRequests.forEach((pullRequest) => {
    const isAuthorSelectedTeamMember = selectedTeamMemberIds.has(pullRequest.author.id);

    if (!includeOutsideTeamMembers && !isAuthorSelectedTeamMember) {
      return;
    }

    selectedTeamMembersById.forEach((reviewer) => {
      if (pullRequest.author.id === reviewer.id) {
        return;
      }

      const activity = getReviewerActivityForPullRequest(pullRequest, reviewer.id);

      if (!activity.hasCapturedActivity) {
        return;
      }

      const key = getRelationshipId(reviewer.id, pullRequest.author.id);
      const relationship =
        relationships.get(key) ?? createRelationship(reviewer, pullRequest.author, isAuthorSelectedTeamMember);

      relationship.pullRequestsById.set(pullRequest.id, pullRequest);

      if (activity.approvedPullRequest) {
        relationship.approvalPullRequestIds.add(pullRequest.id);
      }

      activity.discussionIds.forEach((discussionId) => relationship.discussionIds.add(discussionId));
      activity.commentIds.forEach((commentId) => relationship.commentIds.add(commentId));
      relationships.set(key, relationship);
    });
  });

  const relationshipRows = [...relationships.entries()]
    .map(([id, relationship]): TeamReviewRelationship => ({
      id,
      reviewer: relationship.reviewer,
      author: relationship.author,
      isAuthorSelectedTeamMember: relationship.isAuthorSelectedTeamMember,
      reviewedPullRequestsCount: relationship.pullRequestsById.size,
      approvalsCount: relationship.approvalPullRequestIds.size,
      discussionsStartedCount: relationship.discussionIds.size,
      commentsCount: relationship.commentIds.size,
      pullRequests: [...relationship.pullRequestsById.values()].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    }))
    .sort(sortRelationships);

  const summary = buildTeamReviewSummary(authoredPullRequests, relationshipRows, selectedTeamMembersById.size);
  const selectedTeamMembersList = [...selectedTeamMembersById.values()];

  return {
    selectedTeamMembers: selectedTeamMembersList,
    authoredPullRequests,
    relationships: relationshipRows,
    summary,
    monthlySizeBuckets: buildMonthlySizeBuckets(authoredPullRequests, options.periodStart, options.periodEnd),
    approvalShare: buildShareData(selectedTeamMembersList, relationshipRows, 'approvalsCount'),
    discussionShare: buildShareData(selectedTeamMembersList, relationshipRows, 'discussionsStartedCount'),
  };
}

export function getRelationshipId(reviewerId: string, authorId: string) {
  return `${reviewerId}->${authorId}`;
}

function getReviewerActivityForPullRequest(pullRequest: PullRequest, reviewerId: string) {
  const reviewActivities = pullRequest.reviewedByUser.filter((activity) => activity.user.id === reviewerId);
  const requestedChanges = pullRequest.requestedChangesByUser.filter((activity) => activity.user.id === reviewerId);
  const approvedPullRequest = pullRequest.approvedByUser.some((activity) => activity.user.id === reviewerId);
  const discussionsStarted = pullRequest.discussions.filter((discussion) => discussion.reviewerId === reviewerId);
  const comments = getUniqueReviewerComments(pullRequest, reviewerId);

  return {
    hasCapturedActivity:
      reviewActivities.length > 0 ||
      requestedChanges.length > 0 ||
      approvedPullRequest ||
      discussionsStarted.length > 0 ||
      comments.length > 0,
    approvedPullRequest,
    discussionIds: discussionsStarted.map((discussion) => discussion.id),
    commentIds: comments.map(getCommentKey),
  };
}

function getUniqueReviewerComments(pullRequest: PullRequest, reviewerId: string): Comment[] {
  const commentsById = new Map<string, Comment>();
  const allComments = [...pullRequest.comments, ...pullRequest.discussions.flatMap((discussion) => discussion.comments)];

  allComments.forEach((comment) => {
    if (comment.reviewerId === reviewerId) {
      commentsById.set(getCommentKey(comment), comment);
    }
  });

  return [...commentsById.values()];
}

function getCommentKey(comment: Comment) {
  return comment.id || `${comment.pullRequestId}:${comment.url}:${comment.createdAt}:${comment.body}`;
}

function createRelationship(reviewer: User, author: User, isAuthorSelectedTeamMember: boolean): MutableRelationship {
  return {
    reviewer,
    author,
    isAuthorSelectedTeamMember,
    pullRequestsById: new Map(),
    approvalPullRequestIds: new Set(),
    discussionIds: new Set(),
    commentIds: new Set(),
  };
}

function buildTeamReviewSummary(
  authoredPullRequests: PullRequest[],
  relationships: TeamReviewRelationship[],
  teamMembersCount: number
): TeamReviewSummary {
  const sizeTierCounts = authoredPullRequests.reduce(
    (counts, pullRequest) => {
      counts[getPullRequestSizeTier(pullRequest)] += 1;
      return counts;
    },
    { ...emptySizeTierCounts }
  );

  const reviewedPullRequestIds = new Set<string>();
  relationships.forEach((relationship) => {
    relationship.pullRequests.forEach((pullRequest) => reviewedPullRequestIds.add(pullRequest.id));
  });

  return {
    teamMembersCount,
    authoredPullRequestsCount: authoredPullRequests.length,
    reviewedPullRequestsCount: reviewedPullRequestIds.size,
    approvalsCount: relationships.reduce((total, relationship) => total + relationship.approvalsCount, 0),
    discussionsStartedCount: relationships.reduce((total, relationship) => total + relationship.discussionsStartedCount, 0),
    commentsCount: relationships.reduce((total, relationship) => total + relationship.commentsCount, 0),
    sizeTierCounts,
  };
}

function buildMonthlySizeBuckets(
  authoredPullRequests: PullRequest[],
  requestedPeriodStart?: string,
  requestedPeriodEnd?: string
): TeamReviewMonthlySizeBucket[] {
  const authoredDates = authoredPullRequests.map((pullRequest) => pullRequest.createdAt);
  const periodStart = dayjs(requestedPeriodStart ?? authoredDates.at(-1));
  const periodEnd = dayjs(requestedPeriodEnd ?? authoredDates.at(0));

  if (!periodStart.isValid() || !periodEnd.isValid() || periodEnd.isBefore(periodStart, 'day')) {
    return [];
  }

  const firstMonth = periodStart.startOf('month');
  const lastMonth = periodEnd.startOf('month');
  const buckets: TeamReviewMonthlySizeBucket[] = [];

  for (let month = firstMonth; !month.isAfter(lastMonth, 'month'); month = month.add(1, 'month')) {
    buckets.push({
      month: month.format('YYYY-MM'),
      isPartial:
        (month.isSame(firstMonth, 'month') && !periodStart.isSame(periodStart.startOf('month'), 'day')) ||
        (month.isSame(lastMonth, 'month') && !periodEnd.isSame(periodEnd.endOf('month'), 'day')),
      counts: { ...emptySizeTierCounts },
      pullRequestIdsByTier: createEmptyPullRequestIdsByTier(),
    });
  }

  const bucketsByMonth = new Map(buckets.map((bucket) => [bucket.month, bucket]));

  authoredPullRequests.forEach((pullRequest) => {
    const bucket = bucketsByMonth.get(dayjs(pullRequest.createdAt).format('YYYY-MM'));

    if (!bucket) {
      return;
    }

    const sizeTier = getPullRequestSizeTier(pullRequest);
    bucket.counts[sizeTier] += 1;
    bucket.pullRequestIdsByTier[sizeTier].push(pullRequest.id);
  });

  return buckets;
}

function createEmptyPullRequestIdsByTier(): Record<PullRequestSizeTier, string[]> {
  return {
    compact: [],
    medium: [],
    large: [],
    veryLarge: [],
  };
}

function buildShareData(
  selectedTeamMembers: User[],
  relationships: TeamReviewRelationship[],
  metric: 'approvalsCount' | 'discussionsStartedCount'
): TeamReviewPieDatum[] {
  return selectedTeamMembers
    .map((user) => ({
      id: user.displayName,
      label: user.displayName,
      value: relationships
        .filter((relationship) => relationship.reviewer.id === user.id)
        .reduce((total, relationship) => total + relationship[metric], 0),
      userId: user.id,
    }))
    .sort((left, right) => {
      if (right.value !== left.value) {
        return right.value - left.value;
      }

      return left.label.localeCompare(right.label);
    });
}

function sortRelationships(left: TeamReviewRelationship, right: TeamReviewRelationship) {
  if (right.reviewedPullRequestsCount !== left.reviewedPullRequestsCount) {
    return right.reviewedPullRequestsCount - left.reviewedPullRequestsCount;
  }

  if (right.commentsCount !== left.commentsCount) {
    return right.commentsCount - left.commentsCount;
  }

  return `${left.reviewer.displayName}-${left.author.displayName}`.localeCompare(`${right.reviewer.displayName}-${right.author.displayName}`);
}

function uniqueUsersById(users: User[]) {
  const usersById = new Map<string, User>();

  users.forEach((user) => usersById.set(user.id, user));

  return [...usersById.values()];
}
