import dayjs from 'dayjs';
import { PullRequest, User } from '../../../services/types';

export type PullRequestsCreatedPerMonthMode = 'total' | 'individual';

export interface PullRequestsCreatedPerMonthOptions {
  mode: PullRequestsCreatedPerMonthMode;
  user?: User;
  startDate?: Date;
  endDate?: Date;
}

export interface MonthlyPullRequestsDatum {
  x: Date;
  y: number;
  authorId?: string;
}

export interface MonthlyPullRequestsSeries {
  id: string;
  data: MonthlyPullRequestsDatum[];
}

export const TOTAL_PULL_REQUESTS_SERIES_ID = 'Total';

export function getPullRequestsLineChartData(
  pullRequests: PullRequest[],
  { mode, user, startDate, endDate }: PullRequestsCreatedPerMonthOptions
): MonthlyPullRequestsSeries[] {
  if (mode === 'total') {
    return getTotalPullRequestsLineChartData(pullRequests, startDate, endDate);
  }

  return getIndividualPullRequestsLineChartData(pullRequests, user);
}

function getTotalPullRequestsLineChartData(
  pullRequests: PullRequest[],
  startDate?: Date,
  endDate?: Date
): MonthlyPullRequestsSeries[] {
  const months = getMonthsInRange(pullRequests, startDate, endDate);

  if (months.length === 0) {
    return [];
  }

  const pullRequestsByMonth = new Map<string, number>();
  pullRequests.forEach((pullRequest) => {
    const month = getMonthKey(pullRequest.createdAt);
    pullRequestsByMonth.set(month, (pullRequestsByMonth.get(month) ?? 0) + 1);
  });

  return [
    {
      id: TOTAL_PULL_REQUESTS_SERIES_ID,
      data: months.map((month) => ({
        x: month.toDate(),
        y: pullRequestsByMonth.get(month.format('YYYY-MM')) ?? 0,
      })),
    },
  ];
}

function getIndividualPullRequestsLineChartData(pullRequests: PullRequest[], user?: User): MonthlyPullRequestsSeries[] {
  const filteredPullRequests = user ? pullRequests.filter((pullRequest) => pullRequest.author.id === user.id) : pullRequests;
  const seriesByAuthor = new Map<string, MonthlyPullRequestsSeries>();

  filteredPullRequests.forEach((pullRequest) => {
    const authorName = pullRequest.author.displayName;
    const month = dayjs(pullRequest.createdAt).startOf('month').toDate();
    const existingSeries = seriesByAuthor.get(authorName);

    if (!existingSeries) {
      seriesByAuthor.set(authorName, {
        id: authorName,
        data: [{ x: month, y: 1, authorId: pullRequest.author.id }],
      });
      return;
    }

    const existingPoint = existingSeries.data.find((point) => point.x.getTime() === month.getTime());
    if (existingPoint) {
      existingPoint.y += 1;
    } else {
      existingSeries.data.push({ x: month, y: 1, authorId: pullRequest.author.id });
    }
  });

  return [...seriesByAuthor.values()].map((series) => ({
    ...series,
    data: [...series.data].sort((first, second) => first.x.getTime() - second.x.getTime()),
  }));
}

function getMonthsInRange(pullRequests: PullRequest[], startDate?: Date, endDate?: Date) {
  const dates = pullRequests.map((pullRequest) => dayjs(pullRequest.createdAt));
  const start = startDate ? dayjs(startDate).startOf('month') : dates.reduce<dayjs.Dayjs | undefined>(
    (earliest, date) => (!earliest || date.isBefore(earliest) ? date.startOf('month') : earliest),
    undefined
  );
  const end = endDate ? dayjs(endDate).startOf('month') : dates.reduce<dayjs.Dayjs | undefined>(
    (latest, date) => (!latest || date.isAfter(latest) ? date.startOf('month') : latest),
    undefined
  );

  if (!start || !end || end.isBefore(start)) {
    return [];
  }

  const months = [];
  for (let month = start; !month.isAfter(end, 'month'); month = month.add(1, 'month')) {
    months.push(month);
  }

  return months;
}

function getMonthKey(date: string) {
  return dayjs(date).format('YYYY-MM');
}
