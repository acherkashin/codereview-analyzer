import { User, Project, AnalyzeParams } from '../types';
import { Gitlab } from '@gitbeaker/rest';
import type {
  MergeRequestNoteSchema,
  MergeRequestSchema,
  DiscussionSchema,
  MergeRequestLevelMergeRequestApprovalSchema,
  UserSchema,
  MergeRequestDiffSchema,
  AllMergeRequestsOptions,
} from '@gitbeaker/rest';
import { FetchOptions, GitService, PullRequestFetchProgress } from '../GitService';
import { convertToProject, convertToUser } from './GitlabConverter';
import { requestAllChunked, successRetry } from '../../utils/PromiseUtils';
import { ExportData } from '../../utils/ExportDataUtils';

type GitlabType = InstanceType<typeof Gitlab<false>>;

export class GitlabService implements GitService {
  private api: GitlabType;

  constructor(private host: string, private token: string) {
    this.api = new Gitlab({
      token,
      host,
      // if we requests pull requests for long period of time it will lead to timeout, so we need to reset it
      queryTimeout: null,
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const projects = await this.api.Projects.all({ perPage: 100 });

    return projects.map(convertToProject);
  }

  async searchProjects(searchText: string): Promise<Project[]> {
    const projects = await this.api.Projects.search(searchText);

    return projects.map<Project>(convertToProject);
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
      hostType: 'Gitlab',
      hostUrl: this.host,
      data: {
        pullRequests: rawPullRequests,
        users: rawUsers,
      },
    };
  }

  async requestRawData(params: AnalyzeParams, options?: FetchOptions): Promise<GitlabRawDatum[]> {
    const allMrs = await getMergeRequests(this.api, params, options);
    const projectId = parseInt(params.project.id);
    let completedPullRequests = 0;

    const emitDetailProgress = (mrItem: MergeRequestSchema, currentDataType: string) => {
      emitProgress(options, {
        stage: 'pull-request-details',
        stageLabel: 'Fetching pull request details',
        fetched: completedPullRequests,
        total: allMrs.length,
        currentDataType,
        currentPullRequestTitle: mrItem.title,
        createdAfter: params.createdAfter?.toISOString(),
        createdBefore: params.createdBefore?.toISOString(),
      });
    };

    const promises = allMrs.map<() => Promise<GitlabRawDatum>>((mrItem) => async () => {
      //TODO: most probably it is enough to get only discussions and get the user notes from it, so we can optimize it later
      emitDetailProgress(mrItem, 'notes');
      const userNotes = await successRetry(() => this.api.MergeRequestNotes.all(projectId, mrItem.iid, { perPage: 100 }), 3, 1000, []);
      emitDetailProgress(mrItem, 'discussions');
      const discussions = await successRetry(() => this.api.MergeRequestDiscussions.all(projectId, mrItem.iid, { perPage: 100 }), 3, 1000, []);
      emitDetailProgress(mrItem, 'approvals');
      const approvalsConfiguration = await successRetry(
        () =>
          this.api.MergeRequestApprovals.showConfiguration(projectId, {
            mergerequestIId: mrItem.iid,
          }),
        3,
        1000,
        {} as MergeRequestLevelMergeRequestApprovalSchema
      );

      emitDetailProgress(mrItem, 'diffs');
      const changes = await successRetry(() => this.api.MergeRequests.allDiffs(projectId, mrItem.iid), 3, 1000, []);
      completedPullRequests++;

      const datum = {
        projectName: params.project.name,
        mergeRequest: mrItem,
        notes: userNotes ?? [],
        discussions: discussions ?? [],
        approvalsConfiguration: approvalsConfiguration ?? ({} as MergeRequestLevelMergeRequestApprovalSchema),
        changes: changes ?? [],
      } as GitlabRawDatum;

      emitDetailProgress(mrItem, 'completed details');

      return datum;
    });

    const result = await requestAllChunked(promises);

    return result;
  }

  getCurrentUser(): Promise<User> {
    return this.api.Users.showCurrentUser().then(convertToUser);
  }

  async searchUsers(searchText: string): Promise<User[]> {
    const resp = await this.api.Users.all({ search: searchText, perPage: 100 });
    return resp.map(convertToUser);
  }

  async getAllUsers(): Promise<User[]> {
    return this._getAllUsers().then((resp) => resp.map(convertToUser));
  }

  private async _getAllUsers(): Promise<UserSchema[]> {
    return this.api.Users.all({ perPage: 100 });
  }

  getErrorMessage(e: any): string {
    return e.cause?.message || e.cause?.description || e.name || 'Gitlab error';
  }
}

export interface GitlabRawDatum {
  projectName: string;
  mergeRequest: MergeRequestSchema;
  notes: MergeRequestNoteSchema[];
  discussions: DiscussionSchema[];
  approvalsConfiguration: MergeRequestLevelMergeRequestApprovalSchema;
  changes: MergeRequestDiffSchema[];
}

interface GitlabMergeRequestsPage {
  data?: MergeRequestSchema[];
  paginationInfo?: {
    total?: number;
    next?: number | null;
    current?: number;
    perPage?: number;
    totalPages?: number;
  };
}

async function getMergeRequests(api: GitlabType, { project, createdAfter, createdBefore, state }: AnalyzeParams, options?: FetchOptions) {
  let gitlabState: AllMergeRequestsOptions['state'] = undefined;
  const createdAfterIso = createdAfter?.toISOString();
  const createdBeforeIso = createdBefore?.toISOString();

  if (state === 'open') {
    gitlabState = 'opened';
  } else if (state === 'all') {
    gitlabState = undefined;
  } else {
    gitlabState = state;
  }

  const requestOptions = {
    projectId: project.id,
    createdAfter: createdAfterIso,
    createdBefore: createdBeforeIso,
    perPage: 100,
    state: gitlabState,
    scope: 'all',
  } satisfies AllMergeRequestsOptions & { projectId: string; perPage: number; scope: 'all' };

  const mergeRequests: MergeRequestSchema[] = [];
  let page = 1;
  let total: number | undefined;

  emitProgress(options, {
    stage: 'pull-request-list',
    stageLabel: 'Fetching pull request list',
    fetched: 0,
    currentDataType: 'pull requests',
    createdAfter: createdAfterIso,
    createdBefore: createdBeforeIso,
  });

  while (true) {
    const response = (await api.MergeRequests.all({
      ...requestOptions,
      page,
      maxPages: 1,
      showExpanded: true,
    } as any)) as GitlabMergeRequestsPage | MergeRequestSchema[];
    const pageResponse = Array.isArray(response) ? undefined : response;
    const pageMergeRequests = Array.isArray(response) ? response : response.data ?? [];

    total = getFiniteNumber(pageResponse?.paginationInfo?.total) ?? total;
    mergeRequests.push(...pageMergeRequests);

    emitProgress(options, {
      stage: 'pull-request-list',
      stageLabel: 'Fetching pull request list',
      fetched: mergeRequests.length,
      total,
      currentDataType: 'pull requests',
      createdAfter: createdAfterIso,
      createdBefore: createdBeforeIso,
    });

    const nextPage = getFiniteNumber(pageResponse?.paginationInfo?.next);
    if (pageMergeRequests.length === 0 || nextPage == null) {
      break;
    }

    page = nextPage;
  }

  return mergeRequests;
}

function emitProgress(options: FetchOptions | undefined, progress: PullRequestFetchProgress) {
  options?.onProgress?.(progress);
}

function getFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
