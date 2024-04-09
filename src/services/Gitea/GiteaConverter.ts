import {
  User as GiteaUser,
  PullRequest as GiteaPullRequest,
  PullReviewComment as GiteaPullReviewComment,
  PullReview as GiteaPullReview,
  Repository,
  TimelineComment,
} from 'gitea-js';

import { GitConverter } from '../GitConverter';
import { RawData, PullRequest, User, Project, UserDiscussion, Comment, UserPrActivity } from '../types';
import { GiteaRawDatum } from './GiteaService';
import { groupBy, tidy } from '@tidyjs/tidy';

export class GiteaConverter implements GitConverter {
  constructor(private host: string) {}
  convert(data: RawData): { pullRequests: PullRequest[]; users: User[] } {
    return {
      pullRequests: data.pullRequests.map((datum) => convertToPullRequest(this.host, datum)),
      users: data.users.map((user) => convertToUser(this.host, user)),
    };
  }
}

export function convertToPullRequest(
  hostUrl: string,
  { pullRequest: pr, reviews, comments, timeline }: GiteaRawDatum
): PullRequest {
  const notEmptyReviews = reviews.filter((item) => !!item.body).map((review) => convertToComment(pr, review));
  const prComments = comments.map<Comment>((item) => convertToComment(pr, item));

  const reviewedBy = reviews
    .filter((item) => item.state && item.user && ['APPROVED', 'REQUEST_CHANGES', 'COMMENT'].includes(item.state))
    .map<UserPrActivity>((item) => ({
      user: convertToUser(hostUrl, item.user!),
      at: item.submitted_at!,
      activityType: getActivityType(item.state!),
    }));

  const approvedBy = reviews
    .filter((item) => item.state && item.user && item.state === 'APPROVED')
    .map<UserPrActivity>((item) => ({
      user: convertToUser(hostUrl, item.user!),
      at: item.submitted_at!,
      activityType: 'approved',
    }));

  const requestedChangesBy = reviews
    .filter((item) => item.state && item.user && item.state === 'REQUEST_CHANGES')
    .map<UserPrActivity>((item) => ({
      user: convertToUser(hostUrl, item.user!),
      at: item.submitted_at!,
      activityType: 'requested changes',
    }));

  const requestedReviewers = (pr.requested_reviewers ?? []).map((user) => convertToUser(hostUrl, user));

  return {
    id: pr.id!.toString(),
    title: pr.title ?? 'unknown title',
    targetBranch: pr.base?.label ?? 'unknown target branch',
    branchName: pr.head?.label ?? 'unknown branch name',
    url: pr.url!,
    updatedAt: pr.updated_at ?? 'unknown updated at',
    author: convertToUser(hostUrl, pr.user!),
    requestedReviewers,
    comments: [...notEmptyReviews, ...prComments],
    createdAt: pr.created_at ?? 'unknown created at',
    reviewedByUser: reviewedBy,
    approvedByUser: approvedBy,
    requestedChangesByUser: requestedChangesBy,
    mergedAt: pr.merged_at,
    discussions: convertToDiscussions(pr, comments),
    readyAt: getReadyTime(pr, timeline),
  };
}

function getActivityType(reviewState: string): UserPrActivity['activityType'] {
  switch (reviewState) {
    case 'APPROVED':
      return 'approved';
    case 'REQUEST_CHANGES':
      return 'requested changes';
    case 'COMMENT':
      return 'comment';
    default:
      throw Error('Unknown state');
  }
}

export function convertToUser(host: string, user: GiteaUser): User {
  return {
    id: user.id!.toString(),
    fullName: user.full_name!,
    userName: user.login || user.email || 'unknown userName',
    displayName: user.full_name || user.login || user.email || user.id!.toString(),
    // email: user.email!,
    avatarUrl: user.avatar_url!,
    webUrl: `${host}/${user.login}`,
    active: !!user.active,
  };
}

export function convertToProject(repository: Repository): Project {
  return {
    id: repository.id!.toString(),
    name: /*repository.full_name || */ repository.name || 'unknown name',
    avatarUrl: repository.avatar_url,
    description: repository.description,
    owner: repository.owner!.login!.toString(),
  };
}

function convertToComment(pullRequest: GiteaPullRequest, item: GiteaPullReviewComment | GiteaPullReview): Comment {
  return {
    id: item.id!.toString(),
    prAuthorId: getUserId(pullRequest.user),
    prAuthorName: getUserName(pullRequest.user),
    prAuthorAvatarUrl: pullRequest.user?.avatar_url,

    body: item.body!,
    reviewerId: item.user?.id?.toString() || 'unknown reviewerId',
    reviewerName: item.user?.full_name || item.user?.login || 'unknown reviewerName',
    pullRequestId: pullRequest.id!.toString(),
    pullRequestName: pullRequest.title!,
    url: item.html_url ?? '#',
    filePath: 'path' in item ? item.path ?? '' : '',
    createdAt: 'created_at' in item ? item.created_at! : (item as GiteaPullReview).submitted_at!,
  };
}

function getUserId(user: GiteaUser | undefined) {
  return user?.id?.toString() || 'unknown authorId';
}

function getUserName(user: GiteaUser | undefined) {
  return user?.full_name || user?.login || 'unknown authorname';
}

export function convertToDiscussions(pr: GiteaPullRequest, comments: GiteaPullReviewComment[]): UserDiscussion[] {
  const discussions = tidy(
    comments,
    groupBy(['pull_request_review_id', 'path', 'position'], groupBy.values({ flat: true }))
  ) as GiteaPullReviewComment[][];

  const result = discussions.map<UserDiscussion>((groupedComments) => {
    const comments = groupedComments.map((item) => convertToComment(pr, item));

    return {
      id: comments[0].id,
      comments,
      prAuthorId: comments[0].prAuthorId,
      prAuthorName: comments[0].prAuthorName,

      reviewerId: comments[0].reviewerId,
      reviewerName: comments[0].reviewerName,
      reviewerAvatarUrl: comments[0].reviewerAvatarUrl,

      pullRequestId: comments[0].pullRequestId,
      pullRequestName: comments[0].pullRequestName,
      pullRequestUrl: pr.url!,
      url: comments[0].url,
    };
  });

  return result;
}

function getReadyTime(pullRequest: GiteaPullRequest, timeline: TimelineComment[]): string | undefined {
  let readyTime: string | undefined = undefined;

  if (!pullRequest.title?.trim().startsWith('WIP:')) {
    const markReady = timeline.findLast(
      (item) =>
        item.type === 'change_title' && item.old_title?.trim().startsWith('WIP:') && !item.new_title?.trim().startsWith('WIP:')
    );
    readyTime = markReady?.created_at ?? pullRequest.created_at;
  }

  return readyTime;
}
