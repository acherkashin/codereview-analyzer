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
        repoListPullRequests: vi.fn().mockResolvedValueOnce({ data: pullRequests }).mockResolvedValueOnce({ data: [] }),
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
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'pull-request-list', fetched: 2, total: 100 }));
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

  it('continues paging until the analyzable minimum is reached and keeps the entire final page', async () => {
    const firstPage = [
      ...createPullRequests(1, 45, { merged: true, state: 'closed' }),
      ...createPullRequests(46, 5, { merged: false, state: 'closed' }),
    ];
    const secondPage = [
      { ...firstPage[0] },
      ...createPullRequests(51, 48, { merged: false, state: 'open' }),
      ...createPullRequests(99, 1, { merged: false, state: 'closed' }),
    ];
    const { service, api } = createServiceWithPages(firstPage, secondPage);
    const onProgress = vi.fn();

    const result = await service.fetch({ ...createParams(), pullRequestCount: 50 }, { onProgress });

    expect(api.repos.repoListPullRequests).toHaveBeenCalledTimes(2);
    expect(result.data.pullRequests).toHaveLength(93);
    expect(new Set(result.data.pullRequests.map((item) => item.pullRequest.id))).toHaveLength(93);
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'pull-request-list',
        fetched: 93,
        total: 50,
        minimumTarget: true,
        examined: 100,
        ineligible: 6,
        duplicates: 1,
      })
    );
  });

  it('returns all available analyzable pull requests when the repository is exhausted below the minimum', async () => {
    const page = [
      ...createPullRequests(1, 1, { merged: true, state: 'closed' }),
      ...createPullRequests(2, 1, { merged: false, state: 'open' }),
      ...createPullRequests(3, 1, { merged: false, state: 'closed' }),
    ];
    const { service, api } = createServiceWithPages(page);

    const result = await service.fetch({ ...createParams(), pullRequestCount: 100 });

    expect(api.repos.repoListPullRequests).toHaveBeenCalledTimes(1);
    expect(result.data.pullRequests.map((item) => item.pullRequest.id)).toEqual([1, 2]);
  });

  it('preserves unlimited exports while filtering and deduplicating all pages', async () => {
    const firstPage = createPullRequests(1, 50, { merged: true, state: 'closed' });
    const secondPage = [
      { ...firstPage[0] },
      ...createPullRequests(51, 1, { merged: false, state: 'open' }),
      ...createPullRequests(52, 1, { merged: false, state: 'closed' }),
    ];
    const { service, api } = createServiceWithPages(firstPage, secondPage);

    const result = await service.fetch({ ...createParams(), pullRequestCount: Number.MAX_VALUE });

    expect(api.repos.repoListPullRequests).toHaveBeenCalledTimes(2);
    expect(result.data.pullRequests).toHaveLength(51);
    expect(new Set(result.data.pullRequests.map((item) => item.pullRequest.id))).toHaveLength(51);
  });
});

function createServiceWithPages(...pages: any[][]) {
  const service = new GiteaService('https://gitea.example.com', 'token');
  const api = {
    users: {
      userSearch: vi.fn().mockResolvedValue({ data: { data: [] } }),
    },
    repos: {
      repoListPullRequests: vi.fn(),
      repoListPullReviews: vi.fn().mockResolvedValue({ data: [] }),
      issueGetCommentsAndTimeline: vi.fn().mockResolvedValue({ data: [] }),
      repoGetPullRequestFiles: vi.fn().mockResolvedValue({ data: [] }),
      repoGetPullReviewComments: vi.fn().mockResolvedValue({ data: [] }),
    },
  };

  pages.forEach((page) => api.repos.repoListPullRequests.mockResolvedValueOnce({ data: page }));
  api.repos.repoListPullRequests.mockResolvedValue({ data: [] });
  (service as any).api = api;

  return { service, api };
}

function createPullRequests(startId: number, count: number, state: { merged: boolean; state: 'open' | 'closed' }) {
  return Array.from({ length: count }, (_, index) => {
    const id = startId + index;
    return { id, number: id, title: `Pull request ${id}`, ...state };
  });
}

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
