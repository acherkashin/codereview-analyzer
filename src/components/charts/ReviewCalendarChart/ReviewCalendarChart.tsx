import { ResponsiveCalendar } from '@nivo/calendar';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest, User } from '../../../services/types';
import dayjs from 'dayjs';
import { getEndDate, getStartDate } from '../../../utils/GitUtils';
import { useMemo } from 'react';
import { groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { Stack, useTheme } from '@mui/material';
import { useNivoTheme } from '../useNivoTheme';

export interface ReviewCalendarChartProps {
  user?: User;
  pullRequests: PullRequest[];
}

export function ReviewCalendarChart({ pullRequests, user }: ReviewCalendarChartProps) {
  const theme = useTheme();
  const nivoTheme = useNivoTheme();
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

  const chartsCount = dayjs(endDate).year() - dayjs(startDate).year() + 1;

  return (
    <ChartContainer
      title={title}
      height={chartsCount * 250}
      description={
        <Stack
          sx={{
            gap: 1,
          }}
        >
          <div>Enables the analysis of how frequently each user reviews on a daily basis.</div>
          <div>
            A user is considered to have made a review if he or she either approved a pull request or left a comment on the pull.
            request.
          </div>
          <div>Filter by user to view the daily review distribution of a specific user.</div>
        </Stack>
      }
    >
      <ResponsiveCalendar
        data={data}
        theme={nivoTheme}
        from={startDate}
        to={endDate}
        emptyColor={theme.palette.action.hover}
        colors={[
          theme.palette.primary.light,
          theme.palette.primary.main,
          theme.palette.primary.dark,
          theme.palette.secondary.main,
        ]}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        yearSpacing={40}
        monthBorderColor={theme.palette.background.paper}
        dayBorderWidth={2}
        dayBorderColor={theme.palette.background.paper}
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
          const reviewedPullRequests = pullRequests.filter(
            (pr) =>
              pr.reviewedByUser.find(
                ({ at, user: reviewedBy }) =>
                  dayjs(at).format('YYYY-MM-DD') === datum.day && (user == null || reviewedBy.id === user.id)
              ) != null
          );

          //TODO: implement UI
          console.log(reviewedPullRequests);
        }}
      />
    </ChartContainer>
  );
}
