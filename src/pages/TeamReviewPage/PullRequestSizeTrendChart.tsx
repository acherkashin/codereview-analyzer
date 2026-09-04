import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarDatum, BarItem, BarItemProps, ComputedDatum, ResponsiveBar } from '@nivo/bar';
import { Box, Paper, Popper, Stack, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { PullRequest } from '../../services/types';
import { ChartContainer } from '../../components';
import { PullRequestDialog } from '../../components/dialogs/PullRequestDialog';
import {
  getPullRequestSizeTierLabel,
  getPullRequestSizeTierRangeLabel,
  PullRequestSizeTier,
} from '../../utils/PullRequestMetrics';
import { TeamReviewMonthlySizeBucket, TeamReviewSummary } from '../../utils/TeamReviewUtils';
import { useNivoTheme } from '../../components/charts/useNivoTheme';

type ChartMode = 'counts' | 'share';

interface MonthlySizeChartDatum extends BarDatum {
  month: string;
  compact: number;
  medium: number;
  large: number;
  veryLarge: number;
}

interface DrillDownSelection {
  month: string;
  sizeTier: PullRequestSizeTier;
}

interface HoveredBar {
  anchorEl: SVGRectElement;
  color: string;
  month: string;
  sizeTier: PullRequestSizeTier;
}

const sizeTierOrder: PullRequestSizeTier[] = ['compact', 'medium', 'large', 'veryLarge'];

export interface PullRequestSizeTrendChartProps {
  summary: TeamReviewSummary;
  monthlySizeBuckets: TeamReviewMonthlySizeBucket[];
  authoredPullRequests: PullRequest[];
}

export function PullRequestSizeTrendChart({ summary, monthlySizeBuckets, authoredPullRequests }: PullRequestSizeTrendChartProps) {
  const theme = useTheme();
  const nivoTheme = useNivoTheme();
  const [mode, setMode] = useState<ChartMode>('counts');
  const [drillDownSelection, setDrillDownSelection] = useState<DrillDownSelection | null>(null);
  const [hoveredBar, setHoveredBar] = useState<HoveredBar | null>(null);
  const tierColors = useMemo<Record<PullRequestSizeTier, string>>(
    () => ({
      compact: theme.palette.info.dark,
      medium: theme.palette.success.dark,
      large: theme.palette.warning.dark,
      veryLarge: theme.palette.error.dark,
    }),
    [theme]
  );
  const bucketsByMonth = useMemo(() => new Map(monthlySizeBuckets.map((bucket) => [bucket.month, bucket])), [monthlySizeBuckets]);
  const chartData = useMemo(
    () =>
      monthlySizeBuckets.map((bucket): MonthlySizeChartDatum => {
        const total = getBucketTotal(bucket);

        return {
          month: bucket.month,
          compact: getChartValue(bucket.counts.compact, total, mode),
          medium: getChartValue(bucket.counts.medium, total, mode),
          large: getChartValue(bucket.counts.large, total, mode),
          veryLarge: getChartValue(bucket.counts.veryLarge, total, mode),
        };
      }),
    [mode, monthlySizeBuckets]
  );
  const selectedPullRequests = useMemo(() => {
    if (!drillDownSelection) {
      return [];
    }

    const pullRequestIds = new Set(
      bucketsByMonth.get(drillDownSelection.month)?.pullRequestIdsByTier[drillDownSelection.sizeTier] ?? []
    );

    return authoredPullRequests.filter((pullRequest) => pullRequestIds.has(pullRequest.id));
  }, [authoredPullRequests, bucketsByMonth, drillDownSelection]);
  const hasAuthoredPullRequests = summary.authoredPullRequestsCount > 0;
  const hasPartialMonths = monthlySizeBuckets.some((bucket) => bucket.isPartial);
  const chartWidth = monthlySizeBuckets.length > 8 ? `${monthlySizeBuckets.length * 72}px` : '100%';
  const maximumMonthlyTotal = Math.max(...monthlySizeBuckets.map(getBucketTotal), 0);
  const countTickValues =
    maximumMonthlyTotal <= 10 ? Array.from({ length: maximumMonthlyTotal + 1 }, (_, value) => value) : undefined;

  useEffect(() => {
    if (drillDownSelection && selectedPullRequests.length === 0) {
      setDrillDownSelection(null);
    }
  }, [drillDownSelection, selectedPullRequests.length]);

  useEffect(() => {
    setHoveredBar(null);
  }, [mode, monthlySizeBuckets]);

  const handleBarClick = (datum: ComputedDatum<MonthlySizeChartDatum>) => {
    const month = String(datum.indexValue);
    const sizeTier = datum.id as PullRequestSizeTier;
    const bucket = bucketsByMonth.get(month);

    if (!bucket || bucket.counts[sizeTier] === 0) {
      return;
    }

    setDrillDownSelection({ month, sizeTier });
  };

  const showBarTooltip = useCallback((datum: ComputedDatum<MonthlySizeChartDatum>, anchorEl: SVGRectElement, color: string) => {
    setHoveredBar({
      anchorEl,
      color,
      month: String(datum.indexValue),
      sizeTier: datum.id as PullRequestSizeTier,
    });
  }, []);
  const hideBarTooltip = useCallback(() => setHoveredBar(null), []);
  const renderBar = useCallback(
    (props: BarItemProps<MonthlySizeChartDatum>) => (
      <PortalledTooltipBar {...props} onFocusBar={showBarTooltip} onBlurBar={hideBarTooltip} />
    ),
    [hideBarTooltip, showBarTooltip]
  );

  return (
    <>
      <ChartContainer
        title="PR size over time"
        description={<PullRequestSizeTrendDescription />}
        descriptionTooltipMaxWidth={420}
        height={600}
        style={{ margin: 0, width: '100%' }}
      >
        <Stack spacing={2} sx={{ height: '100%', px: 2, pt: 1.5, pb: 1 }}>
          <Box
            aria-label="PR size totals and legend"
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
            }}
          >
            {sizeTierOrder.map((sizeTier) => (
              <SizeTierTotal
                key={sizeTier}
                sizeTier={sizeTier}
                color={tierColors[sizeTier]}
                value={summary.sizeTierCounts[sizeTier]}
              />
            ))}
          </Box>

          {hasAuthoredPullRequests ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={mode}
                  aria-label="PR size chart display"
                  onChange={(_, value: ChartMode | null) => {
                    if (value) {
                      setMode(value);
                    }
                  }}
                >
                  <ToggleButton value="counts" aria-label="Show PR counts" sx={{ minHeight: 44 }}>
                    Counts
                  </ToggleButton>
                  <ToggleButton value="share" aria-label="Show monthly PR share" sx={{ minHeight: 44 }}>
                    Share
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box
                tabIndex={monthlySizeBuckets.length > 8 ? 0 : undefined}
                aria-label={monthlySizeBuckets.length > 8 ? 'Scrollable monthly PR size chart' : undefined}
                sx={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden' }}
              >
                <Box sx={{ width: chartWidth, minWidth: '100%', height: '100%' }}>
                  <ResponsiveBar<MonthlySizeChartDatum>
                    data={chartData}
                    theme={nivoTheme}
                    keys={sizeTierOrder}
                    indexBy="month"
                    layout="vertical"
                    groupMode="stacked"
                    padding={0.28}
                    innerPadding={1}
                    margin={{ top: 12, right: 24, bottom: 72, left: 64 }}
                    maxValue={mode === 'share' ? 100 : 'auto'}
                    enableGridX={false}
                    enableGridY
                    animate={false}
                    enableLabel
                    labelSkipWidth={28}
                    labelSkipHeight={22}
                    valueFormat={(value) => formatChartValue(value, mode)}
                    labelTextColor={({ data }) => theme.palette.getContrastText(tierColors[data.id as PullRequestSizeTier])}
                    colors={({ id }) => tierColors[id as PullRequestSizeTier]}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.35]] }}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 8,
                      tickRotation: -35,
                      format: (month) =>
                        `${dayjs(`${month}-01`).format('MMM YY')}${bucketsByMonth.get(String(month))?.isPartial ? '*' : ''}`,
                      legend: 'Month created',
                      legendPosition: 'middle',
                      legendOffset: 58,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 6,
                      tickRotation: 0,
                      tickValues: mode === 'share' ? [0, 25, 50, 75, 100] : countTickValues,
                      format: mode === 'share' ? (value) => `${value}%` : undefined,
                      legend: mode === 'share' ? 'Share of monthly PRs' : 'Pull requests',
                      legendPosition: 'middle',
                      legendOffset: -52,
                    }}
                    role="img"
                    ariaLabel={`Stacked monthly PR size chart shown as ${mode === 'share' ? 'percentage share' : 'counts'}`}
                    isFocusable
                    barAriaLabel={(datum) => getBarAriaLabel(datum, bucketsByMonth)}
                    tooltip={() => null}
                    barComponent={renderBar}
                    onMouseEnter={(datum, event) =>
                      showBarTooltip(datum, event.currentTarget, tierColors[datum.id as PullRequestSizeTier])
                    }
                    onMouseLeave={hideBarTooltip}
                    onClick={handleBarClick}
                  />
                </Box>
              </Box>

              <Popper
                open={hoveredBar != null}
                anchorEl={hoveredBar?.anchorEl}
                placement="top"
                modifiers={[
                  { name: 'offset', options: { offset: [0, 8] } },
                  { name: 'flip', enabled: true },
                  {
                    name: 'preventOverflow',
                    enabled: true,
                    options: { altAxis: true, padding: 8 },
                  },
                ]}
                sx={{ zIndex: theme.zIndex.tooltip, pointerEvents: 'none' }}
              >
                {hoveredBar && (
                  <SizeTierTooltip
                    month={hoveredBar.month}
                    sizeTier={hoveredBar.sizeTier}
                    color={hoveredBar.color}
                    buckets={monthlySizeBuckets}
                  />
                )}
              </Popper>

              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                }}
              >
                Select a colored segment to view its pull requests.
                {hasPartialMonths && ' * indicates a partial month within the selected date range.'}
              </Typography>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                textAlign: 'center',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.default',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                Selected team members did not create pull requests in this period.
              </Typography>
            </Box>
          )}
        </Stack>
      </ChartContainer>

      <PullRequestDialog
        open={drillDownSelection != null}
        title={
          drillDownSelection
            ? `${getPullRequestSizeTierLabel(drillDownSelection.sizeTier)} PRs · ${formatMonth(drillDownSelection.month)}`
            : ''
        }
        pullRequests={selectedPullRequests}
        onClose={() => setDrillDownSelection(null)}
      />
    </>
  );
}

