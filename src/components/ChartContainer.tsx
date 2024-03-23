import { Fullscreen } from '@mui/icons-material';
import { IconButton, Paper, Box, Typography, Hidden } from '@mui/material';
import { CSSProperties, useState } from 'react';

export interface ChartContainerProps {
  title: string;
  style?: React.CSSProperties | undefined;
  children: React.ReactNode;
}

export function ChartContainer({ children, title, style }: ChartContainerProps) {
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
      <Typography variant="subtitle1" color="text.secondary" style={{ marginLeft: 16 }}>
        {title}{' '}
        <IconButton onClick={() => setIsMaximized(!isMaximized)}>
          <Fullscreen />
        </IconButton>
      </Typography>
      <Box style={{ height: isMaximized ? 'calc(100% - 40px)' : 500 }}>{children}</Box>
    </Paper>
  );
}
