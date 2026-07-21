import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Comment, PullRequest, User, UserDiscussion } from '../../services/types';
import { TeamReviewRelationship, getRelationshipId } from '../../utils/TeamReviewUtils';
import { RelationshipDetails } from './RelationshipDetails';

const reviewer: User = {
  id: 'reviewer-1',
  fullName: 'Rita Reviewer',
  userName: 'rita',
  displayName: 'Rita Reviewer',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const otherReviewer: User = {
  id: 'reviewer-2',
  fullName: 'Oscar Reviewer',
  userName: 'oscar',
  displayName: 'Oscar Reviewer',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

const author: User = {
  id: 'author-1',
  fullName: 'Alice Author',
  userName: 'alice',
  displayName: 'Alice Author',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

describe('RelationshipDetails', () => {
  it('opens reviewer-started discussions for a pull request and includes every reply in those threads', async () => {
    const pullRequest = createPullRequest({
      id: 'pr-with-discussions',
      title: 'Add dashboard filters',
      discussions: [
        createDiscussion({
          id: 'selected-reviewer-thread',
          starter: reviewer,
          comments: [
            createComment({ id: 'opening-comment', user: reviewer, body: 'Please cover the empty state.' }),
            createComment({ id: 'author-reply', user: author, body: 'Covered in the latest update.' }),
          ],
        }),
        createDiscussion({
          id: 'other-reviewer-thread',
          starter: otherReviewer,
          comments: [createComment({ id: 'excluded-comment', user: otherReviewer, body: 'This thread should not be shown.' })],
        }),
      ],
    });
    const relationship = createRelationship([pullRequest]);

    render(<RelationshipDetails relationship={relationship} metric="discussionsStartedCount" />);

    expect(screen.getByRole('link', { name: pullRequest.title })).toHaveAttribute('href', pullRequest.url);
    const showDiscussionsButton = screen.getByRole('button', {
      name: `View 1 discussion for ${pullRequest.title}`,
    });

    fireEvent.click(showDiscussionsButton);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(`${pullRequest.title} — discussions started by ${reviewer.displayName}`)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: pullRequest.title }));

    expect(await within(dialog).findByText('Please cover the empty state.')).toBeInTheDocument();
    expect(await within(dialog).findByText('Covered in the latest update.')).toBeInTheDocument();
    expect(within(dialog).queryByText('This thread should not be shown.')).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows reviewer-specific counts, marks PRs without matching discussions, and closes on relationship changes', async () => {
    const pullRequestWithDiscussions = createPullRequest({
      id: 'pr-with-two-discussions',
      title: 'Refine dashboard layout',
      discussions: [
        createDiscussion({ id: 'thread-1', starter: reviewer }),
        createDiscussion({ id: 'thread-2', starter: reviewer }),
        createDiscussion({ id: 'excluded-thread', starter: otherReviewer }),
      ],
    });
    const pullRequestWithoutDiscussions = createPullRequest({
      id: 'pr-without-discussions',
      title: 'Update documentation',
      discussions: [createDiscussion({ id: 'other-reviewer-only', starter: otherReviewer })],
    });
    const relationship = createRelationship([pullRequestWithDiscussions, pullRequestWithoutDiscussions]);
    const view = render(<RelationshipDetails relationship={relationship} metric="reviewedPullRequestsCount" />);

    expect(
      screen.getByRole('button', { name: `View 2 discussions for ${pullRequestWithDiscussions.title}` })
    ).toBeInTheDocument();
    expect(screen.getByText('No discussions')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(pullRequestWithoutDiscussions.title) })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `View 2 discussions for ${pullRequestWithDiscussions.title}` }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    view.rerender(
      <RelationshipDetails relationship={createRelationship([], otherReviewer)} metric="reviewedPullRequestsCount" />
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    view.rerender(<RelationshipDetails relationship={relationship} metric="reviewedPullRequestsCount" />);
    fireEvent.click(screen.getByRole('button', { name: `View 2 discussions for ${pullRequestWithDiscussions.title}` }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    view.rerender(<RelationshipDetails relationship={null} metric="reviewedPullRequestsCount" />);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('filters supporting pull requests to the active matrix metric', async () => {
    const discussionPullRequest = createPullRequest({
      id: 'discussion-pr',
      title: 'Discussed pull request',
      discussions: [createDiscussion({ id: 'discussion-thread', starter: reviewer })],
    });
    const approvedPullRequest = createPullRequest({
      id: 'approved-pr',
      title: 'Approved pull request',
      discussions: [],
      approvedBy: [reviewer],
    });
    const reviewedPullRequest = createPullRequest({
      id: 'reviewed-pr',
      title: 'Reviewed pull request',
      discussions: [],
    });
    const relationship = createRelationship([discussionPullRequest, approvedPullRequest, reviewedPullRequest]);
    const view = render(<RelationshipDetails relationship={relationship} metric="discussionsStartedCount" />);

    expect(screen.getByText('Pull requests with discussions started')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: discussionPullRequest.title })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: approvedPullRequest.title })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: reviewedPullRequest.title })).not.toBeInTheDocument();

    view.rerender(<RelationshipDetails relationship={relationship} metric="approvalsCount" />);

    expect(screen.getByText('Approved pull requests')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: approvedPullRequest.title })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: discussionPullRequest.title })).not.toBeInTheDocument();

    view.rerender(<RelationshipDetails relationship={relationship} metric="reviewedPullRequestsCount" />);

    expect(screen.getByText('Reviewed pull requests')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: discussionPullRequest.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: approvedPullRequest.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: reviewedPullRequest.title })).toBeInTheDocument();
  });

  it('closes an open discussion dialog when a metric change filters out its pull request', async () => {
    const discussionPullRequest = createPullRequest({
      id: 'discussion-only-pr',
      title: 'Discussion-only pull request',
      discussions: [createDiscussion({ id: 'discussion-only-thread', starter: reviewer })],
    });
    const relationship = createRelationship([discussionPullRequest]);
    const view = render(<RelationshipDetails relationship={relationship} metric="discussionsStartedCount" />);

    fireEvent.click(screen.getByRole('button', { name: `View 1 discussion for ${discussionPullRequest.title}` }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    view.rerender(<RelationshipDetails relationship={relationship} metric="approvalsCount" />);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      screen.getByText(`${reviewer.displayName} did not approve any pull requests in this relationship.`)
    ).toBeInTheDocument();
  });
});

