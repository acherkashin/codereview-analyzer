import { Stack } from '@mui/material';
import { PullRequest, User, UserDiscussion } from '../../services/types';
import { BaseChartTooltip } from '../tooltips/BaseChartTooltip';
import { BarChart } from './BarChart';
import { useMemo } from 'react';
import { ChartContainer } from '../ChartContainer';
import { getLongestDiscussions } from '../../utils/ChartUtils';
import { shortenText } from '../../utils/StringUtils';

export interface TopLongestDiscussionsChartProps {
  user?: User | null;
  count: number;
  pullRequests: PullRequest[];
  onClick: (discussion: UserDiscussion) => void;
}

export function TopLongestDiscussionsChart({ pullRequests, count, user, onClick }: TopLongestDiscussionsChartProps) {
  const topDiscussions = useMemo(() => {
    const topN = getLongestDiscussions(pullRequests, count, user);
    return topN;
  }, [pullRequests, user, count]);

  const data = useMemo(() => {
    const data = topDiscussions
      .filter((item) => item.comments.length > 0)
      .map((item) => {
        const title = user ? item.pullRequestName : `${item.reviewerName} in ${item.pullRequestName}`;
        const maxLength = user ? 30 : 50;
        return {
          // to make sure that id is unique we need to add a discussion id
          id: `${shortenText(title, maxLength)} #${item.id}`,
          value: item.comments.length,
          pullRequest: item.pullRequestName,
          reviewerName: item.reviewerName,
          authorName: item.prAuthorName,
        };
      })
      .reverse();

    return data;
  }, [topDiscussions, user]);

  const title = !user ? `Top ${count} Longest Discussions` : `Top ${count} Longest Discussions started by ${user.displayName}`;

  return (
    <ChartContainer title={title} description="Shows discussions with the greatest number of comments">
      <BarChart
        data={data}
        margin={{ left: user ? 250 : 350 }}
        borderRadius={4}
        tooltip={(props) => {
          const discussion = props.data as typeof data[0];

          return (
            <DiscussionTooltip
              pullRequest={discussion.pullRequest}
              reviewer={discussion.reviewerName}
              author={discussion.authorName}
            />
          );
        }}
        onClick={(datum) => {
          onClick(topDiscussions[datum.index]);
        }}
      />
    </ChartContainer>
  );
}

interface DiscussionTooltipProps {
  reviewer: string;
  author: string;
  pullRequest: string;
}

function DiscussionTooltip({ reviewer, author, pullRequest }: DiscussionTooltipProps) {
  return (
    <BaseChartTooltip>
      <Stack direction="column">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>{reviewer}</div> started discussion with <strong>{author}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          in <strong>{pullRequest}</strong>
        </div>
      </Stack>
    </BaseChartTooltip>
  );
}
