import { GitConverter } from '../GitConverter';
import { GitlabRawDatum } from './GitlabService';
import { RawData, PullRequest, User, Comment, UserDiscussion, Project } from '../types';
import {
  UserSchema,
  ProjectSchema,
  MergeRequestNoteSchema,
  MergeRequestSchema,
  DiscussionSchema,
  DiscussionNote,
} from '@gitbeaker/core/dist/types/types';

export class GitlabConverter implements GitConverter {
  convert({ pullRequests, users }: RawData): { pullRequests: PullRequest[]; users: User[] } {
    return {
      pullRequests: pullRequests.map(convertToPullRequest),
      users: users.map(convertToUser),
    };
  }
}

export function convertToPullRequest({ mergeRequest: mr, notes: comments, discussions }: GitlabRawDatum): PullRequest {
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

export function convertToComment(mr: MergeRequestSchema, comment: MergeRequestNoteSchema | DiscussionNote): Comment {
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

export function convertToDiscussion(mr: MergeRequestSchema, discussion: DiscussionSchema): UserDiscussion {
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

export function convertToUser(user: Pick<UserSchema, 'id' | 'name' | 'username' | 'avatar_url' | 'web_url' | 'state'>): User {
  return {
    id: user.id!.toString(),
    fullName: user.name!,
    userName: user.username,
    avatarUrl: user.avatar_url!,
    webUrl: user.web_url,
    active: user.state !== 'blocked',
    displayName: user.name || user.username || user.id!.toString(),
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
