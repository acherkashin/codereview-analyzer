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
  reviewerId?: string | null,
  authorId?: string | null,
  at?: Date | null
): UserDiscussion[] {
  let filteredDiscussions = discussions;

  if (!!reviewerId) {
    filteredDiscussions = filteredDiscussions.filter((discussion) => discussion.reviewerId === reviewerId);
  }

  if (!!authorId) {
    filteredDiscussions = filteredDiscussions.filter((discussion) => discussion.prAuthorId === authorId);
  }

  if (!!at) {
    filteredDiscussions = filteredDiscussions.filter((item) => {
      const date = new Date(item.comments[0].createdAt);

      return date.getMonth() === at.getMonth() && date.getFullYear() === at.getFullYear();
    });
  }

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

export function getStartDate(prs: PullRequest[]) {
  const sorted = prs.toSorted((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return sorted[0]?.createdAt;
}

export function getEndDate(prs: PullRequest[]) {
  const sorted = prs.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return sorted[0]?.createdAt;
}
