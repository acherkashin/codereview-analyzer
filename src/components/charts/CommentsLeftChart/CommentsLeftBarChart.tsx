import { useMemo } from 'react';
import { Comment, User } from '../../../services/types';
import { BaseChartTooltip } from '../../tooltips/BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { getCommentsLeftByUserData, getCommentsLeftData } from './CommentsLeftChartUtils';

export interface CommentsLeftBarChartProps {
  user?: User | null;

  comments: Comment[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function CommentsLeftBarChart(props: CommentsLeftBarChartProps) {
  if (props.user) return <CommentsLeftChartForUser {...props} />;

  return <CommentsLeftChartForAll {...props} />;
}

function CommentsLeftChartForAll({ comments, onClick }: CommentsLeftBarChartProps) {
  const { authors, data } = useMemo(() => getCommentsLeftData(comments), [comments]);

  return (
    <ChartContainer title="Comments left by person">
      <BarChart
        keys={authors}
        data={data}
        indexBy="userName"
        tooltip={(props) => {
          const { indexValue, value, id } = props;

          return (
            <BaseChartTooltip {...props}>
              <strong>{indexValue}</strong> left <strong>{value}</strong> comments to <strong>{id}</strong>
            </BaseChartTooltip>
          );
        }}
        onClick={(e) => {
          const reviewerName = e.indexValue as string;

          onClick(reviewerName, e.id as string);
        }}
      />
    </ChartContainer>
  );
}

function CommentsLeftChartForUser({ user, comments, onClick }: CommentsLeftBarChartProps) {
  const data = useMemo(() => getCommentsLeftByUserData(comments, user!), [comments, user]);

  return (
    <ChartContainer title={`Comments left by ${user!.displayName}`}>
      <BarChart
        data={data}
        //TODO: fix onClick, fix tooltip
        // tooltip={(props) => {

        // }}
        // onClick={(e) => {
        //   const reviewerName = e.indexValue as string;

        //   onClick(reviewerName, e.id as string);
        // }}
      />
    </ChartContainer>
  );
}
