import { useMemo } from 'react';
import { getEndDate, getStartDate } from '../../../utils/GitUtils';
import dayjs from 'dayjs';
import { PullRequest, User } from '../../../services/types';
import { groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { ChartContainer } from '../../ChartContainer';
import { ResponsiveCalendar } from '@nivo/calendar';
import classNames from 'classnames';
import { Stack } from '@mui/material';

export interface PullRequestsCalendarChartProps {
  user?: User;
  pullRequests: PullRequest[];
}

export function PullRequestsCalendarChart({ user, pullRequests }: PullRequestsCalendarChartProps) {
  const startDate = useMemo(() => dayjs(getStartDate(pullRequests)).format('YYYY-MM-DD'), [pullRequests]);
  const endDate = useMemo(() => dayjs(getEndDate(pullRequests)).format('YYYY-MM-DD'), [pullRequests]);

  const filteredPrs = user ? pullRequests.filter((item) => item.author.id === user.id) : pullRequests;

  const data = useMemo(() => {
    const allReviews = filteredPrs.map((item) => ({
      day: dayjs(item.createdAt).format('YYYY-MM-DD'),
    }));

    return tidy(allReviews, groupBy('day', [summarize({ value: n() })]));
  }, [filteredPrs]);

  const chartsCount = dayjs(endDate).year() - dayjs(startDate).year() + 1;
  const title = classNames('Created Pull Request', {
    [`by ${user?.displayName}`]: user,
  });

  return (
    <ChartContainer
      title={title}
      height={chartsCount * 250}
      description={
        <Stack>
          <div>Shows count of pull requests created daily.</div>
          <div>Specify user to see pull requests created by that user.</div>
        </Stack>
      }
    >
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
        onClick={(datum) => {
          const prsAtDate = filteredPrs.filter((item) => dayjs(item.createdAt).format('YYYY-MM-DD') === datum.day);

          //TODO: implement UI
          console.log(prsAtDate);
        }}
      />
    </ChartContainer>
  );
}
