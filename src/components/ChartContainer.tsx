import { Fullscreen } from '@mui/icons-material';
import { IconButton, Paper, Box, Typography, Stack } from '@mui/material';
import React, { CSSProperties, useState } from 'react';
import { TooltipPrompt } from './TooltipPrompt';

export interface ChartContainerProps {
  title: string;
  description?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  height?: number;
  children: React.ReactNode;
}

export function ChartContainer({ children, title, description, style, height = 500 }: ChartContainerProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const maximizeStyles: CSSProperties = isMaximized
    ? {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
        width: undefined,
        height: undefined,
        overflow: 'hidden',
      }
    : { margin: 10 };
  return (
    <Paper variant="outlined" component="section" style={{ ...style, ...maximizeStyles }}>
      <ChartHeader title={title} description={description} onMaximizeClick={() => setIsMaximized(!isMaximized)} />
      <Box style={{ height: isMaximized ? 'calc(100% - 40px)' : height }}>{children}</Box>
    </Paper>
  );
}

export interface ChartHeaderProps extends Pick<ChartContainerProps, 'description' | 'title'> {
  onMaximizeClick?: () => void;
}

function ChartHeader({ title, description, onMaximizeClick }: ChartHeaderProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="subtitle1" color="text.secondary" style={{ marginLeft: 16, marginRight: 16, flex: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" alignItems="center">
        {description && <TooltipPrompt>{description}</TooltipPrompt>}
        <IconButton onClick={onMaximizeClick}>
          <Fullscreen />
        </IconButton>
      </Stack>
    </Stack>
  );
}
