import { Comment, PullRequest, User } from '../services/types';
import { PieChartDatum } from './PieChartUtils';
import { PullRequestSizeTier, getPullRequestSizeTier } from './PullRequestMetrics';

export interface TeamReviewNode {
  id: string;
  user: User;
  isSelectedTeamMember: boolean;
  authoredPullRequestsCount: number;
  reviewedPullRequestsCount: number;
  incomingReviewedPullRequestsCount: number;
}

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

export interface TeamReviewModel {
  selectedTeamMembers: User[];
  authoredPullRequests: PullRequest[];
  nodes: TeamReviewNode[];
  relationships: TeamReviewRelationship[];
  summary: TeamReviewSummary;
  approvalShare: TeamReviewPieDatum[];
  discussionShare: TeamReviewPieDatum[];
}

export interface TeamReviewModelOptions {
  includeOutsideTeamMembers?: boolean;
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

interface MutableNodeStats {
  user: User;
  isSelectedTeamMember: boolean;
  authoredPullRequestIds: Set<string>;
  reviewedPullRequestIds: Set<string>;
  incomingReviewedPullRequestIds: Set<string>;
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
  const nodeStats = new Map<string, MutableNodeStats>();
  const relationships = new Map<string, MutableRelationship>();
  const authoredPullRequests = pullRequests
    .filter((pullRequest) => selectedTeamMemberIds.has(pullRequest.author.id))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  selectedTeamMembersById.forEach((user) => {
    nodeStats.set(user.id, createNodeStats(user, true));
  });

  authoredPullRequests.forEach((pullRequest) => {
    nodeStats.get(pullRequest.author.id)?.authoredPullRequestIds.add(pullRequest.id);
  });

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

      getOrCreateNodeStats(nodeStats, reviewer, true).reviewedPullRequestIds.add(pullRequest.id);
      getOrCreateNodeStats(nodeStats, pullRequest.author, isAuthorSelectedTeamMember).incomingReviewedPullRequestIds.add(pullRequest.id);
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
    nodes: [...nodeStats.values()].map(toTeamReviewNode).sort(sortNodes),
    relationships: relationshipRows,
    summary,
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

function createNodeStats(user: User, isSelectedTeamMember: boolean): MutableNodeStats {
  return {
    user,
    isSelectedTeamMember,
    authoredPullRequestIds: new Set(),
    reviewedPullRequestIds: new Set(),
    incomingReviewedPullRequestIds: new Set(),
  };
}

function getOrCreateNodeStats(nodeStats: Map<string, MutableNodeStats>, user: User, isSelectedTeamMember: boolean) {
  const existing = nodeStats.get(user.id);

  if (existing) {
    existing.isSelectedTeamMember = existing.isSelectedTeamMember || isSelectedTeamMember;
    return existing;
  }

  const created = createNodeStats(user, isSelectedTeamMember);
  nodeStats.set(user.id, created);
  return created;
}

function toTeamReviewNode(stats: MutableNodeStats): TeamReviewNode {
  return {
    id: stats.user.id,
    user: stats.user,
    isSelectedTeamMember: stats.isSelectedTeamMember,
    authoredPullRequestsCount: stats.authoredPullRequestIds.size,
    reviewedPullRequestsCount: stats.reviewedPullRequestIds.size,
    incomingReviewedPullRequestsCount: stats.incomingReviewedPullRequestIds.size,
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

function sortNodes(left: TeamReviewNode, right: TeamReviewNode) {
  if (left.isSelectedTeamMember !== right.isSelectedTeamMember) {
    return left.isSelectedTeamMember ? -1 : 1;
  }

  return left.user.displayName.localeCompare(right.user.displayName);
}

function uniqueUsersById(users: User[]) {
  const usersById = new Map<string, User>();

  users.forEach((user) => usersById.set(user.id, user));

  return [...usersById.values()];
}
