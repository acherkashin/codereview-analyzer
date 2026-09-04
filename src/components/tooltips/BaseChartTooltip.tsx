import React from 'react';
import { Property } from 'csstype';
import { Box } from '@mui/material';

export interface BaseChartTooltipProps {
  color?: string | null;
  style?: React.CSSProperties;
}

export function BaseChartTooltip({ color, children, style }: React.PropsWithChildren<BaseChartTooltipProps>) {
  return (
    <Box
      sx={{
        maxWidth: 'min(400px, calc(100vw - 32px))',
        p: 1.25,
        color: 'text.primary',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.25,
        boxShadow: 8,
        fontSize: '0.75rem',
      }}
      style={style}
    >
      <div style={{ whiteSpace: 'normal', display: 'flex', alignItems: 'center' }}>
        {color && <SquareMarker color={color} />}
        {children}
      </div>
    </Box>
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
