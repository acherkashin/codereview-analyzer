import { Gitlab } from '@gitbeaker/core/dist/types';
import {
  UserSchema,
  MergeRequestNoteSchema,
  MergeRequestSchema,
  MergeRequestLevelMergeRequestApprovalSchema,
} from '@gitbeaker/core/dist/types/types';
import { timeSince, TimeSpan } from './TimeSpanUtils';
import { Resources } from '@gitbeaker/core';
import { Comment, UserDiscussion, PullRequest } from './../clients/types';

export interface UserComment {
  mergeRequest: MergeRequestSchema;
  comment: MergeRequestNoteSchema;
}

export interface AuthorReviewer {
  reviewer: string;
  author: string;
}

export interface BaseRequestOptions {
  projectId: number;
  createdAfter?: string;
  createdBefore?: string;
}

export async function getMergeRequestsToReview(
  client: Gitlab,
  { projectId, createdAfter, createdBefore, reviewer }: BaseRequestOptions & { reviewer: string }
): Promise<MergeRequestSchema[]> {
  return await client.MergeRequests.all({
    projectId,
    createdAfter,
    createdBefore,
    perPage: 100,
    reviewerUsername: reviewer,
  });
}

// export async function getDiscussions(
//   client: Gitlab,
//   projectId: number,
//   mergeRequests: MergeRequestSchema[]
// ): Promise<UserDiscussion[]> {
//   const filteredMrs = mergeRequests.filter((item) => item.user_notes_count !== 0);
//   const promises = filteredMrs.map((mrItem) => {
//     return client.MergeRequestDiscussions.all(projectId, mrItem.iid, { perPage: 100 }).then((items) => {
//       const filtered = items.filter((discussion) => discussion.notes?.some((item) => !item.system));
//       return filtered.map((item) => ({ mergeRequest: mrItem, discussion: item } as UserDiscussion));
//     });
//   });

//   const allDiscussions = await Promise.allSettled(promises);

//   const discussions = allDiscussions.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));

//   return discussions;
// }

export async function getUserComments(client: Gitlab, projectId: number, mrs: MergeRequestSchema[]): Promise<UserComment[]> {
  const comments = await getCommentsForMergeRequests(client, projectId, mrs);

  return comments.filter((item) => !item.comment.system);
}

async function getCommentsForMergeRequests(client: Gitlab, projectId: number, allMrs: MergeRequestSchema[]) {
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

// TODO: move to appropriate place
export function getFilteredComments(comments: Comment[], reviewerName: string | null, authorName: string | null): Comment[] {
  let filteredComments = comments;

  if (!!reviewerName) {
    filteredComments = filteredComments.filter(({ reviewerName }) => reviewerName === reviewerName);
  }

  if (!!authorName) {
    filteredComments = filteredComments.filter(({ prAuthorName }) => prAuthorName === authorName);
  }

  filteredComments = filteredComments.filter(({ prAuthorName, reviewerName }) => prAuthorName !== reviewerName);

  return filteredComments;
}

export function getFilteredDiscussions(
  discussions: UserDiscussion[],
  reviewerName: string | null,
  authorName: string | null
): UserDiscussion[] {
  let filteredDiscussions = discussions;

  if (!!reviewerName) {
    filteredDiscussions = filteredDiscussions.filter((discussion) => discussion.reviewerName === reviewerName);
  }

  if (!!authorName) {
    filteredDiscussions = filteredDiscussions.filter((discussion) => discussion.prAuthorName === authorName);
  }

  filteredDiscussions = filteredDiscussions.filter((discussion) => discussion.reviewerId !== discussion.prAuthorId);

  return filteredDiscussions;
}

/**
 * Converts comments to the pair of "reviewer" and "author"
 * @param comments comments in merge requests
 * @returns pair of "reviewer" and "author"
 */
export function getAuthorReviewerFromComments(comments: Comment[]): AuthorReviewer[] {
  return comments.map<AuthorReviewer>((item) => ({
    author: item.prAuthorName,
    reviewer: item.reviewerName,
  }));
}

export function getAuthorReviewerFromDiscussions(discussions: UserDiscussion[]): AuthorReviewer[] {
  return discussions.map<AuthorReviewer>((item) => ({
    author: item.prAuthorName,
    reviewer: item.reviewerName,
  }));
}

export function getAuthorReviewerFromMergeRequests(mrs: PullRequest[]): AuthorReviewer[] {
  return mrs.flatMap<AuthorReviewer>((mr) =>
    (mr.requestedReviewers ?? []).map<AuthorReviewer>((reviewer) => ({
      author: mr.author.userName,
      reviewer: reviewer.userName,
    }))
  );
}

export interface MergeRequestWithNotes {
  mergeRequest: MergeRequestSchema;
  notes: MergeRequestNoteSchema[];
}

export async function getReadyMergeRequests(client: Gitlab, projectId: number): Promise<MergeRequestWithNotes[]> {
  const mrs = await client.MergeRequests.all({
    projectId,
    state: 'opened',
    wip: 'no',
  });

  const promises = mrs.map(async (mrItem) => {
    const notes = await client.MergeRequestNotes.all(projectId, mrItem.iid, { perPage: 100 });
    return { mergeRequest: mrItem, notes };
  });

  const allComments = await Promise.allSettled(promises);
  const comments = allComments.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));

  return comments;
}

export interface MergeRequestWithApprovals {
  mergeRequest: MergeRequestSchema;
  approvals: MergeRequestLevelMergeRequestApprovalSchema;
}

export function getMergeRequestsWithApprovals(
  client: Resources.Gitlab,
  projectId: number,
  mrs: MergeRequestSchema[]
): Promise<MergeRequestWithApprovals[]> {
  return Promise.all(
    mrs.map((mr) =>
      client.MergeRequestApprovals.configuration(projectId, {
        mergerequestIid: mr.iid,
      }).then((approvals) => ({
        mergeRequest: mr,
        approvals,
      }))
    )
  );
}
