import type { Theme as NivoTheme } from '@nivo/core';
import { alpha, useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

export function useNivoTheme(): NivoTheme {
  const theme = useTheme();

  return useMemo(
    () => ({
      background: 'transparent',
      text: {
        fill: theme.palette.text.secondary,
        fontFamily: theme.typography.fontFamily,
        fontSize: 12,
      },
      axis: {
        domain: { line: { stroke: theme.palette.divider, strokeWidth: 1 } },
        ticks: {
          line: { stroke: theme.palette.divider, strokeWidth: 1 },
          text: { fill: theme.palette.text.secondary, fontSize: 12 },
        },
        legend: { text: { fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 600 } },
      },
      grid: { line: { stroke: alpha(theme.palette.text.secondary, theme.palette.mode === 'dark' ? 0.18 : 0.12) } },
      crosshair: { line: { stroke: theme.palette.primary.main, strokeWidth: 1, strokeOpacity: 0.65 } },
      legends: {
        text: { fill: theme.palette.text.secondary, fontSize: 12 },
        ticks: { text: { fill: theme.palette.text.secondary, fontSize: 12 } },
      },
      labels: { text: { fontFamily: theme.typography.fontFamily, fontWeight: 700 } },
      tooltip: {
        container: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 10,
          boxShadow: theme.shadows[8],
          fontFamily: theme.typography.fontFamily,
          fontSize: 12,
          padding: '8px 10px',
        },
        basic: { color: theme.palette.text.primary },
        tableCell: { color: theme.palette.text.primary, padding: '3px 5px' },
        tableCellValue: { color: theme.palette.text.primary, fontWeight: 700 },
      },
    }),
    [theme]
  );
}
