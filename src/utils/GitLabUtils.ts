import { Gitlab } from '@gitbeaker/core/dist/types';
import { MergeRequestNoteSchema, MergeRequestSchema, DiscussionSchema } from '@gitbeaker/core/dist/types/types';

export interface UserComment {
  mergeRequest: MergeRequestSchema;
  comment: MergeRequestNoteSchema;
}

export interface UserDiscussion {
  mergeRequest: MergeRequestSchema;
  discussion: DiscussionSchema;
}

export interface AuthorReviewer {
  reviewer: string;
  author: string;
}

export interface UserCommentsOptions {
  projectId: number;
  createdAfter?: string;
  createdBefore?: string;
}

export async function searchProjects(client: Gitlab, searchText: string) {
  const projects = await client.Projects.search(searchText);
  return projects;
}

export async function getDiscussions(
  client: Gitlab,
  { projectId, createdAfter, createdBefore }: UserCommentsOptions
): Promise<UserDiscussion[]> {
  const allMrs = await client.MergeRequests.all({
    projectId,
    createdAfter,
    createdBefore,
    perPage: 100,
  });

  const mrs = allMrs.filter((item) => item.user_notes_count !== 0);
  const promises = mrs.map((mrItem) => {
    return client.MergeRequestDiscussions.all(projectId, mrItem.iid, { perPage: 100 }).then((items) => {
      const filtered = items.filter((discussion) => discussion.notes?.some((item) => !item.system));
      return filtered.map((item) => ({ mergeRequest: mrItem, discussion: item } as UserDiscussion));
    });
  });

  const allDiscussions = await Promise.allSettled(promises);

  const discussions = allDiscussions.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));

  return discussions;
}

export async function getUserComments(
  client: Gitlab,
  { projectId, createdAfter, createdBefore }: UserCommentsOptions
): Promise<UserComment[]> {
  const allMrs = await client.MergeRequests.all({
    projectId,
    createdAfter,
    createdBefore,
    perPage: 100,
  });

  const mrs = allMrs.filter((item) => item.user_notes_count !== 0);
  const promises = mrs.map((mrItem) => {
    return client.MergeRequestNotes.all(projectId, mrItem.iid, { perPage: 100 }).then((items) => {
      const userNotes = items.filter((item) => !item.system);

      return userNotes.map((item) => ({ mergeRequest: mrItem, comment: item } as UserComment));
    });
  });

  const allComments = await Promise.allSettled(promises);

  const comments = allComments.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));

  return comments;
}

export function getFilteredComments(comments: UserComment[], reviewerName: string | null, authorName: string | null) {
  let filteredComments = comments;

  if (!!reviewerName) {
    filteredComments = filteredComments.filter((item) => item.comment.author.username === reviewerName);
  }

  if (!!authorName) {
    filteredComments = filteredComments.filter((item) => item.mergeRequest.author.username === authorName);
  }

  return filteredComments;
}

export function getNoteUrl({ mergeRequest, comment }: UserComment) {
  return `${mergeRequest.web_url}/#note_${comment.id}`;
}

/**
 * Converts comments to the pair of "reviewer" and "author"
 * @param comments comments in merge requests
 * @returns pair of "reviewer" and "author"
 */
export function getAuthorReviewerFromComments(comments: UserComment[]): AuthorReviewer[] {
  return comments.map<AuthorReviewer>((item) => ({
    reviewer: item.comment.author.username,
    author: item.mergeRequest.author.username as string,
  }));
}

export function getAuthorReviewerFromDiscussions(discussions: UserDiscussion[]): AuthorReviewer[] {
  return discussions.map<AuthorReviewer>((item) => ({
    author: item.mergeRequest.author.username as string,
    reviewer: getDiscussionAuthor(item.discussion) ?? '[empty]',
  }));
}

export function getDiscussionAuthor(discussion: DiscussionSchema): string {
  return discussion?.notes?.[0]?.author.username as string;
}
