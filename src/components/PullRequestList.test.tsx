import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PullRequest, User } from '../services/types';
import { PullRequestList } from './PullRequestList';

const author: User = {
  id: 'author-1',
  fullName: 'Alice Author',
  userName: 'alice',
  displayName: 'Alice Author',
  avatarUrl: '',
  webUrl: '',
  active: true,
};

describe('PullRequestList', () => {
  it('renders a PR size legend for one-on-one pull request lists', () => {
    render(<PullRequestList pullRequests={[createPullRequest()]} variant="oneOnOne" />);

    expect(screen.getByLabelText('PR size legend')).toBeInTheDocument();
    expect(screen.getByText('Compact: 0-150 lines')).toBeInTheDocument();
    expect(screen.getByText('Very large: 1000+ lines')).toBeInTheDocument();
  });
});

function createPullRequest(): PullRequest {
  return {
    id: 'pr-1',
    title: 'Add team dashboard',
    repositoryName: 'code-review-analyzer',
    branchName: 'feature/team-dashboard',
    url: 'https://example.com/pull/1',
    targetBranch: 'main',
    status: 'open',
    author,
    requestedReviewers: [],
    reviewedByUser: [],
    approvedByUser: [],
    requestedChangesByUser: [],
    updatedAt: '2026-05-14T10:00:00.000Z',
    createdAt: '2026-05-14T09:00:00.000Z',
    comments: [],
    discussions: [],
    changedFilesCount: 3,
    linesAdded: 80,
    linesRemoved: 20,
    discussionCount: 0,
    reviewCommentCount: 0,
  };
}
