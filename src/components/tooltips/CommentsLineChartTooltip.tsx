import { SquareMarker } from './BaseChartTooltip';
import { SliceTooltipProps } from '@nivo/line';
import { Box, Paper, Typography } from '@mui/material';

export function CommentsLineChartTooltip({ slice }: SliceTooltipProps) {
  const points = slice.points.toSorted((a, b) => Number(b.data.y) - Number(a.data.y));

  return (
    <Paper
      data-testid="line-chart-tooltip"
      elevation={8}
      sx={{
        width: 'min(340px, calc(100vw - 32px))',
        maxHeight: 'min(420px, 65vh)',
        overflowY: 'auto',
        p: 1.25,
        color: 'text.primary',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {points[0] && (
        <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontWeight: 700 }}>
          {String(points[0].data.xFormatted)}
        </Typography>
      )}
      {points.map((point) => (
        <Box
          key={point.id}
          sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 0.75, py: 0.375 }}
        >
          <Box sx={{ display: 'flex' }}>
            <SquareMarker color={point.serieColor} />
          </Box>
          <Typography variant="caption" noWrap title={String(point.serieId)}>
            {String(point.serieId)}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {point.data.y.toString()}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}
