import { BarDatum, BarSvgProps } from '@nivo/bar';
import { AuthorReviewer, getAuthorReviewerFromComments, getAuthorReviewerFromDiscussions, UserDiscussion } from './GitLabUtils';
import { arrange, asc, distinct, groupBy, sum, summarize, tidy, filter, n } from '@tidyjs/tidy';
import { Comment, PullRequest, User } from './../clients/types';

interface ReviewBarDatum extends BarDatum {
  userName: string;
  total: number;
}

export interface ReviewBarChartSettings<T = BarDatum> {
  indexBy: string;
  keys: string[];
  data: T[];
}

export function convertToDiscussionsLeft(discussions: UserDiscussion[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  return convertToItemsLeft(rawData);
}

export function convertToDiscussionsReceived(discussions: UserDiscussion[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  return convertToItemsReceived(rawData);
}

export function convertToCommentsLeft(comments: Comment[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return convertToItemsLeft(rawData);
}

export function convertToCommentsReceived(comments: Comment[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return convertToItemsReceived(rawData);
}

export function convertToFilesCommented(comments: Comment[]): ReviewBarChartSettings {
  const paths = comments.filter((item) => !!item.filePath).map((item) => ({ filePath: item.filePath }));
  const authors = tidy(comments, distinct(['reviewerName'])).map((item) => item.reviewerName);
  const extensions = tidy(
    paths.map((item) => ({ extension: getFileExtension(item.filePath) })),
    distinct(['extension'])
  );

  /**
   * Array consist of the following objects
   * [{
   *   "Alexander Cherkashin": 1,
   *   "Vasya Pupkin": 2,
   *   total: 3,
   *   extension: "ts",
   * }, ...]
   */
  const data = extensions.map(({ extension }) => {
    // only comments for current extension
    const extensionComments = tidy(
      comments,
      filter((i) => getFileExtension(i.filePath) == extension)
    );

    const reviewerComments = tidy(
      extensionComments,
      groupBy('reviewerName', [summarize({ total: n() })]),
      arrange([asc('total')])
    );

    const result = reviewerComments.reduce((acc, { reviewerName, total }) => {
      acc[reviewerName] = total;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...result,
      extension: extension,
      total: extensionComments.length,
    };
  });

  // const data = tidy(extensions, groupBy('extension', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    indexBy: 'extension',
    keys: authors,
    data,
  };
}

export function convertToPullRequestCreated(pullRequests: PullRequest[]) {
  const rawData = pullRequests.map((item) => ({ userName: item.author.fullName || item.author.userName }));

  const data = tidy(rawData, groupBy('userName', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    indexBy: 'userName',
    keys: ['total'],
    data,
  };
}

export function convertToCommentsReceivedFromUsers(comments: Comment[], userId: string): ReviewBarChartSettings {
  const commentsToAuthor = comments.filter((item) => item.prAuthorId === userId);
  const rawData = getAuthorReviewerFromComments(commentsToAuthor).filter((item) => item.reviewer !== item.author);

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
    const reviewRequestedCount = pullRequests.filter((pr) => (pr.requestedReviewers ?? []).some((i) => i.id === item.id)).length;

    const reviewedPrs = pullRequests.filter((pr) => (pr.reviewedByUserIds ?? []).some((id) => id === item.id));
    const reviewedCount = reviewedPrs.length;

    const approvedPrs = pullRequests.filter((pr) => (pr.approvedByUserIds ?? []).some((id) => id === item.id));
    const approvedCount = approvedPrs.length;

    const requestedChangesPrs = pullRequests.filter((pr) => (pr.requestedChangesByUserIds ?? []).some((id) => id === item.id));
    const requestedChangesCount = requestedChangesPrs.length;

    return {
      userId: item.id,
      userAvatarUrl: item.avatarUrl,
      userName: (item.userName = item.fullName || item.userName),
      reviewRequestedCount,
      // reviewedPrs,
      reviewedCount,
      approvedCount,
      requestedChangesCount,
    };
  });

  const resultData = rawData.filter((item) => item.reviewRequestedCount > 0);

  resultData.sort((a, b) => b.reviewedCount - a.reviewedCount);

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
function getStatisticForUser(rawData: AuthorReviewer[], userType: 'author' | 'reviewer', userName: string): ReviewBarDatum {
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

  const commentsSum = tidy(
    commentsPerUser,
    summarize({
      total: sum('total'),
    })
  );
  const barDatum: ReviewBarDatum = { userName, total: commentsSum[0].total };

  commentsPerUser.forEach((comment) => {
    barDatum[comment[groupByUserType]] = comment.total;
  });

  return barDatum;
}

function convertToItemsLeft(items: AuthorReviewer[]): ReviewBarChartSettings<ReviewBarDatum> {
  const reviewers = tidy(items, distinct(['reviewer'])).map((item) => item.reviewer);
  const authors = tidy(items, distinct(['author'])).map((item) => item.author);

  let barData = reviewers.map((userName) => {
    return getStatisticForUser(items, 'reviewer', userName);
  });

  /**
   * Array consist of the following objects
   * [{
   *   "Alexander Cherkashin": 1, //several authors
   *   "Natasha Petrova": 2,
   *   total: 3,
   *   userName: "Vasya Pupkin",
   * }, ...]
   */
  barData = tidy(barData, arrange([asc('total')]));

  return {
    indexBy: 'userName',
    keys: authors,
    data: barData,
  };
}

function convertToItemsReceived(items: AuthorReviewer[]): ReviewBarChartSettings<ReviewBarDatum> {
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
function getFileExtension(filename: string) {
  // The >>> 0 is a bitwise operation that ensures that the value returned by lastIndexOf is always a non-negative integer, even if the filename does not contain a period. This is done because the slice method expects a non-negative integer as its start position.
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}
