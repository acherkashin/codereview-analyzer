import { useMemo } from 'react';
import { User, UserDiscussion } from '../../../services/types';
import { BaseChartTooltip } from '../../BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { getDiscussionStartedByUserData, getDiscussionsStarted } from './StartedByDiscussionsChartUtils';

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
    <ChartContainer title={`${user!.displayName} starts discussions with`}>
      <BarChart
        data={data}

        //TODO: fix tooltip
      />
    </ChartContainer>
  );
}

function StartedByDiscussionsForAll({ discussions, onClick }: StartedByDiscussionsChartProps) {
  const { data, authors } = useMemo(() => getDiscussionsStarted(discussions), [discussions]);

  return (
    <ChartContainer title="Discussions started by person">
      <BarChart
        data={data}
        keys={authors}
        indexBy="userName"
        tooltip={(props) => {
          const { indexValue, value, id } = props;

          return (
            <BaseChartTooltip {...props}>
              <strong>{indexValue}</strong> started <strong>{value}</strong> discussions with <strong>{id}</strong>
            </BaseChartTooltip>
          );
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
