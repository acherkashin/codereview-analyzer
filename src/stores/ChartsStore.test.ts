import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  getOneOnOneHighlights,
  getOneOnOneInsights,
  getOneOnOneReviewedBy,
  getOneOnOneReviewsFor,
  getTeamReviewAuthoredPullRequests,
  getTeamReviewModel,
} from './ChartsStore';
import { Comment, PullRequest, User, UserDiscussion } from '../services/types';

const alice: User = {
  id: 'alice',
  fullName: 'Alice Reviewer',
  userName: 'alice',
  displayName: 'Alice Reviewer',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const bob: User = {
  id: 'bob',
  fullName: 'Bob Builder',
  userName: 'bob',
  displayName: 'Bob Builder',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const carol: User = {
  id: 'carol',
  fullName: 'Carol Coder',
  userName: 'carol',
  displayName: 'Carol Coder',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const dave: User = {
  id: 'dave',
  fullName: 'Dave Dev',
  userName: 'dave',
  displayName: 'Dave Dev',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const erin: User = {
  id: 'erin',
  fullName: 'Erin Engineer',
  userName: 'erin',
  displayName: 'Erin Engineer',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

function createPullRequest(overrides: Partial<PullRequest>): PullRequest {
  return {
    id: overrides.id ?? 'pr',
    title: overrides.title ?? 'Pull request',
    repositoryName: overrides.repositoryName ?? 'repo',
    branchName: overrides.branchName ?? 'feature/test',
    url: overrides.url ?? 'https://example.com/pr',
    targetBranch: overrides.targetBranch ?? 'main',
    status: overrides.status ?? 'merged',
    author: overrides.author ?? alice,
    requestedReviewers: overrides.requestedReviewers ?? [],
    reviewedByUser: overrides.reviewedByUser ?? [],
    approvedByUser: overrides.approvedByUser ?? [],
    requestedChangesByUser: overrides.requestedChangesByUser ?? [],
    updatedAt: overrides.updatedAt ?? '2026-04-10T00:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-04-01T00:00:00.000Z',
    mergedAt: overrides.mergedAt,
    comments: overrides.comments ?? [],
    discussions: overrides.discussions ?? [],
    readyAt: overrides.readyAt,
    changedFilesCount: overrides.changedFilesCount ?? 3,
    linesAdded: overrides.linesAdded ?? 0,
    linesRemoved: overrides.linesRemoved ?? 0,
    discussionCount: overrides.discussionCount ?? 0,
    reviewCommentCount: overrides.reviewCommentCount ?? 0,
    unresolvedDiscussionCount: overrides.unresolvedDiscussionCount,
  };
}

function createState(pullRequests: PullRequest[]) {
  return {
    isAnalyzing: false,
    pullRequests,
    users: [alice, bob, carol, dave, erin],
    exportData: { hostType: 'Gitlab' },
    user: alice,
    teamUsers: [],
    showOutsideTeamMembers: true,
    startDate: dayjs('2026-04-01'),
    endDate: dayjs('2026-04-30'),
    dialogTitle: '',
    filteredDiscussions: null,
    filteredComments: null,
  } as any;
}

describe('1:1 selectors', () => {
  it('aggregates review relationships and manager-facing metrics', () => {
    const authoredOne = createPullRequest({
      id: 'authored-1',
      author: alice,
      createdAt: '2026-04-01T00:00:00.000Z',
      mergedAt: '2026-04-07T00:00:00.000Z',
      updatedAt: '2026-04-07T00:00:00.000Z',
      linesAdded: 300,
      linesRemoved: 150,
      discussionCount: 2,
      reviewCommentCount: 4,
      reviewedByUser: [{ user: bob, at: '2026-04-02T00:00:00.000Z', activityType: 'approved' }],
      comments: [
        {
          id: 'comment-1',
          reviewerId: bob.id,
          reviewerName: bob.displayName,
          reviewerAvatarUrl: bob.avatarUrl,
          prAuthorId: alice.id,
          prAuthorName: alice.displayName,
          prAuthorAvatarUrl: alice.avatarUrl,
          body: 'Looks good',
          pullRequestId: 'authored-1',
          pullRequestName: 'Authored 1',
          url: 'https://example.com/comment-1',
          filePath: 'src/a.ts',
          createdAt: '2026-04-02T00:00:00.000Z',
        },
        {
          id: 'comment-2',
          reviewerId: carol.id,
          reviewerName: carol.displayName,
          reviewerAvatarUrl: carol.avatarUrl,
          prAuthorId: alice.id,
          prAuthorName: alice.displayName,
          prAuthorAvatarUrl: alice.avatarUrl,
          body: 'Please rename this',
          pullRequestId: 'authored-1',
          pullRequestName: 'Authored 1',
          url: 'https://example.com/comment-2',
          filePath: 'src/b.ts',
          createdAt: '2026-04-03T00:00:00.000Z',
        },
      ],
      discussions: [
        {
          id: 'discussion-1',
          reviewerId: bob.id,
          reviewerName: bob.displayName,
          reviewerAvatarUrl: bob.avatarUrl,
          prAuthorId: alice.id,
          prAuthorName: alice.displayName,
          pullRequestId: 'authored-1',
          pullRequestName: 'Authored 1',
          pullRequestUrl: 'https://example.com/authored-1',
          url: 'https://example.com/discussion-1',
          comments: [],
          isResolved: true,
        },
      ],
    });

    const authoredTwo = createPullRequest({
      id: 'authored-2',
      author: alice,
      createdAt: '2026-04-11T00:00:00.000Z',
      mergedAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:00:00.000Z',
      linesAdded: 600,
      linesRemoved: 300,
      discussionCount: 1,
      reviewCommentCount: 8,
      reviewedByUser: [{ user: bob, at: '2026-04-12T00:00:00.000Z', activityType: 'comment' }],
      comments: [
        {
          id: 'comment-3',
          reviewerId: bob.id,
          reviewerName: bob.displayName,
          reviewerAvatarUrl: bob.avatarUrl,
          prAuthorId: alice.id,
          prAuthorName: alice.displayName,
          prAuthorAvatarUrl: alice.avatarUrl,
          body: 'Needs another pass',
          pullRequestId: 'authored-2',
          pullRequestName: 'Authored 2',
          url: 'https://example.com/comment-3',
          filePath: 'src/c.ts',
          createdAt: '2026-04-12T00:00:00.000Z',
        },
      ],
    });

    const reviewedForDave = createPullRequest({
      id: 'reviewed-1',
      author: dave,
      createdAt: '2026-04-05T00:00:00.000Z',
      updatedAt: '2026-04-06T00:00:00.000Z',
      linesAdded: 80,
      linesRemoved: 20,
      comments: [
        {
          id: 'comment-4',
          reviewerId: alice.id,
          reviewerName: alice.displayName,
          reviewerAvatarUrl: alice.avatarUrl,
          prAuthorId: dave.id,
          prAuthorName: dave.displayName,
          prAuthorAvatarUrl: dave.avatarUrl,
          body: 'Nice extraction',
          pullRequestId: 'reviewed-1',
          pullRequestName: 'Reviewed 1',
          url: 'https://example.com/comment-4',
          filePath: 'src/d.ts',
          createdAt: '2026-04-06T00:00:00.000Z',
        },
      ],
      reviewCommentCount: 1,
      reviewedByUser: [{ user: alice, at: '2026-04-06T00:00:00.000Z', activityType: 'comment' }],
    });

    const reviewedForErin = createPullRequest({
      id: 'reviewed-2',
      author: erin,
      createdAt: '2026-04-08T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
      linesAdded: 40,
      linesRemoved: 10,
      discussions: [
        {
          id: 'discussion-2',
          reviewerId: alice.id,
          reviewerName: alice.displayName,
          reviewerAvatarUrl: alice.avatarUrl,
          prAuthorId: erin.id,
          prAuthorName: erin.displayName,
          pullRequestId: 'reviewed-2',
          pullRequestName: 'Reviewed 2',
          pullRequestUrl: 'https://example.com/reviewed-2',
          url: 'https://example.com/discussion-2',
          comments: [],
          isResolved: false,
        },
      ],
      discussionCount: 1,
    });

    const state = createState([authoredOne, authoredTwo, reviewedForDave, reviewedForErin]);

    expect(getOneOnOneReviewedBy(state)).toEqual([
      { user: bob, pullRequestCount: 2 },
      { user: carol, pullRequestCount: 1 },
    ]);

    expect(getOneOnOneReviewsFor(state)).toEqual([
      { user: dave, pullRequestCount: 1 },
      { user: erin, pullRequestCount: 1 },
    ]);

    expect(getOneOnOneInsights(state)).toMatchObject({
      authoredPullRequestsCount: 2,
      reviewedPullRequestsCount: 2,
      uniqueReviewersCount: 2,
      uniqueReviewedAuthorsCount: 2,
      medianPrSize: 675,
      averagePrSize: 675,
      largePullRequestsCount: 2,
      medianOpenDays: 8,
      averageOpenDays: 7.5,
      discussionsStartedCount: 1,
    });

    expect(getOneOnOneHighlights(state)).toEqual([
      '2 authored PRs were large or very large',
      'PRs are staying open longer than expected (7.5d average open time)',
      'Work was reviewed by 2 teammates',
      'Changes are attracting a lot of review discussion (7.5 conversations per PR on average)',
    ]);
  });
});

describe('team review selectors', () => {
  it('builds selected-reviewer relationships and hides outsider-to-team edges', () => {
    const duplicateComment = createComment({
      id: 'alice-comment-1',
      reviewer: alice,
      author: carol,
      pullRequestId: 'outsider-pr',
    });
    const secondDiscussionComment = createComment({
      id: 'alice-comment-2',
      reviewer: alice,
      author: carol,
      pullRequestId: 'outsider-pr',
    });
    const outsiderPullRequest = createPullRequest({
      id: 'outsider-pr',
      author: carol,
      createdAt: '2026-04-02T00:00:00.000Z',
      comments: [duplicateComment],
      discussions: [
        createDiscussion({
          id: 'discussion-1',
          reviewer: alice,
          author: carol,
          pullRequestId: 'outsider-pr',
          comments: [duplicateComment, secondDiscussionComment],
        }),
      ],
      reviewedByUser: [{ user: alice, at: '2026-04-03T00:00:00.000Z', activityType: 'comment' }],
      approvedByUser: [{ user: alice, at: '2026-04-03T00:00:00.000Z', activityType: 'approved' }],
      discussionCount: 1,
      reviewCommentCount: 2,
      linesAdded: 30,
      linesRemoved: 10,
    });

    const bobPullRequest = createPullRequest({
      id: 'bob-pr',
      author: bob,
      createdAt: '2026-04-04T00:00:00.000Z',
      comments: [
        createComment({
          id: 'alice-comment-3',
          reviewer: alice,
          author: bob,
          pullRequestId: 'bob-pr',
        }),
      ],
      reviewedByUser: [{ user: alice, at: '2026-04-05T00:00:00.000Z', activityType: 'comment' }],
      linesAdded: 430,
      linesRemoved: 20,
    });

    const alicePullRequest = createPullRequest({
      id: 'alice-pr',
      author: alice,
      createdAt: '2026-04-06T00:00:00.000Z',
      reviewedByUser: [
        { user: bob, at: '2026-04-07T00:00:00.000Z', activityType: 'approved' },
        { user: carol, at: '2026-04-07T00:00:00.000Z', activityType: 'approved' },
      ],
      approvedByUser: [
        { user: bob, at: '2026-04-07T00:00:00.000Z', activityType: 'approved' },
        { user: carol, at: '2026-04-07T00:00:00.000Z', activityType: 'approved' },
      ],
      linesAdded: 80,
      linesRemoved: 20,
    });

    const state = {
      ...createState([outsiderPullRequest, bobPullRequest, alicePullRequest]),
      teamUsers: [alice, bob],
    };

    const model = getTeamReviewModel(state);

    expect(model.nodes.map((node) => ({ id: node.id, selected: node.isSelectedTeamMember }))).toEqual([
      { id: alice.id, selected: true },
      { id: bob.id, selected: true },
      { id: carol.id, selected: false },
    ]);

    expect(model.relationships.map((relationship) => relationship.id)).toEqual([
      `${alice.id}->${carol.id}`,
      `${alice.id}->${bob.id}`,
      `${bob.id}->${alice.id}`,
    ]);
    expect(model.relationships.some((relationship) => relationship.id === `${carol.id}->${alice.id}`)).toBe(false);

    const aliceToCarol = model.relationships.find((relationship) => relationship.id === `${alice.id}->${carol.id}`)!;
    expect(aliceToCarol).toMatchObject({
      reviewedPullRequestsCount: 1,
      approvalsCount: 1,
      discussionsStartedCount: 1,
      commentsCount: 2,
      isAuthorSelectedTeamMember: false,
    });

    expect(getTeamReviewAuthoredPullRequests(state).map((pullRequest) => pullRequest.id)).toEqual(['alice-pr', 'bob-pr']);
    expect(model.summary).toMatchObject({
      teamMembersCount: 2,
      authoredPullRequestsCount: 2,
      reviewedPullRequestsCount: 3,
      approvalsCount: 2,
      discussionsStartedCount: 1,
      commentsCount: 3,
      sizeTierCounts: {
        compact: 1,
        medium: 0,
        large: 1,
        veryLarge: 0,
      },
    });
    expect(model.approvalShare).toEqual([
      expect.objectContaining({ userId: alice.id, value: 1 }),
      expect.objectContaining({ userId: bob.id, value: 1 }),
    ]);
    expect(model.discussionShare).toEqual([
      expect.objectContaining({ userId: alice.id, value: 1 }),
      expect.objectContaining({ userId: bob.id, value: 0 }),
    ]);

    const internalOnlyModel = getTeamReviewModel({
      ...state,
      showOutsideTeamMembers: false,
    });

    expect(internalOnlyModel.nodes.map((node) => ({ id: node.id, selected: node.isSelectedTeamMember }))).toEqual([
      { id: alice.id, selected: true },
      { id: bob.id, selected: true },
    ]);
    expect(internalOnlyModel.relationships.map((relationship) => relationship.id)).toEqual([
      `${alice.id}->${bob.id}`,
      `${bob.id}->${alice.id}`,
    ]);
    expect(getTeamReviewAuthoredPullRequests({ ...state, showOutsideTeamMembers: false }).map((pullRequest) => pullRequest.id)).toEqual([
      'alice-pr',
      'bob-pr',
    ]);
    expect(internalOnlyModel.summary).toMatchObject({
      teamMembersCount: 2,
      authoredPullRequestsCount: 2,
      reviewedPullRequestsCount: 2,
      approvalsCount: 1,
      discussionsStartedCount: 0,
      commentsCount: 1,
      sizeTierCounts: {
        compact: 1,
        medium: 0,
        large: 1,
        veryLarge: 0,
      },
    });
    expect(internalOnlyModel.approvalShare).toEqual([
      expect.objectContaining({ userId: bob.id, value: 1 }),
      expect.objectContaining({ userId: alice.id, value: 0 }),
    ]);
    expect(internalOnlyModel.discussionShare).toEqual([
      expect.objectContaining({ userId: alice.id, value: 0 }),
      expect.objectContaining({ userId: bob.id, value: 0 }),
    ]);
  });
});

function createComment({
  id,
  reviewer,
  author,
  pullRequestId,
}: {
  id: string;
  reviewer: User;
  author: User;
  pullRequestId: string;
}): Comment {
  return {
    id,
    reviewerId: reviewer.id,
    reviewerName: reviewer.displayName,
    reviewerAvatarUrl: reviewer.avatarUrl,
    prAuthorId: author.id,
    prAuthorName: author.displayName,
    prAuthorAvatarUrl: author.avatarUrl,
    body: 'Review note',
    pullRequestId,
    pullRequestName: pullRequestId,
    url: `https://example.com/${id}`,
    filePath: 'src/example.ts',
    createdAt: '2026-04-03T00:00:00.000Z',
  };
}

function createDiscussion({
  id,
  reviewer,
  author,
  pullRequestId,
  comments,
}: {
  id: string;
  reviewer: User;
  author: User;
  pullRequestId: string;
  comments: Comment[];
}): UserDiscussion {
  return {
    id,
    reviewerId: reviewer.id,
    reviewerName: reviewer.displayName,
    reviewerAvatarUrl: reviewer.avatarUrl,
    prAuthorId: author.id,
    prAuthorName: author.displayName,
    pullRequestId,
    pullRequestName: pullRequestId,
    pullRequestUrl: `https://example.com/${pullRequestId}`,
    url: `https://example.com/${id}`,
    comments,
    isResolved: true,
  };
}
