import { LineSvgProps, ResponsiveLine, Serie } from '@nivo/line';
import { LegendProps } from '@nivo/legends';

export interface ILineChartProps extends LineSvgProps {
  legendXLabel?: string;
  legendYLabel?: string;
  data: Serie[];
  onLegendClick?: LegendProps['onClick'];
}

export function LineChart({ data, legendYLabel, legendXLabel, onLegendClick, ...otherProps }: ILineChartProps) {
  // https://github.com/plouc/nivo/blob/master/storybook/stories/line/Line.stories.tsx#L114
  return (
    <ResponsiveLine
      data={data}
      enableSlices="x"
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{
        type: 'time',
        format: '%Y-%m-%d',
        useUTC: false,
        precision: 'month',
      }}
      xFormat="time:%Y-%m-%d"
      yScale={{
        type: 'linear',
        min: 0,
        max: 'auto',
      }}
      yFormat=" >-.0r"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        format: '%b %y',
        tickValues: 'every month',
        legend: legendXLabel,
        legendOffset: -12,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: legendYLabel,
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      pointSize={10}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: 'top-right',
          direction: 'column',
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: 'left-to-right',
          itemWidth: 80,
          itemHeight: 14,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: 'circle',
          symbolBorderColor: 'rgba(0, 0, 0, .5)',
          effects: [
            {
              on: 'hover',
              style: {
                itemBackground: 'rgba(0, 0, 0, .03)',
                itemOpacity: 1,
              },
            },
          ],
          onClick: onLegendClick,
        },
      ]}
      {...otherProps}
    />
  );
}
