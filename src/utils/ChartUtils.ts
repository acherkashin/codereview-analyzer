import type { BarDatum } from '@nivo/bar';
import { AuthorReviewer, getAuthorReviewerFromComments } from './GitUtils';
import { arrange, asc, distinct, groupBy, sum, summarize, tidy, filter, n } from '@tidyjs/tidy';
import { Comment, PullRequest, User, UserDiscussion } from '../services/types';
import { TimeSpan, timeSince } from './TimeSpanUtils';
import { toPercent } from './PercentUtils';

export interface ReviewBarDatum extends BarDatum {
  userName: string;
  total: number;
}

export interface ReviewBarChartSettings<T = BarDatum> {
  indexBy: string;
  keys: string[];
  data: T[];
}

export function convertToCommentsReceivedFromUsers(comments: Comment[], userId: string): ReviewBarChartSettings {
  const commentsToAuthor = comments.filter((item) => item.prAuthorId === userId);
  const rawData = getAuthorReviewerFromComments(commentsToAuthor);

  const data = tidy(rawData, groupBy('reviewer', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    indexBy: 'reviewer',
    keys: ['total'],
    data,
  };
}

export function convertToCommentsLeftToUsers(comment: Comment[], userId: string): ReviewBarChartSettings {
  const commentsFromAuthor = comment.filter((item) => item.reviewerId === userId);
  const rawData = getAuthorReviewerFromComments(commentsFromAuthor).filter((item) => item.author !== item.reviewer);

  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    indexBy: 'author',
    keys: ['total'],
    data,
  };
}

/**
 * Chart shows how many users get pull requests assigned and how many of them he reviews
 */
export function getReviewDataByUser(users: User[], pullRequests: PullRequest[]) {
  const rawData = users.map((item) => {
    const notUserPrs = pullRequests.filter((pr) => pr.author.id !== item.id);
    const reviewRequestedCount = notUserPrs.filter((pr) => (pr.requestedReviewers ?? []).some((i) => i.id === item.id)).length;

    const reviewedPrs = notUserPrs.filter((pr) => (pr.reviewedByUser ?? []).some(({ user }) => user.id === item.id));
    const reviewedCount = reviewedPrs.length;

    const approvedPrs = notUserPrs.filter((pr) => (pr.approvedByUser ?? []).some(({ user }) => user.id === item.id));
    const approvedCount = approvedPrs.length;

    const requestedChangesPrs = notUserPrs.filter((pr) =>
      (pr.requestedChangesByUser ?? []).some(({ user }) => user.id === item.id)
    );
    const requestedChangesCount = requestedChangesPrs.length;

    return {
      userId: item.id,
      userAvatarUrl: item.avatarUrl,
      userName: (item.userName = item.fullName || item.userName),
      Assigned: reviewRequestedCount,
      // reviewedPrs,
      Reviewed: reviewedCount,
      Approved: approvedCount,
      'Requested Changes': requestedChangesCount,
    };
  });

  const resultData = rawData.filter((item) => item.Assigned > 0);

  resultData.sort((a, b) => b.Assigned - a.Assigned);

  return resultData;
}

/**
 * Returns statistic for the user. How many comments/discussions he has received/left.
 *
 * @param rawData pair of "author" and "reviewer"
 * @param userType user can be either "author" or "reviewer". So if we need get data for @param userName, when he is "author" (comments/discussions left) - we need to pass "author" string
 * @param userName name of the user to get data for
 * @returns statistic for the user
 */
export function getStatisticForUser(
  rawData: AuthorReviewer[],
  userType: 'author' | 'reviewer',
  userName: string
): ReviewBarDatum {
  const { datum, commentsPerUser } = getStatisticForUserDatum(rawData, userType, userName);
  const commentsSum = tidy(
    commentsPerUser,
    summarize({
      total: sum('total'),
    })
  );
  const barDatum: ReviewBarDatum = { ...datum, userName, total: commentsSum[0].total };

  return barDatum;
}

/**
 * Returns how many comments left by user
 */
export function getCommentsLeftByUser(rawData: AuthorReviewer[], userName: string): Array<{ author: string; total: number }> {
  const { commentsPerUser } = getStatisticForUserDatum(rawData, 'reviewer', userName);
  return commentsPerUser;
}

/**
 * Returns how many comments received by user
 */
export function getCommentsReceivedByUser(
  rawData: AuthorReviewer[],
  userName: string
): Array<{ reviewer: string; total: number }> {
  const { commentsPerUser } = getStatisticForUserDatum(rawData, 'author', userName);
  return commentsPerUser;
}

export function getStatisticForUserDatum(rawData: AuthorReviewer[], userType: 'author' | 'reviewer', userName: string) {
  // get only data for specified user
  const commentsReceived = tidy(
    rawData,
    filter((data) => data[userType] === userName)
  );

  const groupByUserType = userType === 'author' ? 'reviewer' : 'author';

  // group either by "review" or "author" and summarize how many comments user left/received
  // we will get either {reviewer: string, total: number}[] or {author: string, total: number}[]
  // it depends on what userType we passed
  const commentsPerUser = tidy(
    commentsReceived,
    groupBy([groupByUserType], [summarize({ total: n() })]),
    filter((data) => data.total !== 0)
  );

  const barDatum: BarDatum = {};

  commentsPerUser.forEach((comment) => {
    barDatum[comment[groupByUserType]] = comment.total;
  });

  return { datum: barDatum, commentsPerUser };
}

