import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum, BarSvgProps } from '@nivo/bar';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNivoTheme } from './useNivoTheme';

export interface BarChartProps extends Partial<BarSvgProps<BarDatum>> {}

export function BarChart(props: BarChartProps) {
  const muiTheme = useTheme();
  const compact = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const nivoTheme = useNivoTheme();

  return (
    <ResponsiveBar
      {...barChartSettings}
      theme={nivoTheme}
      margin={{ top: 16, left: compact ? 104 : 160, bottom: compact ? 56 : 64, right: compact ? 12 : 24 }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 8,
        format: (value) => {
          const label = String(value);
          const maximumLength = compact ? 13 : 24;
          return label.length > maximumLength ? `${label.slice(0, maximumLength - 1)}…` : label;
        },
      }}
      labelTextColor={({ color }) => muiTheme.palette.getContrastText(color)}
      {...props}
    />
  );
}

export const barChartSettings = {
  padding: 0.2,
  labelSkipWidth: 16,
  labelSkipHeight: 16,
  layout: 'horizontal',
  enableLabel: true,
  enableGridX: true,
  animate: false,
  axisBottom: {
    tickSize: 5,
    tickPadding: 8,
    tickRotation: 0,
  },
} as BarSvgProps<BarDatum>;
