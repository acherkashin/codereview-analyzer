import { User, Project, AnalyzeParams, ExportData } from '../types';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema, AllMergeRequestsOptions } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import {
  MergeRequestNoteSchema,
  MergeRequestSchema,
  DiscussionSchema,
  MergeRequestLevelMergeRequestApprovalSchema,
} from '@gitbeaker/core/dist/types/types';
import { GitService } from '../GitService';
import { convertToProject, convertToUser } from './GitlabConverter';

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

  async fetch(params: AnalyzeParams): Promise<ExportData> {
    const rawUsers = await this._getAllUsers();
    const rawPullRequests = await this.requestRawData(params);

    return {
      hostType: 'Gitlab',
      hostUrl: this.host,
      data: {
        pullRequests: rawPullRequests,
        users: rawUsers,
      },
    };
  }

  async requestRawData(params: AnalyzeParams): Promise<GitlabRawDatum[]> {
    const allMrs = await getMergeRequests(this.api, params);
    const projectId = parseInt(params.project.id);

    const promises = allMrs.map<Promise<GitlabRawDatum>>(async (mrItem) => {
      //TODO: most probably it is enough to get only discussions and get the user notes from it, so we can optimize it later
      const userNotes = await this.api.MergeRequestNotes.all(projectId, mrItem.iid, { perPage: 100 });
      const discussions = await this.api.MergeRequestDiscussions.all(projectId, mrItem.iid, { perPage: 100 });
      const approvalsConfiguration = await this.api.MergeRequestApprovals.configuration(projectId, {
        mergerequestIid: mrItem.iid,
      });

      return {
        mergeRequest: mrItem,
        notes: userNotes,
        discussions,
        approvalsConfiguration,
      } as GitlabRawDatum;
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

  private async _getAllUsers(): Promise<UserSchema[]> {
    return this.api.Users.all({ perPage: 100 });
  }
}

export interface GitlabRawDatum {
  mergeRequest: MergeRequestSchema;
  notes: MergeRequestNoteSchema[];
  discussions: DiscussionSchema[];
  approvalsConfiguration: MergeRequestLevelMergeRequestApprovalSchema;
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
    scope: 'all',
  });
}
