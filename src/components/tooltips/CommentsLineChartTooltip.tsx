import { SquareMarker } from './BaseChartTooltip';
import { SliceTooltipProps } from '@nivo/line';

export function CommentsLineChartTooltip({ slice }: SliceTooltipProps) {
  return (
    <div
      style={{
        background: 'white',
        padding: '9px 12px',
        border: '1px solid #ccc',
      }}
    >
      {slice.points
        .toSorted((a, b) => parseInt(b.data.y.toString()) - parseInt(a.data.y.toString()))
        .map((point) => (
          <div key={point.id} style={{ padding: '3px 0' }}>
            <SquareMarker color={point.serieColor} />
            <span>{point.serieId}</span> <strong style={{ float: 'right', marginLeft: 16 }}>{point.data.y.toString()}</strong>
          </div>
        ))}
    </div>
  );
}
