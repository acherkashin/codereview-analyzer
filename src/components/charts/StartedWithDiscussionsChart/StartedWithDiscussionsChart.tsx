import { useMemo } from 'react';
import { User, UserDiscussion } from '../../../services/types';
import { BaseChartTooltip } from '../../tooltips/BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { convertToDiscussionsReceived, getDiscussionStartedWithUserData } from './StartedWithDiscussionsChartUtils';

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
    <ChartContainer title="Discussions started with person">
      <BarChart
        {...data}
        tooltip={(props) => {
          const { indexValue, value, id } = props;

          return (
            <BaseChartTooltip {...props}>
              <strong>{id}</strong> started <strong>{value}</strong> discussions with <strong>{indexValue}</strong>
            </BaseChartTooltip>
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
    <ChartContainer title={`Following people start discussions with ${user!.displayName}`}>
      <BarChart
        data={data}

        //TODO: fix onClick
        //TODO: fix tooltip
      />
    </ChartContainer>
  );
}
