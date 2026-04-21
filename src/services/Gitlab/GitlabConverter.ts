import { GitConverter } from '../GitConverter';
import { GitlabRawDatum } from './GitlabService';
import { RawData, PullRequest, User, Comment, UserDiscussion, Project, UserPrActivity } from '../types';
import {
  UserSchema,
  ProjectSchema,
  MergeRequestDiffSchema,
  MergeRequestNoteSchema,
  MergeRequestSchema,
  DiscussionSchema,
  DiscussionNoteSchema,
} from '@gitbeaker/rest';
import { groupBy, tidy } from '@tidyjs/tidy';
import dayjs from 'dayjs';

export class GitlabConverter implements GitConverter {
  convert({ pullRequests, users }: RawData): { pullRequests: PullRequest[]; users: User[] } {
    return {
      pullRequests: pullRequests.map(convertToPullRequest),
      users: users.map(convertToUser),
    };
  }
}

export function convertToPullRequest({
  projectName,
  mergeRequest: mr,
  notes: comments,
  discussions,
  approvalsConfiguration,
  changes,
}: GitlabRawDatum): PullRequest {
  // some notes are left by gitlab, so we need to filter them out
  const notSystemComments = comments.filter((item) => !item.system);
  const notSystemDiscussions = discussions.filter((discussion) => discussion.notes?.some((item) => !item.system));
  const convertedDiscussions = notSystemDiscussions.map((item) => convertToDiscussion(mr, item)).filter((item) => item.comments.length > 0);
  const reviewCommentCount =
    notSystemComments.length + convertedDiscussions.reduce((total, discussion) => total + discussion.comments.length, 0);
  const linesChanged = getDiffStats(changes);

  const notAuthorDiscussions = notSystemDiscussions.filter(
    (item) => item.notes != null && item.notes.length > 0 && item.notes[0].author.id !== mr.author.id
  );
  // need to group by pull request and date of creation of discussion
  const groupedDiscussions = tidy(
    notAuthorDiscussions,
    groupBy((item) => dayjs(item.notes![0].created_at).format('YYYY-MM-DD'), groupBy.entriesObject())
  ) as Array<{ key: string; values: DiscussionSchema[] }>;

  const reviews = groupedDiscussions.map<UserPrActivity>(({ key, values }) => ({
    at: key,
    user: convertToUser(values![0].notes![0].author),
    activityType: 'comment',
  }));

  const approvedBy = (approvalsConfiguration.approved_by ?? []).map<UserPrActivity>((item) => {
    const createdAt = comments.findLast(
      (comment) => comment.body === 'approved this merge request' && comment.author.id === item.user.id
    )!.created_at;

    return {
      at: dayjs(createdAt).format('YYYY-MM-DD'),
      user: convertToUser(item.user),
      activityType: 'approved',
    };
  });

  const reviewedByUser = [...reviews, ...approvedBy];

  return {
    id: mr.id.toString(),
    title: mr.title,
    repositoryName: projectName,
    branchName: mr.source_branch,
    url: mr.web_url,
    targetBranch: mr.target_branch,
    status: getPullRequestStatus(mr),
    updatedAt: mr.updated_at,
    createdAt: mr.created_at,
    author: convertToUser(mr.author as any),
    requestedReviewers: (mr.reviewers ?? []).map((item) => convertToUser(item)),
    comments: notSystemComments.map<Comment>((item) => convertToComment(mr, item)),
    reviewedByUser: reviewedByUser,
    approvedByUser: approvedBy,
    // In Gitlab there is no special state for "Requested Changes"
    requestedChangesByUser: [],
    mergedAt: mr.merged_at || undefined,
    discussions: convertedDiscussions,
    readyAt: getReadyTime(mr, comments),
    changedFilesCount: changes?.length ?? 0,
    linesAdded: linesChanged.linesAdded,
    linesRemoved: linesChanged.linesRemoved,
    discussionCount: convertedDiscussions.length,
    reviewCommentCount,
    unresolvedDiscussionCount: convertedDiscussions.filter((item) => item.isResolved === false).length,
  };
}

export function convertToComment(mr: MergeRequestSchema, comment: MergeRequestNoteSchema | DiscussionNoteSchema): Comment {
  return {
    id: comment.id.toString(),
    prAuthorId: mr.author.id.toString(),
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
  const notes = (discussion.notes ?? []).filter((item) => !item.system);

  return {
    id: discussion.id.toString(),
    pullRequestId: mr.id.toString(),
    pullRequestUrl: mr.web_url,
    prAuthorId: mr.author.id.toString(),
    prAuthorName: mr.author.name as string,
    reviewerId: notes.length > 0 ? notes[0].author.id.toString() : 'unknown reviewerId',
    reviewerName: notes.length > 0 ? notes[0].author.name : 'unknown reviewerName',
    reviewerAvatarUrl: notes[0]?.author.avatar_url as string,
    pullRequestName: mr.title,
    url: notes.length > 0 ? getNoteUrl(mr.web_url, notes[0].id.toString()) : mr.web_url!,
    comments: notes.map((item) => convertToComment(mr, item)),
    isResolved: typeof discussion.resolved === 'boolean' ? discussion.resolved : undefined,
  };
}

function getPullRequestStatus(mr: MergeRequestSchema): PullRequest['status'] {
  if (mr.merged_at) {
    return 'merged';
  }

  if (mr.state === 'closed') {
    return 'closed';
  }

  return 'open';
}

function getDiffStats(changes: MergeRequestDiffSchema[] | undefined) {
  return (changes ?? []).reduce(
    (total, change) => {
      const stats = getDiffLineStats(change.diff as string | undefined);

      return {
        linesAdded: total.linesAdded + stats.linesAdded,
        linesRemoved: total.linesRemoved + stats.linesRemoved,
      };
    },
    { linesAdded: 0, linesRemoved: 0 }
  );
}

function getDiffLineStats(diff?: string) {
  if (!diff) {
    return { linesAdded: 0, linesRemoved: 0 };
  }

  return diff.split('\n').reduce(
    (total, line) => {
      if (line.startsWith('+++') || line.startsWith('---')) {
        return total;
      }

      if (line.startsWith('+')) {
        total.linesAdded += 1;
      } else if (line.startsWith('-')) {
        total.linesRemoved += 1;
      }

      return total;
    },
    { linesAdded: 0, linesRemoved: 0 }
  );
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
    avatarUrl: project.avatar_url || undefined,
    description: project.description,
  };
}

export function getNoteUrl(mrUrl: string, commentId: string) {
  return `${mrUrl}/#note_${commentId}`;
}
