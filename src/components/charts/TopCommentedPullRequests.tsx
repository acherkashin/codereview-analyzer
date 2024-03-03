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
        id: item.title.length > 50 ? item.title.substring(0, 50) + '\u2026' : item.title,
        pullRequestName: item.title,
        value: item.comments.length,
        authorName: item.author.fullName || item.author.userName,
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
        data={data}
        margin={{ left: 300 }}
        borderRadius={4}
        tooltip={(props) => {
          const comment = props.data as typeof data[0];

          return <CommentedTooltip author={comment.authorName} count={comment.value} pullRequest={comment.pullRequestName} />;
        }}
      />
    </ChartContainer>
  );
}

interface CommentedTooltipProps {
  author: string;
  count: number;
  pullRequest: string;
}

function CommentedTooltip({ author, count, pullRequest }: CommentedTooltipProps) {
  return (
    <BaseChartTooltip color={null}>
      <div>{author}</div> got <strong>{count}</strong> comments for <strong>{pullRequest}</strong>
    </BaseChartTooltip>
  );
}

function getMostCommentedPrs({ user, pullRequests, count }: TopCommentedPullRequestsChartProps) {
  const filteredPrs = !user ? pullRequests : pullRequests.filter((pr) => pr.author.id === user.id);
  const sorted = filteredPrs.toSorted((a, b) => b.comments.length - a.comments.length);
  const topPrs = sorted.slice(0, count);

  return topPrs;
}
