import { ResponsiveScatterPlot, ScatterPlotDatum, ScatterPlotTooltip } from '@nivo/scatterplot';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest } from '../../../services/types';
import { useMemo } from 'react';
import { BaseChartTooltip } from '../../tooltips';
import { Stack } from '@mui/material';

export interface ChangesToDiscussionsCorrelationChartProps {
  pullRequests: PullRequest[];
}

export function ChangesToDiscussionsCorrelationChart({ pullRequests }: ChangesToDiscussionsCorrelationChartProps) {
  const data = useMemo(() => {
    const points: ScatterPlotDatum[] = pullRequests.map((item) => ({
      x: item.changedFilesCount,
      y: item.discussions.length,
      id: item.id,
      prName: item.title,
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
        margin={{ top: 60, right: 30, bottom: 70, left: 70 }}
        xScale={{ type: 'linear', min: 0, max: 'auto' }}
        xFormat=">-.2f"
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        yFormat=">-.2f"
        blendMode="multiply"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Changed Files Count',
          legendPosition: 'middle',
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Discussions Started',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        tooltip={Tooltip}
      />
    </ChartContainer>
  );
}

const Tooltip: ScatterPlotTooltip<ScatterPlotDatum> = (props) => {
  const prName = (props.node.data as any).prName;

  return (
    <BaseChartTooltip style={{ width: 400 }}>
      <Stack>
        <strong style={{ whiteSpace: 'break-spaces' }}>{prName}</strong>
        <div>Files Changed: {props.node.data.x.toString()}</div>
        <div>Discussions Started: {props.node.data.y.toString()}</div>
      </Stack>
    </BaseChartTooltip>
  );
};
