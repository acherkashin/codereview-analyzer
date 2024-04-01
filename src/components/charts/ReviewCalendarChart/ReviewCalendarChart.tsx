import { ResponsiveCalendar } from '@nivo/calendar';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest, User } from '../../../services/types';
import dayjs from 'dayjs';
import { getEndDate, getStartDate } from '../../../utils/GitUtils';
import { useMemo } from 'react';
import { groupBy, n, summarize, tidy } from '@tidyjs/tidy';

export interface ReviewCalendarChartProps {
  user?: User;
  pullRequests: PullRequest[];
}

export function ReviewCalendarChart({ pullRequests, user }: ReviewCalendarChartProps) {
  const startDate = useMemo(() => dayjs(getStartDate(pullRequests)).format('YYYY-MM-DD'), [pullRequests]);
  const endDate = useMemo(() => dayjs(getEndDate(pullRequests)).format('YYYY-MM-DD'), [pullRequests]);

  const data = useMemo(() => {
    const allReviews = pullRequests
      .flatMap((item) =>
        user ? item.reviewedByUser.filter(({ user: reviewUser }) => reviewUser.id === user.id) : item.reviewedByUser
      )
      .map((item) => ({
        user: item.user,
        day: dayjs(item.at).format('YYYY-MM-DD'),
      }));

    return tidy(allReviews, groupBy('day', [summarize({ value: n() })]));
  }, [pullRequests, user]);

  const title = user ? `Daily reviews by ${user.displayName}` : 'Daily reviews';

  return (
    <ChartContainer title={title}>
      <ResponsiveCalendar
        data={data}
        from={startDate}
        to={endDate}
        emptyColor="#eeeeee"
        colors={['#6FCB84', '#4D9759', '#366F3C', '#1F4424']}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        yearSpacing={40}
        monthBorderColor="#ffffff"
        dayBorderWidth={2}
        dayBorderColor="#ffffff"
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'row',
            translateY: 36,
            itemCount: 4,
            itemWidth: 42,
            itemHeight: 36,
            itemsSpacing: 14,
            itemDirection: 'right-to-left',
          },
        ]}
      />
    </ChartContainer>
  );
}
