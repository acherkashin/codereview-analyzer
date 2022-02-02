import { BarDatum } from '@nivo/bar';
import { UserComment, UserDiscussion } from './GitLabUtils';
import { arrange, asc, distinct, groupBy, sum, summarize, tidy, filter, n } from '@tidyjs/tidy';

interface ReviewBarDatum extends BarDatum {
  userName: string;
  total: number;
}

interface AuthorReviewer {
  reviewer: string;
  author: string;
}

interface ReviewBarChartSettings<T = BarDatum> {
  indexBy: string;
  keys: string[];
  data: T[];
}

export function convertToCommentsReceivedPieChart(comments: UserComment[]) {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map((item) => ({
    id: item.author,
    label: item.author,
    value: item.total,
  }));

  return data;
}

export function convertToDiscussionsLeft(discussions: UserDiscussion[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = discussions
    .map(
      (item) =>
        ({
          author: item.mergeRequest.author.username as string,
          reviewer: (item.discussion?.notes?.[0]?.author.username as string) ?? '[empty]',
        } as AuthorReviewer)
    )
    .filter((item) => item.reviewer !== item.author);

  return convertToItemsLeft(rawData);
}

export function convertToDiscussionsReceived(discussions: UserDiscussion[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = discussions
    .map(
      (item) =>
        ({
          author: item.mergeRequest.author.username as string,
          reviewer: (item.discussion?.notes?.[0]?.author.username as string) ?? '[empty]',
        } as AuthorReviewer)
    )
    .filter((item) => item.reviewer !== item.author);

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

function getDataForUser(rawData: AuthorReviewer[], userType: 'author' | 'reviewer', userName: string): ReviewBarDatum {
  const groupByUserType = userType === 'author' ? 'reviewer' : 'author';

  const commentsReceived = tidy(
    rawData,
    filter((data) => data[userType] === userName)
  );

  const commentsPerUser = tidy(
    commentsReceived,
    groupBy([groupByUserType], [summarize({ total: n() })]),
    filter((data) => data.total !== 0)
  );

  const barDatum: ReviewBarDatum = {
    userName,
    total: tidy(
      commentsPerUser,
      summarize({
        total: sum('total'),
      })
    )[0].total,
  };
  commentsPerUser.forEach((comment) => {
    barDatum[comment[groupByUserType]] = comment.total;
  });

  return barDatum;
}

function convertToItemsLeft(items: AuthorReviewer[]): ReviewBarChartSettings<ReviewBarDatum> {
  const reviewers = tidy(items, distinct(['reviewer'])).map((item) => item.reviewer);
  const authors = tidy(items, distinct(['author'])).map((item) => item.author);

  let barData = reviewers.map((userName) => {
    return getDataForUser(items, 'reviewer', userName);
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
    return getDataForUser(items, 'author', userName);
  });

  barData = tidy(barData, arrange([asc('total')]));

  return {
    indexBy: 'userName',
    keys: reviewers,
    data: barData,
  };
}

function getAuthorReviewerFromComments(comments: UserComment[]) {
  return comments.map<AuthorReviewer>((item) => ({
    reviewer: item.comment.author.username,
    author: item.mergeRequest.author.username as string,
  }));
}
