import React from 'react';
import { Property } from 'csstype';

export interface BaseChartTooltipProps {
  color?: string | null;
  style?: React.CSSProperties;
}

export function BaseChartTooltip({ color, children, style }: React.PropsWithChildren<BaseChartTooltipProps>) {
  return (
    <div
      style={{
        background: 'white',
        color: 'inherit',
        fontSize: 'inherit',
        borderRadius: 2,
        boxShadow: 'rgb(0 0 0 / 25%) 0px 1px 2px',
        padding: '5px 9px',
        ...style,
      }}
    >
      <div style={{ whiteSpace: 'pre', display: 'flex', alignItems: 'center' }}>
        {color && <SquareMarker color={color} />}
        {children}
      </div>
    </div>
  );
}

export interface SquareMarkerProps {
  color: Property.BackgroundColor | undefined;
}

export function SquareMarker({ color }: SquareMarkerProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        backgroundColor: color,
        marginRight: 7,
      }}
    ></span>
  );
}
