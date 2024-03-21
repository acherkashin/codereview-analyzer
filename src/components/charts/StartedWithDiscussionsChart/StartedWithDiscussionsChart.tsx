import { useMemo } from 'react';
import { User, UserDiscussion } from '../../../services/types';
import { BaseDiscussionsTooltip } from '../../tooltips';
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

          return <BaseDiscussionsTooltip reviewer={id as string} author={indexValue as string} count={value} />;
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
    <ChartContainer title={`Discussions started with ${user!.displayName}`}>
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
