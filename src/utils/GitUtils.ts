import { Comment, UserDiscussion, PullRequest } from '../services/types';

export interface AuthorReviewer {
  reviewer: string;
  author: string;
}

export function getFilteredComments(comments: Comment[], reviewerName: string | null, authorName: string | null): Comment[] {
  let filteredComments = comments;

  if (!!reviewerName) {
    filteredComments = filteredComments.filter((item) => item.reviewerName === reviewerName);
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
