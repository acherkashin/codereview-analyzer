import type React from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { PullRequestFetchProgress } from '../services/GitService';

export interface AnalysisProgressPanelProps {
  progress: PullRequestFetchProgress;
}

export function AnalysisProgressPanel({ progress }: AnalysisProgressPanelProps) {
  const progressValue = getProgressPercent(progress);
  const summary = getProgressSummary(progress);
  const dateRange = getProgressDateRange(progress);
  const detail = getProgressDetail(progress);

  return (
    <Box
      role="status"
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        backgroundColor: 'background.paper',
        height: 142,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={1} height="100%" justifyContent="space-between">
        <Stack spacing={0.25} minWidth={0}>
          <NoWrapTypography variant="subtitle2">{progress.stageLabel}</NoWrapTypography>
          {summary && (
            <NoWrapTypography variant="body2" color="text.secondary">
              {summary}
            </NoWrapTypography>
          )}
          {dateRange && (
            <NoWrapTypography variant="body2" color="text.secondary">
              {dateRange}
            </NoWrapTypography>
          )}
          {detail && (
            <NoWrapTypography variant="body2" color="text.secondary">
              {detail}
            </NoWrapTypography>
          )}
        </Stack>
        <LinearProgress
          aria-label="Pull request fetch progress"
          variant={progressValue == null ? 'indeterminate' : 'determinate'}
          value={progressValue ?? 0}
        />
      </Stack>
    </Box>
  );
}

function NoWrapTypography(props: React.ComponentProps<typeof Typography>) {
  const { children, sx, title, ...typographyProps } = props;
  const sxArray = Array.isArray(sx) ? sx : sx == null ? [] : [sx];
  const resolvedTitle = title ?? (typeof children === 'string' ? children : undefined);

  return (
    <Typography
      {...typographyProps}
      title={resolvedTitle}
      sx={[
        {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        ...sxArray,
      ]}
    >
      {children}
    </Typography>
  );
}

export function getProgressPercent(progress: PullRequestFetchProgress): number | undefined {
  if (progress.total == null) {
    return undefined;
  }

  if (progress.total === 0) {
    return 100;
  }

  return Math.min(100, Math.round(((progress.fetched ?? 0) / progress.total) * 100));
}

export function getProgressSummary(progress: PullRequestFetchProgress): string | null {
  if (progress.fetched == null) {
    return null;
  }

  const unit = progress.stage === 'users' ? 'users' : 'pull requests';

  if (progress.minimumTarget && progress.total != null) {
    return `${progress.fetched} analyzable ${unit} found (minimum ${progress.total})`;
  }

  if (progress.total == null) {
    return `${progress.fetched} ${unit} fetched`;
  }

  return `${progress.fetched} of ${progress.total} ${unit} fetched`;
}

export function getProgressDateRange(progress: PullRequestFetchProgress): string | null {
  if (progress.total != null || (progress.createdAfter == null && progress.createdBefore == null)) {
    return null;
  }

  const start = formatDate(progress.createdAfter);
  const end = formatDate(progress.createdBefore);

  if (start && end) {
    return `Date range: ${start} to ${end}`;
  }

  if (start) {
    return `Created after: ${start}`;
  }

  return `Created before: ${end}`;
}

export function getProgressDetail(progress: PullRequestFetchProgress): string | null {
  if (progress.examined != null) {
    const details = [`${progress.examined} candidates examined`];

    if ((progress.ineligible ?? 0) > 0) {
      details.push(`${progress.ineligible} closed/unmerged ${progress.ineligible === 1 ? 'PR' : 'PRs'} skipped`);
    }

    if ((progress.duplicates ?? 0) > 0) {
      details.push(`${progress.duplicates} ${progress.duplicates === 1 ? 'duplicate' : 'duplicates'} skipped`);
    }

    return details.join(' · ');
  }

  if (progress.currentDataType == null) {
    return null;
  }

  if (progress.currentDataType === 'completed details') {
    return progress.currentPullRequestTitle ? `Completed details for "${progress.currentPullRequestTitle}"` : 'Completed details';
  }

  return progress.currentPullRequestTitle
    ? `Fetching ${progress.currentDataType} for "${progress.currentPullRequestTitle}"`
    : `Fetching ${progress.currentDataType}`;
}

function formatDate(value?: string): string | null {
  if (value == null) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().substring(0, 10);
}
