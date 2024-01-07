import { User, Client, Project } from './types';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { MergeRequestNoteSchema, MergeRequestSchema } from '@gitbeaker/core/dist/types/types';

/**
 * Replace with AnalyzeParams
 */
export interface PullRequestsParams {
  projectId: number;
  createdAfter: Date;
  createdBefore: Date;
}

export class GitlabClient implements Client {
  private api: GitlabType;

  constructor(private host: string, private token: string) {
    this.api = new Gitlab({
      token,
      host,
    });
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

  async getComments({ projectId, createdAfter, createdBefore }: PullRequestsParams): Promise<any> {
    const mergeRequests = await this.getPullRequests({
      projectId,
      createdAfter,
      createdBefore,
    });

    return getUserComments(this.api, projectId, mergeRequests);
  }

  getPullRequests({ projectId, createdAfter, createdBefore }: PullRequestsParams): Promise<any> {
    return this.api.MergeRequests.all({
      projectId,
      createdAfter: createdAfter.toISOString(),
      createdBefore: createdBefore.toISOString(),
      perPage: 100,
    });
  }

  getCurrentUser(): Promise<User> {
    return this.api.Users.current().then(convertToUser);
  }

  async getUsers(): Promise<User[]> {
    const resp = await this.api.Users.all({ perPage: 100 });
    return resp.map(convertToUser);
  }
}

export interface UserComment {
  mergeRequest: MergeRequestSchema;
  comment: MergeRequestNoteSchema;
}

export function convertToUser(user: UserSchema): User {
  return {
    id: user.id!.toString(),
    fullName: user.name!,
    userName: user.username,
    avatarUrl: user.avatar_url!,
    webUrl: user.web_url,
    active: user.state !== 'blocked',
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
