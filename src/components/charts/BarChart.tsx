import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum, BarSvgProps } from '@nivo/bar';

export interface BarChartProps extends Partial<BarSvgProps<BarDatum>> {}

export function BarChart(props: BarChartProps) {
  return <ResponsiveBar {...barChartSettings} {...props} />;
}

export const barChartSettings = {
  margin: { left: 150, bottom: 50, right: 30 },
  padding: 0.2,
  labelTextColor: 'inherit:darker(1.4)',
  labelSkipWidth: 16,
  labelSkipHeight: 16,
  layout: 'horizontal',
  enableLabel: true,
  enableGridX: true,
  animate: false,
  axisBottom: {
    tickSize: 10,
    tickPadding: 5,
    tickRotation: 45,
  },
} as BarSvgProps<BarDatum>;
