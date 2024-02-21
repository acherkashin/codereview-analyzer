import { User, Project, AnalyzeParams, PullRequest, ExportData, RawData } from '../types';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema, ProjectSchema, AllMergeRequestsOptions } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { MergeRequestNoteSchema, MergeRequestSchema, DiscussionSchema } from '@gitbeaker/core/dist/types/types';
import { GitService } from '../GitService';
import { convertToProject, convertToPullRequest, convertToUser } from './GitlabConverter';

export class GitlabService implements GitService {
  private api: GitlabType;

  constructor(private host: string, private token: string) {
    this.api = new Gitlab({
      token,
      host,
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

  async analyze(params: AnalyzeParams): Promise<[PullRequest[], User[], ExportData]> {
    const rawUsers = await this._getAllUsers();
    const rawPullRequests = await this.requestRawData(params);

    const { pullRequests, users } = this.analyzeRawData({ users: rawUsers, pullRequests: rawPullRequests });

    return [
      pullRequests,
      users,
      {
        hostType: 'Gitlab',
        hostUrl: this.host,
        data: {
          pullRequests: rawPullRequests,
          users: rawUsers,
        },
      },
    ];
  }

  async requestRawData(params: AnalyzeParams): Promise<GitlabRawDatum[]> {
    const allMrs = await getMergeRequests(this.api, params);
    const projectId = parseInt(params.project.id);

    const mrs = allMrs.filter((item) => item.user_notes_count !== 0);

    const promises = mrs.map<Promise<GitlabRawDatum>>(async (mrItem) => {
      //TODO: most probably it is enough to get only discussions and get the user notes from it, so we can optimize it later
      const userNotes = await this.api.MergeRequestNotes.all(projectId, mrItem.iid, { perPage: 100 });
      const discussions = await this.api.MergeRequestDiscussions.all(projectId, mrItem.iid, { perPage: 100 });

      return {
        mergeRequest: mrItem,
        notes: userNotes,
        discussions,
      };
    });

    const allComments = await Promise.allSettled(promises);

    const result = allComments.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));

    return result;
  }

  getCurrentUser(): Promise<User> {
    return this.api.Users.current().then(convertToUser);
  }

  async searchUsers(searchText: string): Promise<User[]> {
    const resp = await this.api.Users.search(searchText);
    return resp.map(convertToUser);
  }

  async getAllUsers(): Promise<User[]> {
    return this._getAllUsers().then((resp) => resp.map(convertToUser));
  }

  analyzeRawData({ pullRequests, users }: RawData): { pullRequests: PullRequest[]; users: User[] } {
    return {
      pullRequests: pullRequests.map(convertToPullRequest),
      users: users.map(convertToUser),
    };
  }

  private async _getAllUsers(): Promise<UserSchema[]> {
    return this.api.Users.all({ perPage: 100 });
  }
}

export interface GitlabRawDatum {
  mergeRequest: MergeRequestSchema;
  notes: MergeRequestNoteSchema[];
  discussions: DiscussionSchema[];
}

function getMergeRequests(api: GitlabType, { project, createdAfter, createdBefore, state }: AnalyzeParams) {
  let gitlabState: AllMergeRequestsOptions['state'] = undefined;

  if (state === 'open') {
    gitlabState = 'opened';
  } else if (state === 'all') {
    gitlabState = undefined;
  } else {
    gitlabState = state;
  }

  return api.MergeRequests.all({
    project: project.id,
    createdAfter: createdAfter?.toISOString(),
    createdBefore: createdBefore?.toISOString(),
    perPage: 100,
    state: gitlabState,
  });
}
