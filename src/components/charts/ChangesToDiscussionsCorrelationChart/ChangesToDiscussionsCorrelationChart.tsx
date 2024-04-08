import { ResponsiveScatterPlot, ScatterPlotDatum } from '@nivo/scatterplot';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest } from '../../../services/types';
import { useMemo } from 'react';

export interface ChangesToDiscussionsCorrelationChartProps {
  pullRequests: PullRequest[];
}

export function ChangesToDiscussionsCorrelationChart({ pullRequests }: ChangesToDiscussionsCorrelationChartProps) {
  const data = useMemo(() => {
    const points: ScatterPlotDatum[] = pullRequests.map((item) => ({
      x: item.changedFilesCount,
      y: item.discussions.length,
    }));

    return [
      {
        id: 'Pull Requests',
        data: points,
      },
    ];
  }, [pullRequests]);

  return (
    <ChartContainer title={'Changes to Discussions correlation'}>
      <ResponsiveScatterPlot
        data={data}
        margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
        xScale={{ type: 'linear', min: 0, max: 'auto' }}
        xFormat=">-.2f"
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        yFormat=">-.2f"
        blendMode="multiply"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          //   orient: 'bottom',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'weight',
          legendPosition: 'middle',
          legendOffset: 46,
          //   truncateTickAt: 0,
        }}
        axisLeft={{
          //   orient: 'left',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'size',
          legendPosition: 'middle',
          legendOffset: -60,
          //   truncateTickAt: 0,
        }}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 130,
            translateY: 0,
            itemWidth: 100,
            itemHeight: 12,
            itemsSpacing: 5,
            itemDirection: 'left-to-right',
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
    </ChartContainer>
  );
}
