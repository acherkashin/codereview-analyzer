import { BarDatum } from '@nivo/bar';
import {
  AuthorReviewer,
  getAuthorReviewerFromComments,
  getAuthorReviewerFromDiscussions,
  UserComment,
  UserDiscussion,
} from './GitLabUtils';
import { arrange, asc, distinct, groupBy, sum, summarize, tidy, filter, n } from '@tidyjs/tidy';

interface ReviewBarDatum extends BarDatum {
  userName: string;
  total: number;
}

interface ReviewBarChartSettings<T = BarDatum> {
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

export function convertToCommentsLeft(comments: UserComment[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return convertToItemsLeft(rawData);
}

export function convertToCommentsReceived(comments: UserComment[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromComments(comments).filter((item) => item.reviewer !== item.author);
  return convertToItemsReceived(rawData);
}

export function convertToCommentsReceivedFromUsers(comments: UserComment[], userId: number): ReviewBarChartSettings {
  const rawData = getAuthorReviewerFromComments(comments.filter((item) => item.mergeRequest.author.id === userId)).filter(
    (item) => item.reviewer !== item.author
  );

  const data = tidy(rawData, groupBy('reviewer', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    indexBy: 'reviewer',
    keys: ['total'],
    data,
  };
}

export function convertToCommentsLeftToUsers(comment: UserComment[], userId: number): ReviewBarChartSettings {
  const rawData = getAuthorReviewerFromComments(comment.filter((item) => item.comment.author.id === userId)).filter(
    (item) => item.author !== item.reviewer
  );

  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    indexBy: 'author',
    keys: ['total'],
    data,
  };
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