/**
 * return array (data) that consist of the following objects
 * [{
 *   "Alexander Cherkashin": 1, //several authors
 *   "Natasha Petrova": 2,
 *   total: 3,
 *   userName: "Vasya Pupkin",
 * }, ...]
 */
export function getItemsLeft(items: AuthorReviewer[]): { data: ReviewBarDatum[]; authors: string[] } {
  const reviewers = tidy(items, distinct(['reviewer'])).map((item) => item.reviewer);
  const authors = tidy(items, distinct(['author'])).map((item) => item.author);

  let data = reviewers.map((userName) => {
    return getStatisticForUser(items, 'reviewer', userName);
  });

  data = tidy(data, arrange([asc('total')]));

  return {
    authors,
    data,
  };
}

export function getItemsReceived(items: AuthorReviewer[]): ReviewBarChartSettings<ReviewBarDatum> {
  const reviewers = tidy(items, distinct(['reviewer'])).map((item) => item.reviewer);
  const authors = tidy(items, distinct(['author'])).map((item) => item.author);

  let barData = authors.map((userName) => {
    return getStatisticForUser(items, 'author', userName);
  });

  barData = tidy(barData, arrange([asc('total')]));

  return {
    indexBy: 'userName',
    keys: reviewers,
    data: barData,
  };
}

/**
 * The getFileExtension function takes a filename as input and returns the file extension of the filename.
 * If the filename contains a period, the function uses the lastIndexOf method to find the last occurrence of
 * the period and then extracts the substring starting from that position plus 2.
 * This assumes that the file extension is always after the last period in the filename.
 */
export function getFileExtension(filename: string) {
  // The >>> 0 is a bitwise operation that ensures that the value returned by lastIndexOf is always a non-negative integer, even if the filename does not contain a period. This is done because the slice method expects a non-negative integer as its start position.
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function getLongestPullRequest(prs: PullRequest[]): PullRequest | null {
  const merged = prs.filter((item) => item.mergedAt != null);

  if (merged.length === 0) {
    return null;
  }

  const mergedSorted = merged.toSorted((a, b) => getInProgressTime(b)._milliseconds - getInProgressTime(a)._milliseconds);

  return mergedSorted[0];
}

export function getLongestDiscussions(prs: PullRequest[], count: number, user?: User | null): UserDiscussion[] {
  let discussions = prs.flatMap((item) => item.discussions);

  if (user) {
    discussions = discussions.filter((item) => item.reviewerId === user?.id);
  }

  const longestDiscussions = discussions.sort((a, b) => b.comments.length - a.comments.length);
  const topN = longestDiscussions.slice(0, count);

  return topN;
}

export function getInProgressTime(pr1: PullRequest): TimeSpan {
  return timeSince(new Date(pr1.createdAt), new Date(pr1.mergedAt!));
}

export type BarDataProvider = (prs: PullRequest[], userId: string) => Record<string, number>;

export function getBarChartData(pullRequests: PullRequest[], users: User[], provider: BarDataProvider) {
  const data = users
    .map((item) => {
      const approves = provider(pullRequests, item.id);
      const total = Object.values(approves).reduce((acc, value) => acc + value, 0);

      return {
        ...approves,
        total,
        approverName: item.displayName,
      };
    })
    .filter((item) => item.total > 0)
    .toSorted((a, b) => a.total - b.total);

  const authors = users.map((item) => item.displayName);

  return {
    data,
    authors,
  };
}

/**
 * Calculates probability that someone will review your PR if you assign it to him
 */
export function getReviewRation(pullRequests: PullRequest[]) {
  let reviewRequestCount = 0;
  let reviewedCount = 0;

  // We go through all pull request, find every user that set as a reviewer and check whether he review it
  pullRequests.forEach((pr) => {
    const reviewerIds = pr.requestedReviewers.map((item) => item.id);
    reviewRequestCount += reviewerIds.length;

    // In gitlab user can approve PR, and don't be in "reviewers" list, we are not interested in them here.
    // In gitea user that approved PR automatically added to approvers.
    const reviewedBy = pr.reviewedByUser.filter(({ user }) => reviewerIds.includes(user.id));
    reviewedCount += reviewedBy.length;
  });

  return toPercent(reviewedCount, reviewRequestCount);
}

/**
 * Calculates review ration for specified reviewer
 */
export function getReviewRationForUser(pullRequests: PullRequest[], reviewerId: string) {
  //TODO: reuse getReviewDataByUser here
  let reviewRequestCount = 0;
  let approversCount = 0;

  pullRequests.forEach((pr) => {
    if (pr.author.id === reviewerId) {
      return;
    }

    if (pr.requestedReviewers.some((item) => item.id === reviewerId)) {
      reviewRequestCount += 1;

      if (pr.reviewedByUser.some(({ user }) => user.id === reviewerId)) {
        approversCount += 1;
      }
    }
  });

  return toPercent(approversCount, reviewRequestCount);
}
