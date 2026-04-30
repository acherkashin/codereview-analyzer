import { describe, expect, it, vi } from 'vitest';
import { GitlabService } from './GitlabService';
import { AnalyzeParams } from '../types';

describe('GitlabService progress', () => {
  it('emits progress for users, paginated merge request list, and merge request details', async () => {
    const service = new GitlabService('https://gitlab.example.com', 'token');
    const mergeRequests = [
      { iid: 1, title: 'First MR' },
      { iid: 2, title: 'Second MR' },
    ];
    const api = {
      Users: {
        all: vi.fn().mockResolvedValue([{ id: 1, name: 'Alice' }]),
      },
      MergeRequests: {
        all: vi
          .fn()
          .mockResolvedValueOnce({
            data: [mergeRequests[0]],
            paginationInfo: { total: 2, next: 2, current: 1, perPage: 1, totalPages: 2 },
          })
          .mockResolvedValueOnce({
            data: [mergeRequests[1]],
            paginationInfo: { total: 2, next: null, current: 2, perPage: 1, totalPages: 2 },
          }),
        allDiffs: vi.fn().mockResolvedValue([]),
      },
      MergeRequestNotes: {
        all: vi.fn().mockResolvedValue([]),
      },
      MergeRequestDiscussions: {
        all: vi.fn().mockResolvedValue([]),
      },
      MergeRequestApprovals: {
        showConfiguration: vi.fn().mockResolvedValue({}),
      },
    };
    (service as any).api = api;
    const onProgress = vi.fn();

    await service.fetch(createParams(), { onProgress });

    expect(api.MergeRequests.all).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        page: 1,
        maxPages: 1,
        showExpanded: true,
      })
    );
    expect(api.MergeRequests.all).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        page: 2,
        maxPages: 1,
        showExpanded: true,
      })
    );
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'users', fetched: 1, total: 1 }));
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'pull-request-list', fetched: 2, total: 2 })
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'pull-request-details',
        currentDataType: 'notes',
        currentPullRequestTitle: 'First MR',
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
      id: '10',
      name: 'repo',
    },
    createdAfter: new Date('2026-04-01T00:00:00.000Z'),
    createdBefore: new Date('2026-04-30T00:00:00.000Z'),
    pullRequestCount: 100,
    state: 'all',
  };
}
