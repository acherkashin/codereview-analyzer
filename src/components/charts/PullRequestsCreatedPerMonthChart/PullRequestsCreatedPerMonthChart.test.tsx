import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PullRequest, User } from '../../../services/types';
import { PullRequestsCreatedPerMonthChart } from './PullRequestsCreatedPerMonthChart';

vi.mock('../LineChart', () => ({
  LineChart: ({ data, onClick }: any) => (
    <>
      <output data-testid="line-chart-data">{JSON.stringify(data)}</output>
      {data[0]?.data[0] && (
        <button
          type="button"
          onClick={() =>
            onClick({
              serieId: data[0].id,
              data: data[0].data[0],
            })
          }
        >
          Open first point
        </button>
      )}
    </>
  ),
}));

vi.mock('../../dialogs/PullRequestDialog', () => ({
  PullRequestDialog: ({ open, title, pullRequests }: any) =>
    open ? (
      <div data-testid="pull-request-dialog">
        {title}: {pullRequests.map((pullRequest: PullRequest) => pullRequest.id).join(',')}
      </div>
    ) : null,
}));

const alice = createUser('alice', 'Alice');
const bob = createUser('bob', 'Bob');
const pullRequests = [createPullRequest('alice-january', '2025-01-12', alice), createPullRequest('bob-january', '2025-01-18', bob)];

describe('PullRequestsCreatedPerMonthChart', () => {
  it('defaults to total, switches to individual data, and drills into the matching monthly pull requests', async () => {
    render(
      <PullRequestsCreatedPerMonthChart
        pullRequests={pullRequests}
        startDate={new Date(2025, 0, 1)}
        endDate={new Date(2025, 0, 31)}
      />
    );

    expect(screen.getByRole('button', { name: 'Show total pull requests' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('line-chart-data')).toHaveTextContent('"id":"Total"');

    await userEvent.click(screen.getByRole('button', { name: 'Open first point' }));
    expect(screen.getByTestId('pull-request-dialog')).toHaveTextContent('alice-january,bob-january');

    await userEvent.click(screen.getByRole('button', { name: 'Show pull requests by individual' }));
    expect(screen.getByTestId('line-chart-data')).toHaveTextContent('"id":"Alice"');
    await userEvent.click(screen.getByRole('button', { name: 'Open first point' }));
    expect(screen.getByTestId('pull-request-dialog')).toHaveTextContent('alice-january');
  });

  it('hides the display setting and shows only the selected user trend', () => {
    render(<PullRequestsCreatedPerMonthChart pullRequests={pullRequests} user={alice} />);

    expect(screen.queryByRole('button', { name: 'Show total pull requests' })).not.toBeInTheDocument();
    expect(screen.getByTestId('line-chart-data')).toHaveTextContent('"id":"Alice"');
    expect(screen.getByTestId('line-chart-data')).not.toHaveTextContent('"id":"Bob"');
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
