import { describe, expect, it } from 'vitest';
import { PullRequest, User } from '../../../services/types';
import { getPullRequestsLineChartData, TOTAL_PULL_REQUESTS_SERIES_ID } from './PullRequestsCreatedPerMonthChartUtils';

const alice = createUser('alice', 'Alice');
const bob = createUser('bob', 'Bob');

describe('getPullRequestsLineChartData', () => {
  it('aggregates every author and fills months without pull requests in total mode', () => {
    const data = getPullRequestsLineChartData(
      [createPullRequest('one', '2025-01-12', alice), createPullRequest('two', '2025-03-04', bob), createPullRequest('three', '2025-03-27', alice)],
      {
        mode: 'total',
        startDate: new Date(2025, 0, 15),
        endDate: new Date(2025, 3, 2),
      }
    );

    expect(data).toEqual([
      {
        id: TOTAL_PULL_REQUESTS_SERIES_ID,
        data: [
          { x: new Date(2025, 0, 1), y: 1 },
          { x: new Date(2025, 1, 1), y: 0 },
          { x: new Date(2025, 2, 1), y: 2 },
          { x: new Date(2025, 3, 1), y: 0 },
        ],
      },
    ]);
  });

  it('returns separate author series and limits an individual view to the selected user', () => {
    const pullRequests = [
      createPullRequest('one', '2025-01-12', alice),
      createPullRequest('two', '2025-02-04', bob),
      createPullRequest('three', '2025-02-27', alice),
    ];

    expect(getPullRequestsLineChartData(pullRequests, { mode: 'individual' })).toEqual([
      {
        id: 'Alice',
        data: [
          { x: new Date(2025, 0, 1), y: 1, authorId: alice.id },
          { x: new Date(2025, 1, 1), y: 1, authorId: alice.id },
        ],
      },
      {
        id: 'Bob',
        data: [{ x: new Date(2025, 1, 1), y: 1, authorId: bob.id }],
      },
    ]);

    expect(getPullRequestsLineChartData(pullRequests, { mode: 'individual', user: bob })).toEqual([
      {
        id: 'Bob',
        data: [{ x: new Date(2025, 1, 1), y: 1, authorId: bob.id }],
      },
    ]);
  });
});

function createUser(id: string, displayName: string): User {
  return {
    id,
    displayName,
    fullName: displayName,
    userName: displayName.toLowerCase(),
    avatarUrl: '',
    webUrl: '',
    active: true,
  };
}

function createPullRequest(id: string, createdAt: string, author: User): PullRequest {
  return {
    id,
    createdAt,
    author,
  } as PullRequest;
}