function SizeTierTotal({ sizeTier, color, value }: { sizeTier: PullRequestSizeTier; color: string; value: number }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        minWidth: 0,
        p: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Box aria-hidden="true" sx={{ width: 12, height: 32, flexShrink: 0, borderRadius: 0.5, backgroundColor: color }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
          }}
        >
          {getPullRequestSizeTierLabel(sizeTier)}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {getPullRequestSizeTierRangeLabel(sizeTier)}
        </Typography>
      </Box>
      <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}

function PortalledTooltipBar({
  onFocusBar,
  onBlurBar,
  ...props
}: BarItemProps<MonthlySizeChartDatum> & {
  onFocusBar: (datum: ComputedDatum<MonthlySizeChartDatum>, anchorEl: SVGRectElement, color: string) => void;
  onBlurBar: () => void;
}) {
  return (
    <g
      onFocusCapture={(event) => onFocusBar(props.bar.data, event.target as SVGRectElement, props.bar.color)}
      onBlurCapture={onBlurBar}
    >
      <BarItem {...props} />
    </g>
  );
}

function SizeTierTooltip({
  month,
  sizeTier,
  color,
  buckets,
}: {
  month: string;
  sizeTier: PullRequestSizeTier;
  color: string;
  buckets: TeamReviewMonthlySizeBucket[];
}) {
  const bucketIndex = buckets.findIndex((bucket) => bucket.month === month);
  const bucket = buckets[bucketIndex];

  if (!bucket) {
    return null;
  }

  const count = bucket.counts[sizeTier];
  const total = getBucketTotal(bucket);
  const share = total === 0 ? 0 : (count / total) * 100;
  const previousCount = bucketIndex > 0 ? buckets[bucketIndex - 1].counts[sizeTier] : null;

  return (
    <Paper elevation={6} sx={{ minWidth: 230, p: 1.5 }}>
      <Stack spacing={0.75}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: 0.5, backgroundColor: color }} />
          <Typography variant="subtitle2">
            {getPullRequestSizeTierLabel(sizeTier)} · {formatMonth(bucket.month)}
          </Typography>
        </Box>
        {bucket.isPartial && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            Partial month in the selected period
          </Typography>
        )}
        <TooltipMetric label="PRs" value={formatCount(count)} />
        <TooltipMetric label="Monthly share" value={`${formatPercentage(share)}%`} />
        <TooltipMetric label="All PRs this month" value={formatCount(total)} />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            pt: 0.5,
          }}
        >
          {formatMonthOverMonthChange(count, previousCount)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function TooltipMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function getBucketTotal(bucket: TeamReviewMonthlySizeBucket) {
  return sizeTierOrder.reduce((total, sizeTier) => total + bucket.counts[sizeTier], 0);
}

function getChartValue(count: number, total: number, mode: ChartMode) {
  if (mode === 'counts') {
    return count;
  }

  return total === 0 ? 0 : (count / total) * 100;
}

function formatChartValue(value: number, mode: ChartMode) {
  return mode === 'share' ? `${formatPercentage(value)}%` : formatCount(value);
}

function getBarAriaLabel(datum: ComputedDatum<MonthlySizeChartDatum>, bucketsByMonth: Map<string, TeamReviewMonthlySizeBucket>) {
  const sizeTier = datum.id as PullRequestSizeTier;
  const month = String(datum.indexValue);
  const bucket = bucketsByMonth.get(month);
  const count = bucket?.counts[sizeTier] ?? 0;
  const total = bucket ? getBucketTotal(bucket) : 0;
  const share = total === 0 ? 0 : (count / total) * 100;

  const selectionHint = count > 0 ? ' Select to view pull requests.' : '';

  return `${getPullRequestSizeTierLabel(sizeTier)}, ${formatMonth(month)}, ${formatCount(
    count
  )} pull requests, ${formatPercentage(share)} percent of the month.${selectionHint}`;
}

function PullRequestSizeTrendDescription() {
  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        PR size is lines added plus lines removed across all changed files. Rewriting a line normally counts as two changes: one
        removal and one addition.
      </Typography>
      <Typography variant="body2">
        Counts show authored PRs by creation month and size tier. Share is the tier's PR count divided by all authored PRs that
        month, multiplied by 100.
      </Typography>
      <Typography variant="body2">
        Month-over-month compares the same tier's PR count with the preceding displayed calendar month. “New” means the preceding
        count was zero.
      </Typography>
      <Typography variant="body2">An asterisk marks a partial boundary month in the selected date range.</Typography>
    </Stack>
  );
}

function formatMonthOverMonthChange(currentCount: number, previousCount: number | null) {
  if (previousCount == null) {
    return 'No prior month in the selected period';
  }

  const difference = currentCount - previousCount;

  if (previousCount === 0) {
    return currentCount === 0 ? 'No change from previous month' : `New vs previous month (+${currentCount})`;
  }

  const percentageDifference = (difference / previousCount) * 100;
  const signedDifference = difference > 0 ? `+${difference}` : String(difference);
  const signedPercentage =
    percentageDifference > 0 ? `+${formatPercentage(percentageDifference)}` : formatPercentage(percentageDifference);

  return `${signedDifference} PRs (${signedPercentage}%) vs previous month`;
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatMonth(month: string) {
  return dayjs(`${month}-01`).format('MMMM YYYY');
}
