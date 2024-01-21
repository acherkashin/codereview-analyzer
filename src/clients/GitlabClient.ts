import { User, Client, Project, AnalyzeParams, PullRequest } from './types';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema, ProjectSchema, AllMergeRequestsOptions } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { MergeRequestNoteSchema, MergeRequestSchema } from '@gitbeaker/core/dist/types/types';

export class GitlabClient implements Client {
  private api: GitlabType;

  constructor(private host: string, private token: string) {
    this.api = new Gitlab({
      token,
      host,
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const projects = await this.api.Projects.all({ perPage: 100 });

    return projects.map((item) => convertToProject(item));
  }

  async searchProjects(searchText: string): Promise<Project[]> {
    const projects = await this.api.Projects.search(searchText);

    return projects.map<Project>((item) => ({
      id: item.id.toString(),
      name: item.name_with_namespace,
      avatarUrl: item.avatar_url,
      description: item.description,
    }));
  }

  async getComments(params: AnalyzeParams): Promise<any> {
    const mergeRequests = await getMergeRequests(this.api, params);

    return getUserComments(this.api, parseInt(params.projectId), mergeRequests);
  }

  async getPullRequests(params: AnalyzeParams): Promise<PullRequest[]> {
    const mergeRequest = await getMergeRequests(this.api, params);

    return mergeRequest.map<PullRequest>((item) => ({
      id: item.id.toString(),
      title: item.title,
      branchName: item.source_branch,
      url: item.web_url,
      targetBranch: item.target_branch,
      updatedAt: item.updated_at,
      author: convertToUser(item.author as any),
      reviewers: (item.reviewers ?? []).map((item) => convertToUser(item as any)),
    }));
  }

  getCurrentUser(): Promise<User> {
    return this.api.Users.current().then(convertToUser);
  }

  async searchUsers(searchText: string): Promise<User[]> {
    const resp = await this.api.Users.search(searchText);
    return resp.map(convertToUser);
  }

  async getAllUsers(): Promise<User[]> {
    return this.api.Users.all({ perPage: 100 }).then((resp) => resp.map(convertToUser));
  }
}

export interface UserComment {
  mergeRequest: MergeRequestSchema;
  comment: MergeRequestNoteSchema;
}

export function convertToUser(user: Pick<UserSchema, 'id' | 'name' | 'username' | 'avatar_url' | 'web_url' | 'state'>): User {
  return {
    id: user.id!.toString(),
    fullName: user.name!,
    userName: user.username,
    avatarUrl: user.avatar_url!,
    webUrl: user.web_url,
    active: user.state !== 'blocked',
  };
}

export function convertToProject(project: ProjectSchema): Project {
  return {
    id: project.id.toString(),
    name: project.name_with_namespace,
    avatarUrl: project.avatar_url,
    description: project.description,
  };
}

export async function getUserComments(client: GitlabType, projectId: number, mrs: MergeRequestSchema[]): Promise<UserComment[]> {
  const comments = await getCommentsForMergeRequests(client, projectId, mrs);

  return comments.filter((item) => !item.comment.system);
}

async function getCommentsForMergeRequests(client: GitlabType, projectId: number, allMrs: MergeRequestSchema[]) {
  const mrs = allMrs.filter((item) => item.user_notes_count !== 0);
  const promises = mrs.map((mrItem) => {
    return client.MergeRequestNotes.all(projectId, mrItem.iid, { perPage: 100 }).then((userNotes) => {
      return userNotes.map((item) => ({ mergeRequest: mrItem, comment: item } as UserComment));
    });
  });

  const allComments = await Promise.allSettled(promises);

  const comments = allComments.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));

  return comments;
}

function getMergeRequests(api: GitlabType, { projectId, createdAfter, createdBefore, state }: AnalyzeParams) {
  let gitlabState: AllMergeRequestsOptions['state'] = undefined;

  if (state === 'open') {
    gitlabState = 'opened';
  } else if (state === 'all') {
    gitlabState = undefined;
  } else {
    gitlabState = state;
  }

  return api.MergeRequests.all({
    projectId,
    createdAfter: createdAfter?.toISOString(),
    createdBefore: createdBefore?.toISOString(),
    perPage: 100,
    state: gitlabState,
  });
}
