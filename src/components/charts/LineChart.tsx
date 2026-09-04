import { LineSvgProps, ResponsiveLine, Serie } from '@nivo/line';
import { LegendProps } from '@nivo/legends';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNivoTheme } from './useNivoTheme';

export interface ILineChartProps extends LineSvgProps {
  legendXLabel?: string;
  legendYLabel?: string;
  data: Serie[];
  onLegendClick?: LegendProps['onClick'];
}

export function LineChart({ data, legendYLabel, legendXLabel, onLegendClick, ...otherProps }: ILineChartProps) {
  const muiTheme = useTheme();
  const compact = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const nivoTheme = useNivoTheme();
  const showLegend = !compact && data.length <= 8;
  const maximumValue = Math.max(
    0,
    ...data.flatMap((series) => series.data.map((point) => (typeof point.y === 'number' ? point.y : Number(point.y) || 0)))
  );
  const integerTickValues =
    maximumValue <= 10 ? Array.from({ length: Math.ceil(maximumValue) + 1 }, (_, value) => value) : undefined;

  // https://github.com/plouc/nivo/blob/master/storybook/stories/line/Line.stories.tsx#L114
  return (
    <ResponsiveLine
      data={data}
      theme={nivoTheme}
      enableSlices="x"
      margin={{ top: 20, right: showLegend ? 160 : 24, bottom: 64, left: compact ? 48 : 64 }}
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
      animate={false}
      axisBottom={{
        format: '%b %y',
        tickValues: 'every month',
        legend: legendXLabel,
        legendOffset: 52,
        legendPosition: 'middle',
        tickRotation: compact ? -45 : 0,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        tickValues: integerTickValues,
        legend: legendYLabel,
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      enablePoints={data.length <= 8}
      pointSize={8}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={
        showLegend
          ? [
              {
                anchor: 'top-right',
                direction: 'column',
                justify: false,
                translateX: 144,
                translateY: 0,
                itemsSpacing: 3,
                itemDirection: 'left-to-right',
                itemWidth: 132,
                itemHeight: 18,
                itemOpacity: 0.82,
                symbolSize: 10,
                symbolShape: 'circle',
                effects: [{ on: 'hover', style: { itemOpacity: 1 } }],
                onClick: onLegendClick,
              },
            ]
          : []
      }
      {...otherProps}
    />
  );
}
