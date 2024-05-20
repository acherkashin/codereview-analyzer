import { PieSvgProps, ResponsivePie } from '@nivo/pie';
import { PieChartDatum } from '../../utils/PieChartUtils';

export interface PieChartProps extends Pick<PieSvgProps<PieChartDatum>, 'onClick' | 'tooltip' | 'data' | 'colors'> {}

export function PieChart(props: PieChartProps) {
  return <ResponsivePie {...pieChartSettings} {...props} />;
}

export const pieChartSettings = {
  padding: 0.2,
  labelTextColor: 'inherit:darker(1.4)',
  labelSkipWidth: 16,
  labelSkipHeight: 16,
  margin: { top: 40, right: 80, bottom: 80, left: 80 },
  innerRadius: 0.5,
  padAngle: 0.7,
  cornerRadius: 3,
  activeOuterRadiusOffset: 8,
  borderWidth: 1,
  animate: false,
  borderColor: {
    from: 'color',
    modifiers: [['darker', 0.2]],
  },
  arcLinkLabelsSkipAngle: 10,
  arcLinkLabelsTextColor: '#333333',
  arcLinkLabelsThickness: 2,
  arcLabelsSkipAngle: 10,
  defs: [
    {
      id: 'dots',
      type: 'patternDots',
      background: 'inherit',
      color: 'rgba(255, 255, 255, 0.3)',
      size: 4,
      padding: 1,
      stagger: true,
    },
    {
      id: 'lines',
      type: 'patternLines',
      background: 'inherit',
      color: 'rgba(255, 255, 255, 0.3)',
      rotation: -45,
      lineWidth: 6,
      spacing: 10,
    },
  ],
} as Omit<PieSvgProps<PieChartDatum>, 'data' | 'width' | 'height'>;
