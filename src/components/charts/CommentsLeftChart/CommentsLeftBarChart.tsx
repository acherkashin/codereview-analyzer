import { useMemo } from 'react';
import { Comment, User } from '../../../services/types';
import { BaseChartTooltip, BaseChartTooltipProps } from '../../tooltips/BaseChartTooltip';
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
          return <BaseCommentsTooltip reviewer={props.indexValue as string} author={props.id as string} count={props.value} />;
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
        tooltip={(props) => {
          return (
            <BaseCommentsTooltip
              reviewer={user!.displayName}
              author={props.indexValue as string}
              count={props.value}
              {...props}
            />
          );
        }}
        onClick={(e) => {
          onClick(user!.displayName, e.indexValue as string);
        }}
      />
    </ChartContainer>
  );
}

export interface BaseCommentsTooltipProps extends BaseChartTooltipProps {
  reviewer: string;
  author: string;
  count: number;
}

export function BaseCommentsTooltip({ reviewer: commenter, author, count, ...otherProps }: BaseCommentsTooltipProps) {
  return (
    <BaseChartTooltip {...otherProps}>
      <strong>{commenter}</strong> left <strong>{count}</strong> comments to <strong>{author}</strong>
    </BaseChartTooltip>
  );
}
