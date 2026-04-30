import { describe, expect, it, vi } from 'vitest';
import { GiteaService } from './GiteaService';
import { AnalyzeParams } from '../types';

describe('GiteaService progress', () => {
  it('emits progress for users, requested pull request count, and pull request details', async () => {
    const service = new GiteaService('https://gitea.example.com', 'token');
    const pullRequests = [
      { number: 1, title: 'First PR', merged: true, state: 'closed' },
      { number: 2, title: 'Second PR', merged: false, state: 'open' },
    ];
    const api = {
      users: {
        userSearch: vi.fn().mockResolvedValue({ data: { data: [{ id: 1, login: 'alice' }] } }),
      },
      repos: {
        repoListPullRequests: vi
          .fn()
          .mockResolvedValueOnce({ data: pullRequests })
          .mockResolvedValueOnce({ data: [] }),
        repoListPullReviews: vi.fn().mockResolvedValue({ data: [{ id: 11, comments_count: 1 }] }),
        issueGetCommentsAndTimeline: vi.fn().mockResolvedValue({ data: [] }),
        repoGetPullRequestFiles: vi.fn().mockResolvedValue({ data: [] }),
        repoGetPullReviewComments: vi.fn().mockResolvedValue({ data: [{ id: 101 }] }),
      },
    };
    (service as any).api = api;
    const onProgress = vi.fn();

    await service.fetch(createParams(), { onProgress });

    expect(api.repos.repoListPullRequests).toHaveBeenNthCalledWith(
      1,
      'owner',
      'repo',
      expect.objectContaining({
        page: 1,
        limit: 50,
      })
    );
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'users', fetched: 1, total: 1 }));
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'pull-request-list', fetched: 2, total: 100 })
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'pull-request-details',
        currentDataType: 'reviews',
        currentPullRequestTitle: 'First PR',
      })
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'pull-request-details',
        fetched: 2,
        total: 2,
        currentDataType: 'completed details',
      })
    );
  });
});

function createParams(): AnalyzeParams {
  return {
    project: {
      id: 'repo',
      name: 'repo',
      owner: 'owner',
    },
    pullRequestCount: 100,
    state: 'all',
  };
}
