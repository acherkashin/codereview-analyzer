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

  const comments = await getCommentsForMergeRequests(client, projectId, allMrs);

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

export interface MergeRequestForPage {
  item: MergeRequestWithNotes;
  readyTime: string;
  readyPeriod: TimeSpan;
}

//TODO: rename somehow
export async function getReadyMergeRequestsForPage(client: Gitlab, projectId: number): Promise<MergeRequestForPage[]> {
  const mrs = await getReadyMergeRequests(client, projectId);
  console.log(mrs);

  return mrs
    .map((item) => {
      return {
        item,
        readyTime: getReadyTime(item),
        readyPeriod: timeSince(new Date(getReadyTime(item))),
      };
    })
    .sort((item1, item2) => item2.readyPeriod._milliseconds - item1.readyPeriod._milliseconds);
}

function getReadyTime(mr: MergeRequestWithNotes) {
  const readyNote = mr.notes.find((item) => item.body === 'marked this merge request as **ready**');
  return readyNote?.created_at ?? mr.mergeRequest.created_at;
}

// https://stackoverflow.com/questions/14297625/work-with-a-time-span-in-javascript
interface TimeSpan {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  _years: number;
  _days: number;
  _hours: number;
  _minutes: number;
  _seconds: number;
  _milliseconds: number;
}

function timeSince(when: Date): TimeSpan {
  // this ignores months
  const obj: TimeSpan = {} as any;
  obj._milliseconds = new Date().valueOf() - when.valueOf();
  obj.milliseconds = obj._milliseconds % 1000;
  obj._seconds = (obj._milliseconds - obj.milliseconds) / 1000;
  obj.seconds = obj._seconds % 60;
  obj._minutes = (obj._seconds - obj.seconds) / 60;
  obj.minutes = obj._minutes % 60;
  obj._hours = (obj._minutes - obj.minutes) / 60;
  obj.hours = obj._hours % 24;
  obj._days = (obj._hours - obj.hours) / 24;
  obj.days = obj._days % 365;
  // finally
  obj.years = (obj._days - obj.days) / 365;
  return obj;
}
