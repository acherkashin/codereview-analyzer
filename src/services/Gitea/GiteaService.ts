import {
  Api as GiteaApi,
  giteaApi,
  User as GiteaUser,
  PullRequest as GiteaPullRequest,
  PullReviewComment as GiteaPullReviewComment,
  PullReview as GiteaPullReview,
  Repository,
  TimelineComment,
  ChangedFile,
} from 'gitea-js';
import { User, Project, AnalyzeParams, PullRequest, PullRequestStatus, RawData } from '../types';
import { FetchOptions, GitService, PullRequestFetchProgress } from '../GitService';
import { convertToProject, convertToPullRequest, convertToUser } from './GiteaConverter';
import { requestAllChunked, successRetry } from '../../utils/PromiseUtils';
import { ExportData } from '../../utils/ExportDataUtils';

export class GiteaService implements GitService {
  private api: GiteaApi<any>;

  constructor(private host: string, private token: string) {
    this.api = giteaApi(this.host, {
      token: this.token, // generate one at https://gitea.example.com/user/settings/applications
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const all: Repository[] = [];
    let projects: Repository[] = [];

    let page = 1;

    do {
      projects = (await this.api.repos.repoSearch({ q: '', page, limit: 100 })).data.data ?? [];
      all.push(...projects);
      page++;
    } while (projects.length === 100);

    return projects.map(convertToProject);
  }

  async searchProjects(searchText: string): Promise<Project[]> {
    const projects = (await this.api.repos.repoSearch({ q: searchText, page: 1, limit: 100 })).data.data;

    return (projects ?? []).map(convertToProject);
  }

  async getCurrentUser(): Promise<User> {
    const { data: user } = await this.api.user.userGetCurrent();
    return convertToUser(this.host, user);
  }

  async getAllUsers(): Promise<User[]> {
    const all = await this._getAllUsers();
    return all.map((user) => convertToUser(this.host, user));
  }

  async searchUsers(searchText: string): Promise<User[]> {
    const { data } = await this.api.users.userSearch({
      q: searchText,
      page: 1,
      limit: 100,
    });
    return (data.data ?? []).map((user) => convertToUser(this.host, user));
  }

  async fetch(params: AnalyzeParams, options?: FetchOptions): Promise<ExportData> {
    emitProgress(options, {
      stage: 'users',
      stageLabel: 'Fetching users',
      currentDataType: 'users',
    });

    const rawUsers = await this._getAllUsers();

    emitProgress(options, {
      stage: 'users',
      stageLabel: 'Fetched users',
      fetched: rawUsers.length,
      total: rawUsers.length,
      currentDataType: 'users',
    });

    const rawPullRequests = await this.requestRawData(params, options);

    return {
      hostType: 'Gitea',
      hostUrl: this.host,
      data: {
        pullRequests: rawPullRequests,
        users: rawUsers,
      },
    };
  }

  async requestRawData({ project, pullRequestCount, state }: AnalyzeParams, options?: FetchOptions): Promise<GiteaRawDatum[]> {
    if (project == null || project.owner == null) {
      throw new Error('project is required');
    }

    const { owner, name } = project;

    const pullRequestsToFetch = await getAllPullRequests(this.api, project, pullRequestCount, state, options);
    let completedPullRequests = 0;

    const emitDetailProgress = (pullRequest: GiteaPullRequest, currentDataType: string) => {
      emitProgress(options, {
        stage: 'pull-request-details',
        stageLabel: 'Fetching pull request details',
        fetched: completedPullRequests,
        total: pullRequestsToFetch.length,
        currentDataType,
        currentPullRequestTitle: pullRequest.title,
      });
    };

    const rawDataPromises = pullRequestsToFetch.map<() => Promise<GiteaRawDatum>>((pullRequest) => async () => {
      // In Gitea, a pull request can have multiple reviews, and each review can have multiple comments
      // So, we need:
      // 1. Get all pull requests
      // 2. Get reviews for each pull request
      // 3. Get comments for each review

      emitDetailProgress(pullRequest, 'reviews');
      const reviews = await successRetry(() => this.getAllReviews(owner, name, pullRequest.number!), 3, 1000, []);
      emitDetailProgress(pullRequest, 'timeline');
      const timeline = await successRetry(() => this.getAllComments(owner, name, pullRequest.number!), 3, 1000, []);
      emitDetailProgress(pullRequest, 'files');
      const files = await successRetry(() => this.getAllFiles(owner, name, pullRequest.number!), 3, 1000, []);

      const commentsFns = (reviews ?? [])
        .filter((review) => (review.comments_count ?? 0) > 0)
        .map(
          (review) => () =>
            successRetry(
              () => this.api.repos.repoGetPullReviewComments(owner, name, pullRequest.number!, review.id!),
              3,
              1000,
              {} as any
            )
        );

      emitDetailProgress(pullRequest, 'review comments');
      const commentsResp = await requestAllChunked(commentsFns);
      const prComments = commentsResp.flatMap((item) => item?.data ?? []);
      completedPullRequests++;

      const datum = {
        projectName: project.name,
        pullRequest,
        comments: prComments,
        reviews: reviews ?? [],
        timeline: timeline ?? [],
        files: files ?? [],
      };

      emitDetailProgress(pullRequest, 'completed details');

      return datum;
    });

    const rawData = await requestAllChunked(rawDataPromises);

    return rawData;
  }

  analyzeRawData({ pullRequests, users }: RawData): { pullRequests: PullRequest[]; users: User[] } {
    return {
      pullRequests: pullRequests.map((datum) => convertToPullRequest(this.host, datum)),
      users: users.map((user) => convertToUser(this.host, user)),
    };
  }

  getErrorMessage(e: any): string {
    return e?.error?.message || e?.statusText || 'Gitea error';
  }

  private async _getAllUsers(): Promise<GiteaUser[]> {
    return getAllPages(async (page) => {
      return (await this.api.users.userSearch({ q: '', page, limit: 50 })).data.data ?? [];
    }, 50);
  }

  private async getAllFiles(owner: string, repo: string, pullRequestIndex: number): Promise<ChangedFile[]> {
    const limit = 50;
    return getAllPages((page) => {
      return this.api.repos
        .repoGetPullRequestFiles(owner, repo, pullRequestIndex, {
          page,
          limit,
        })
        .then(({ data }) => data ?? []);
    }, limit);
  }

  private async getAllComments(owner: string, repo: string, pullRequestIndex: number): Promise<GiteaPullReviewComment[]> {
    const limit = 50;
    return getAllPages((page) => {
      return this.api.repos
        .issueGetCommentsAndTimeline(owner, repo, pullRequestIndex, {
          page,
          limit,
        })
        .then(({ data }) => data ?? []);
    }, limit);
  }

  private async getAllReviews(owner: string, repo: string, pullRequestIndex: number): Promise<GiteaPullReview[]> {
    const limit = 50;
    return getAllPages((page) => {
      return this.api.repos
        .repoListPullReviews(owner, repo, pullRequestIndex, {
          page,
          limit,
        })
        .then(({ data }) => data ?? []);
    }, limit);
  }
}

export interface GiteaRawDatum {
  projectName: string;
  pullRequest: GiteaPullRequest;
  reviews: GiteaPullReview[];
  comments: GiteaPullReviewComment[];
  timeline: TimelineComment[];
  files: ChangedFile[];
}

const pageSize = 50;

async function getAllPullRequests(
  client: GiteaApi<any>,
  project: Project,
  prCount: number,
  state?: PullRequestStatus,
  options?: FetchOptions
): Promise<GiteaPullRequest[]> {
  const requestedMinimum = Number.isSafeInteger(prCount) ? prCount : undefined;
  const pullRequests: GiteaPullRequest[] = [];
  const seenPullRequests = new Set<string>();
  let examined = 0;
  let ineligible = 0;
  let duplicates = 0;
  let pageIndex = 1;

  emitProgress(options, {
    stage: 'pull-request-list',
    stageLabel: 'Finding analyzable pull requests',
    fetched: 0,
    total: requestedMinimum,
    minimumTarget: requestedMinimum != null,
    examined,
    ineligible,
    duplicates,
  });

  while (requestedMinimum == null || pullRequests.length < requestedMinimum) {
    const result = await client.repos.repoListPullRequests(project.owner!, project.name, {
      state,
      // sort: 'recentupdate',
      page: pageIndex,
      limit: pageSize,
    });
    const page = result.data ?? [];

    if (page.length === 0) {
      break;
    }

    examined += page.length;

    for (const pullRequest of page) {
      const key = getPullRequestKey(pullRequest);
      if (seenPullRequests.has(key)) {
        duplicates++;
        continue;
      }

      seenPullRequests.add(key);

      if (!pullRequest.merged && pullRequest.state !== 'open') {
        ineligible++;
        continue;
      }

      pullRequests.push(pullRequest);
    }

    emitProgress(options, {
      stage: 'pull-request-list',
      stageLabel: 'Finding analyzable pull requests',
      fetched: pullRequests.length,
      total: requestedMinimum,
      minimumTarget: requestedMinimum != null,
      examined,
      ineligible,
      duplicates,
    });

    if (page.length < pageSize) {
      break;
    }

    pageIndex++;
  }

  return pullRequests;
}

function getPullRequestKey(pullRequest: GiteaPullRequest): string {
  if (pullRequest.id != null) {
    return `id:${pullRequest.id}`;
  }

  if (pullRequest.number != null) {
    return `number:${pullRequest.number}`;
  }

  return `url:${pullRequest.url}`;
}

function emitProgress(options: FetchOptions | undefined, progress: PullRequestFetchProgress) {
  options?.onProgress?.(progress);
}

async function getAllPages<T>(func: (page: number) => Promise<T[]>, pageSize: number): Promise<T[]> {
  const all: T[] = [];
  let currentPage: T[] = [];

  let page = 1;
  do {
    currentPage = (await func(page)) ?? [];
    all.push(...currentPage);
    page++;
  } while (currentPage.length === pageSize);

  return all;
}
