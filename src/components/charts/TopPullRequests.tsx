import { Avatar } from '@mui/material';
import { PullRequest } from '../../services/types';
import { BaseChartTooltip } from '../BaseChartTooltip';
import { BarChart } from './BarChart';
import { useMemo } from 'react';
import { ChartContainer } from '../ChartContainer';

export interface ITopPullRequestsChart {
  count: number;
  pullRequests: PullRequest[];
}

export function TopPullRequestsChart({ pullRequests, count }: ITopPullRequestsChart) {
  const data = useMemo(() => {
    const sorted = pullRequests.toSorted((a, b) => b.comments.length - a.comments.length);
    const top10 = sorted.slice(0, count);

    const data = top10
      .map((item) => ({
        // Unicode for ellipsis character
        pullRequest: item.title.length > 50 ? item.title.substring(0, 50) + '\u2026' : item.title,
        commentsCount: item.comments.length,
        authorName: item.author.fullName || item.author.userName,
        authorAvatarUrl: item.author.avatarUrl,
      }))
      .reverse();

    return data;
  }, [pullRequests, count]);

  return (
    <ChartContainer title={`Top ${count} Pull Requests by Comments`}>
      <BarChart
        indexBy="pullRequest"
        keys={['commentsCount']}
        data={data}
        margin={{ left: 300 }}
        borderRadius={4}
        tooltip={(props) => {
          const { indexValue: pullRequestName, value: commentsCount, data } = props;
          const authorAvatarUrl = data.authorAvatarUrl as string;
          const authorName = data.authorName as string;

          return (
            <BaseChartTooltip {...props}>
              <Avatar src={authorAvatarUrl} alt={`${authorName}'s avatar`} />
              <div>{data.authorName}</div> got <strong>{commentsCount}</strong> comments for <strong>{pullRequestName}</strong>
            </BaseChartTooltip>
          );
        }}
      />
    </ChartContainer>
  );
}
