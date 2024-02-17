import { User, Client, Project, AnalyzeParams, PullRequest, Comment } from './types';
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

  async analyze(params: AnalyzeParams): Promise<PullRequest[]> {
    const mergeRequests = await getMergeRequests(this.api, params);

    const mrs = await getMergeRequestsWithComments(this.api, parseInt(params.project.id), mergeRequests);
    return mrs;
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

export function getNoteUrl({ mergeRequest, comment }: UserComment) {
  return `${mergeRequest.web_url}/#note_${comment.id}`;
}

async function getMergeRequestsWithComments(
  client: GitlabType,
  projectId: number,
  allMrs: MergeRequestSchema[]
): Promise<PullRequest[]> {
  const mrs = allMrs.filter((item) => item.user_notes_count !== 0);

  const promises = mrs.map((mrItem) => {
    return client.MergeRequestNotes.all(projectId, mrItem.iid, { perPage: 100 }).then((userNotes) => {
      const comments = userNotes.filter((item) => !item.system);
      return convertToPullRequest(mrItem, comments);
    });
  });

  const allComments = await Promise.allSettled(promises);

  const comments = allComments.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));

  return comments;
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

function convertToPullRequest(mr: MergeRequestSchema, comments: MergeRequestNoteSchema[]): PullRequest {
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
    comments: comments.map<Comment>((item) => ({
      id: item.id.toString(),
      prAuthorId: (mr.author.id as string).toString(),
      prAuthorName: mr.author.name as string,
      prAuthorAvatarUrl: mr.author.avatar_url as string,
      reviewerId: item.author.id.toString(),
      reviewerName: item.author.name,
      body: item.body,
      pullRequestId: mr.id.toString(),
      pullRequestName: mr.title,
      url: getNoteUrl({ mergeRequest: mr, comment: item }),
      filePath: '',
      createdAt: item.created_at,
    })),
    //TODO: implement
    reviewedByUserIds: [],
    approvedByUserIds: [],
    requestedChangesByUserIds: [],
    mergedAt: mr.merged_at,
    discussions: [],
  };
}