function createRelationship(pullRequests: PullRequest[], relationshipReviewer: User = reviewer): TeamReviewRelationship {
  return {
    id: getRelationshipId(relationshipReviewer.id, author.id),
    reviewer: relationshipReviewer,
    author,
    isAuthorSelectedTeamMember: true,
    reviewedPullRequestsCount: pullRequests.length,
    approvalsCount: pullRequests.filter((pullRequest) =>
      pullRequest.approvedByUser.some((activity) => activity.user.id === relationshipReviewer.id)
    ).length,
    discussionsStartedCount: pullRequests.reduce(
      (count, pullRequest) =>
        count + pullRequest.discussions.filter((discussion) => discussion.reviewerId === relationshipReviewer.id).length,
      0
    ),
    commentsCount: 0,
    pullRequests,
  };
}

function createPullRequest({
  id,
  title,
  discussions,
  approvedBy = [],
}: {
  id: string;
  title: string;
  discussions: UserDiscussion[];
  approvedBy?: User[];
}): PullRequest {
  return {
    id,
    title,
    repositoryName: 'code-review-analyzer',
    branchName: 'feature/team-review',
    url: `https://example.com/pulls/${id}`,
    targetBranch: 'main',
    status: 'open',
    author,
    requestedReviewers: [],
    reviewedByUser: [],
    approvedByUser: approvedBy.map((user) => ({
      user,
      at: '2026-07-20T11:00:00.000Z',
      activityType: 'approved',
    })),
    requestedChangesByUser: [],
    updatedAt: '2026-07-20T12:00:00.000Z',
    createdAt: '2026-07-20T10:00:00.000Z',
    comments: [],
    discussions,
    changedFilesCount: 1,
    linesAdded: 10,
    linesRemoved: 2,
    discussionCount: discussions.length,
    reviewCommentCount: discussions.reduce((count, discussion) => count + discussion.comments.length, 0),
  };
}

function createDiscussion({ id, starter, comments }: { id: string; starter: User; comments?: Comment[] }): UserDiscussion {
  return {
    id,
    prAuthorId: author.id,
    prAuthorName: author.displayName,
    reviewerId: starter.id,
    reviewerName: starter.displayName,
    reviewerAvatarUrl: starter.avatarUrl,
    pullRequestId: 'pr-with-discussions',
    pullRequestName: 'Add dashboard filters',
    pullRequestUrl: 'https://example.com/pulls/pr-with-discussions',
    url: `https://example.com/discussions/${id}`,
    comments: comments ?? [createComment({ id: `${id}-comment`, user: starter, body: `Comment for ${id}` })],
  };
}

function createComment({ id, user, body }: { id: string; user: User; body: string }): Comment {
  return {
    id,
    prAuthorId: author.id,
    prAuthorName: author.displayName,
    prAuthorAvatarUrl: author.avatarUrl,
    reviewerId: user.id,
    reviewerName: user.displayName,
    reviewerAvatarUrl: user.avatarUrl,
    body,
    pullRequestId: 'pr-with-discussions',
    pullRequestName: 'Add dashboard filters',
    url: `https://example.com/comments/${id}`,
    filePath: '',
    createdAt: '2026-07-20T11:00:00.000Z',
  };
}
