import { User } from './types/User';
import { Client } from './types/Client';
import { Gitlab } from '@gitbeaker/browser';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import {
  UserSchema,
  MergeRequestNoteSchema,
  MergeRequestSchema,
  DiscussionSchema,
  MergeRequestLevelMergeRequestApprovalSchema,
} from '@gitbeaker/core/dist/types/types';

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
    return this.api.Users.current().then((user) => {
      return {
        id: user.id!.toString(),
        name: user.name!,
        // email: user.,
        avatarUrl: user.avatar_url!,
        webUrl: user.web_url,
      } as User;
    });
  }
}

export interface UserComment {
  mergeRequest: MergeRequestSchema;
  comment: MergeRequestNoteSchema;
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
