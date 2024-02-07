import { Bar, BarSvgProps } from '@nivo/bar';
import { BarDatum } from '@nivo/bar';

export interface BarChartProps extends Partial<BarSvgProps<BarDatum>> {}

export function BarChart(props: BarChartProps) {
  return <Bar {...barChartSettings} {...props} />;
}

export const barChartSettings = {
  width: 500,
  height: 400,
  margin: { left: 150 },
  padding: 0.2,
  labelTextColor: 'inherit:darker(1.4)',
  labelSkipWidth: 16,
  labelSkipHeight: 16,
  layout: 'horizontal',
  enableLabel: true,
} as BarSvgProps<BarDatum>;
