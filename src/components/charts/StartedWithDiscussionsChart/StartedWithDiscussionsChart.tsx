import { useMemo } from 'react';
import { User, UserDiscussion } from '../../../services/types';
import { BaseDiscussionsTooltip } from '../../tooltips';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { convertToDiscussionsReceived, getDiscussionStartedWithUserData } from './StartedWithDiscussionsChartUtils';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack } from '@mui/material';

export interface StartedWithDiscussionsChartProps {
  user?: User | null;
  discussions: UserDiscussion[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function StartedWithDiscussionsChart(props: StartedWithDiscussionsChartProps) {
  if (props.user) return <DiscussionsChartForUser {...props} />;

  return <DiscussionsChartForAll {...props} />;
}

export function DiscussionsChartForAll({ discussions, onClick }: StartedWithDiscussionsChartProps) {
  const data = useMemo(() => convertToDiscussionsReceived(discussions), [discussions]);

  return (
    <ChartContainer title="Discussions started with person" description={<StartedDiscussionsDescription />}>
      <BarChart
        {...data}
        colors={chartColor}
        tooltip={(props) => {
          const { indexValue, value, id, data } = props;

          return (
            <BaseDiscussionsTooltip
              reviewer={id as string}
              author={indexValue as string}
              count={value}
              total={data.total as number}
            />
          );
        }}
        onClick={(e) => {
          const authorName = e.indexValue as string;
          const reviewerName = e.id as string;
          onClick(reviewerName, authorName);
        }}
      />
    </ChartContainer>
  );
}

export function DiscussionsChartForUser({ user, discussions, onClick }: StartedWithDiscussionsChartProps) {
  const data = useMemo(() => getDiscussionStartedWithUserData(discussions, user!), [discussions, user]);

  return (
    <ChartContainer title={`Discussions started with ${user!.displayName}`} description={<StartedDiscussionsDescription />}>
      <BarChart
        data={data}
        tooltip={(props) => {
          return <BaseDiscussionsTooltip reviewer={props.indexValue as string} author={user!.displayName} count={props.value} />;
        }}
        onClick={(e) => {
          const reviewerName = e.indexValue as string;
          onClick(reviewerName, user!.displayName);
        }}
      />
    </ChartContainer>
  );
}

function StartedDiscussionsDescription() {
  return (
    <Stack gap={1}>
      <div>Shows how discussions are distributed among authors of pull requests and who starts those discussions.</div>
      <div>Click on any segment to dive into the conversations happening around that author.</div>
    </Stack>
  );
}
