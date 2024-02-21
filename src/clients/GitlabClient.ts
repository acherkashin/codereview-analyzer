import { User, Project, AnalyzeParams, PullRequest, Comment, UserDiscussion, ExportData, RawData } from './types';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema, ProjectSchema, AllMergeRequestsOptions } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { MergeRequestNoteSchema, MergeRequestSchema, DiscussionSchema, DiscussionNote } from '@gitbeaker/core/dist/types/types';
import { Client } from './Client';

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

export function getNoteUrl(mrUrl: string, commentId: string) {
  return `${mrUrl}/#note_${commentId}`;
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

function convertToPullRequest({ mergeRequest: mr, notes: comments, discussions }: GitlabRawDatum): PullRequest {
  //   // some notes are left by gitlab, so we need to filter them out
  const notSystemComments = comments.filter((item) => !item.system);
  const notSystemDiscussions = discussions.filter((discussion) => discussion.notes?.some((item) => !item.system));

  return {
    id: mr.id.toString(),
    title: mr.title,
    branchName: mr.source_branch,
    url: mr.web_url,
    targetBranch: mr.target_branch,
    updatedAt: mr.updated_at,
    createdAt: mr.created_at,
    author: convertToUser(mr.author as any),
    requestedReviewers: (mr.reviewers ?? []).map((item) => convertToUser(item as any)),
    comments: notSystemComments.map<Comment>((item) => convertToComment(mr, item)),
    //TODO: implement
    reviewedByUserIds: [],
    approvedByUserIds: [],
    requestedChangesByUserIds: [],
    mergedAt: mr.merged_at,
    discussions: notSystemDiscussions.map((item) => convertToDiscussion(mr, item)),
    readyAt: getReadyTime(mr, comments),
  };
}

function convertToComment(mr: MergeRequestSchema, comment: MergeRequestNoteSchema | DiscussionNote): Comment {
  return {
    id: comment.id.toString(),
    prAuthorId: (mr.author.id as string).toString(),
    prAuthorName: mr.author.name as string,
    prAuthorAvatarUrl: mr.author.avatar_url as string,
    reviewerId: (comment.author as UserSchema).id.toString(),
    reviewerName: (comment.author as UserSchema).name,
    reviewerAvatarUrl: (comment.author as UserSchema).avatar_url,
    body: comment.body as string,
    pullRequestId: mr.id.toString(),
    pullRequestName: mr.title,
    url: getNoteUrl(mr.web_url, comment.id.toString()),
    filePath: '',
    createdAt: comment.created_at as string,
  };
}

function convertToDiscussion(mr: MergeRequestSchema, discussion: DiscussionSchema): UserDiscussion {
  return {
    id: discussion.id.toString(),
    prAuthorId: (mr.author.id as string).toString(),
    prAuthorName: mr.author.name as string,
    reviewerId: (discussion.notes ?? []).length > 0 ? (discussion.notes![0].author.id as string) : 'unknown reviewerId',
    reviewerName: (discussion.notes ?? []).length > 0 ? (discussion.notes![0].author.name as string) : 'unknown reviewerName',
    reviewerAvatarUrl: discussion.notes![0].author.avatar_url as string,
    pullRequestName: mr.title,
    url: (discussion.notes ?? []).length > 0 ? getNoteUrl(mr.web_url, discussion.notes![0].id.toString()) : mr.web_url!,
    comments: discussion.notes?.map((item) => convertToComment(mr, item)) ?? [],
  };
}

function getReadyTime(mr: MergeRequestSchema, notes: MergeRequestNoteSchema[]) {
  if (mr.work_in_progress) return undefined;

  const readyNote = notes.find((item) => item.body === 'marked this merge request as **ready**');
  return readyNote?.created_at ?? mr.created_at;
}
