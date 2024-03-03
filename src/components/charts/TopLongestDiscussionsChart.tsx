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
      .map((item) => {
        const title = user ? item.pullRequestName : `${item.reviewerName} in ${item.pullRequestName}`;
        const maxLength = user ? 40 : 60;
        return {
          id: shortenText(title, maxLength),
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
    <ChartContainer title={title}>
      <BarChart
        data={data}
        margin={{ left: user ? 250 : 350 }}
        borderRadius={4}
        tooltip={(props) => {
          const discussion = props.data as typeof data[0];

          return (
            <BaseChartTooltip {...props} color={null}>
              <Stack direction="column">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div>{discussion.reviewerName}</div> started discussion with <strong>{discussion.authorName as string}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  in <strong>{discussion.pullRequest}</strong>
                </div>
              </Stack>
            </BaseChartTooltip>
          );
        }}
        onClick={(datum) => {
          onClick(topDiscussions[datum.index]);
        }}
      />
    </ChartContainer>
  );
}
