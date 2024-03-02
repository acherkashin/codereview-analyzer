import { Avatar } from '@mui/material';
import { PullRequest, User } from '../../services/types';
import { BaseChartTooltip } from '../tooltips/BaseChartTooltip';
import { BarChart } from './BarChart';
import { useMemo } from 'react';
import { ChartContainer } from '../ChartContainer';

export interface TopCommentedPullRequestsChartProps {
  user?: User | null;
  count: number;
  pullRequests: PullRequest[];
}

/**
 * Shows top most commented pull requests.
 * Shows only pull requests created by the user if @param user is provided.
 */
export function TopCommentedPullRequestsChart({ user, pullRequests, count }: TopCommentedPullRequestsChartProps) {
  const data = useMemo(() => {
    const data = getMostCommentedPrs({ user, pullRequests, count })
      .map((item) => ({
        // Unicode for ellipsis character
        pullRequest: item.title.length > 50 ? item.title.substring(0, 50) + '\u2026' : item.title,
        commentsCount: item.comments.length,
        authorName: item.author.fullName || item.author.userName,
        authorAvatarUrl: item.author.avatarUrl,
      }))
      .reverse();

    return data;
  }, [user, pullRequests, count]);

  const title = !user
    ? `Top ${count} Most commented Pull Requests`
    : `Top ${count} Most commented Pull Requests created by ${user.displayName}`;

  return (
    <ChartContainer title={title}>
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
            <BaseChartTooltip {...props} color={null}>
              <Avatar src={authorAvatarUrl} alt={`${authorName}'s avatar`} />
              <div>{data.authorName}</div> got <strong>{commentsCount}</strong> comments for <strong>{pullRequestName}</strong>
            </BaseChartTooltip>
          );
        }}
      />
    </ChartContainer>
  );
}

function getMostCommentedPrs({ user, pullRequests, count }: TopCommentedPullRequestsChartProps) {
  const filteredPrs = !user ? pullRequests : pullRequests.filter((pr) => pr.author.id === user.id);
  const sorted = filteredPrs.toSorted((a, b) => b.comments.length - a.comments.length);
  const topPrs = sorted.slice(0, count);

  return topPrs;
}
