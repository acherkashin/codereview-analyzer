import { useMemo } from 'react';
import { UserDiscussion } from '../../../services/types';
import { BaseChartTooltip } from '../../BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';
import { getAuthorReviewerFromDiscussions } from '../../../utils/GitUtils';
import { ReviewBarChartSettings, ReviewBarDatum, getItemsReceived } from '../../../utils/ChartUtils';

export interface StartedWithDiscussionsChartProps {
  discussions: UserDiscussion[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function StartedWithDiscussionsChart({ discussions, onClick }: StartedWithDiscussionsChartProps) {
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

export function convertToDiscussionsReceived(discussions: UserDiscussion[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  return getItemsReceived(rawData);
}
