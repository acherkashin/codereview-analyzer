import { LineChart } from '../LineChart';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest, User } from '../../../services/types';
import { useMemo, useState } from 'react';
import {
  getPullRequestsLineChartData,
  PullRequestsCreatedPerMonthMode,
} from './PullRequestsCreatedPerMonthChartUtils';
import { CommentsLineChartTooltip } from '../../tooltips';
import { chartColor } from '../../../utils/ColorUtils';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { PullRequestDialog } from '../../dialogs/PullRequestDialog';
import dayjs from 'dayjs';

export interface PullRequestsCreatedPerMonthChartProps {
  user?: User;
  pullRequests: PullRequest[];
  startDate?: Date;
  endDate?: Date;
}

export function PullRequestsCreatedPerMonthChart({
  pullRequests,
  user,
  startDate,
  endDate,
}: PullRequestsCreatedPerMonthChartProps) {
  const [mode, setMode] = useState<PullRequestsCreatedPerMonthMode>('total');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPullRequests, setSelectedPullRequests] = useState<PullRequest[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');
  const effectiveMode: PullRequestsCreatedPerMonthMode = user ? 'individual' : mode;

  const data = useMemo(
    () => getPullRequestsLineChartData(pullRequests, { mode: effectiveMode, user, startDate, endDate }),
    [effectiveMode, endDate, pullRequests, startDate, user]
  );

  const handlePointClick = (point: any) => {
    const clickedDate = point.data.x;
    const clickedAuthorId = point.data.authorId;

    // Filter PRs by month and user (if specific user)
    const filteredPRs = pullRequests.filter((pr) => {
      const dateMatch = dayjs(pr.createdAt).isSame(clickedDate, 'month');
      const userMatch = effectiveMode === 'total' || pr.author.id === clickedAuthorId;
      return dateMatch && userMatch;
    });

    setSelectedPullRequests(filteredPRs);
    const authorName = user?.displayName ?? (effectiveMode === 'individual' ? point.serieId : undefined);
    setDialogTitle(`Pull Requests - ${dayjs(clickedDate).format('MMMM YYYY')}${authorName ? ` by ${authorName}` : ''}`);
    setDialogOpen(true);
  };

  return (
    <>
      <ChartContainer
        title="Pull requests created per month"
        headerActions={
          !user ? (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              aria-label="Pull requests created per month display"
              onChange={(_, value: PullRequestsCreatedPerMonthMode | null) => {
                if (value) {
                  setMode(value);
                }
              }}
              sx={{ mr: 0.5, '& .MuiToggleButton-root': { whiteSpace: 'nowrap' } }}
            >
              <ToggleButton value="total" aria-label="Show total pull requests">
                Total
              </ToggleButton>
              <ToggleButton value="individual" aria-label="Show pull requests by individual">
                By individual
              </ToggleButton>
            </ToggleButtonGroup>
          ) : undefined
        }
        description={
          <Stack
            sx={{
              gap: 1,
            }}
          >
            <div>Shows how the total number of pull requests changes each month.</div>
            <div>Switch to By individual to compare each author, or filter by a user to view that person&apos;s trend.</div>
            <div>Click on a data point to see the pull requests represented by that point.</div>
          </Stack>
        }
      >
        <LineChart
          legendYLabel="Pull requests count"
          colors={chartColor}
          data={data}
          sliceTooltip={CommentsLineChartTooltip}
          onClick={handlePointClick}
        />
      </ChartContainer>

      <PullRequestDialog
        open={dialogOpen}
        title={dialogTitle}
        pullRequests={selectedPullRequests}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
