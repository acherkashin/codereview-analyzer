import { useMemo } from 'react';
import { UserDiscussion } from '../../../services/types';
import { ReviewBarChartSettings, ReviewBarDatum, convertToItemsLeft } from '../../../utils/ChartUtils';
import { getAuthorReviewerFromDiscussions } from '../../../utils/GitUtils';
import { BaseChartTooltip } from '../../BaseChartTooltip';
import { ChartContainer } from '../../ChartContainer';
import { BarChart } from '../BarChart';

export interface StartedByDiscussionsChartProps {
  discussions: UserDiscussion[];
  onClick: (reviewerName: string, authorName: string) => void;
}

export function StartedByDiscussionsChart({ discussions, onClick }: StartedByDiscussionsChartProps) {
  const data = useMemo(() => convertToDiscussionsLeft(discussions), [discussions]);

  return (
    <ChartContainer title="Discussions started by person">
      <BarChart
        {...data}
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

export function convertToDiscussionsLeft(discussions: UserDiscussion[]): ReviewBarChartSettings<ReviewBarDatum> {
  const rawData = getAuthorReviewerFromDiscussions(discussions).filter((item) => item.reviewer !== item.author);
  return convertToItemsLeft(rawData);
}
