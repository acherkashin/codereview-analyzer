import { useMemo } from 'react';
import { User, UserDiscussion } from '../../../services/types';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { getDiscussionStartedByUserData, getDiscussionsStarted } from './StartedByDiscussionsChartUtils';
import { BaseDiscussionsTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface StartedByDiscussionsChartProps {
  user?: User | null;
  discussions: UserDiscussion[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function StartedByDiscussionsChart(props: StartedByDiscussionsChartProps) {
  if (props.user) return <StartedByDiscussionsForUser {...props} />;

  return <StartedByDiscussionsForAll {...props} />;
}

function StartedByDiscussionsForUser({ user, discussions, onClick }: StartedByDiscussionsChartProps) {
  const data = useMemo(() => getDiscussionStartedByUserData(discussions, user!), [discussions, user]);

  return (
    <ChartContainer title={`${user!.displayName} starts discussions with`} description={<StartedDiscussionsDescription />}>
      <BarChart
        data={data}
        tooltip={(props) => {
          return <BaseDiscussionsTooltip reviewer={user!.displayName} author={props.indexValue as string} count={props.value} />;
        }}
        onClick={(e) => {
          onClick(user!.displayName, e.indexValue as string);
        }}
      />
    </ChartContainer>
  );
}

function StartedByDiscussionsForAll({ discussions, onClick }: StartedByDiscussionsChartProps) {
  const { data, authors } = useMemo(() => getDiscussionsStarted(discussions), [discussions]);

  return (
    <ChartContainer title="Discussions started by person" description={<StartedDiscussionsDescription />}>
      <BarChart
        data={data}
        keys={authors}
        colors={chartColor}
        indexBy="userName"
        tooltip={(props) => {
          return <BaseDiscussionsTooltip reviewer={props.indexValue as string} author={props.id as string} count={props.value} />;
        }}
        onClick={(e) => {
          const authorName = e.id as string;
          const reviewerName = e.indexValue as string;
          onClick(reviewerName, authorName);
        }}
      />
    </ChartContainer>
  );
}

function StartedDiscussionsDescription() {
  return (
    <Stack gap={1}>
      <div>Shows how discussions are distributed among reviewers and who they start discussions with.</div>
      <div>Click on the bar segment to see the list of pull requests where user started discussions.</div>
    </Stack>
  );
}
