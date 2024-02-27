import { Avatar, Stack } from '@mui/material';
import { PullRequest, User, UserDiscussion } from '../../services/types';
import { BaseChartTooltip } from '../BaseChartTooltip';
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
        const title = `${item.reviewerName} in ${item.pullRequestName}`;
        return {
          pullRequest: shortenText(title, 70),
          commentsCount: item.comments.length,
          reviewerName: item.reviewerName,
          reviewerAvatarUrl: item.reviewerAvatarUrl ?? '',
          authorName: item.prAuthorName,
          //   authorAvatarUrl: item.prAvatarUrl ?? '',
        };
      })
      .reverse();

    return data;
  }, [topDiscussions]);

  const title = !user ? `Top ${count} Longest Discussions` : `Top ${count} Longest Discussions started by ${user.displayName}`;

  return (
    <ChartContainer title={title}>
      <BarChart
        indexBy="pullRequest"
        keys={['commentsCount']}
        data={data}
        margin={{ left: 350 }}
        borderRadius={4}
        tooltip={(props) => {
          const { indexValue: pullRequestName, data } = props;
          const reviewerName = data.reviewerName as string;

          return (
            <BaseChartTooltip {...props} color={null}>
              <Stack direction="column">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar src={data.reviewerAvatarUrl as string} alt={`${reviewerName}'s avatar`} />
                  <div>{data.reviewerName}</div> started discussion with <br />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* <Avatar src={reviewerAvatarUrl} alt={`${reviewerName}'s avatar`} /> */}
                  <div>{data.authorName as string}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  in <strong>{pullRequestName}</strong>
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
