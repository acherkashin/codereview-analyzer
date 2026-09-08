import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import { IconButton, Paper, Box, Typography, Stack, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TooltipPrompt } from './TooltipPrompt';

export interface ChartContainerProps {
  title: string;
  description?: React.ReactNode;
  descriptionTooltipMaxWidth?: number;
  headerActions?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  height?: number;
  children: React.ReactNode;
}

export function ChartContainer({
  children,
  title,
  description,
  descriptionTooltipMaxWidth,
  headerActions,
  style,
  height = 440,
}: ChartContainerProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isMaximized) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMaximized(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMaximized]);

  return (
    <Paper
      variant="outlined"
      component="section"
      role={isMaximized ? 'dialog' : undefined}
      aria-modal={isMaximized || undefined}
      aria-label={`${title} chart`}
      style={style}
      sx={{
        m: 0,
        overflow: 'hidden',
        ...(isMaximized && {
          position: 'fixed',
          inset: { xs: 1, sm: 2 },
          zIndex: (theme) => theme.zIndex.modal + 1,
          width: 'auto !important',
          height: 'auto !important',
          backgroundColor: 'background.paper',
          boxShadow: 24,
        }),
      }}
    >
      <ChartHeader
        title={title}
        description={description}
        descriptionTooltipMaxWidth={descriptionTooltipMaxWidth}
        headerActions={headerActions}
        isMaximized={isMaximized}
        onMaximizeClick={() => setIsMaximized(!isMaximized)}
      />
      <Box sx={{ height: isMaximized ? 'calc(100% - 52px)' : height, minWidth: 0 }}>{children}</Box>
    </Paper>
  );
}

export interface ChartHeaderProps
  extends Pick<ChartContainerProps, 'description' | 'descriptionTooltipMaxWidth' | 'headerActions' | 'title'> {
  onMaximizeClick?: () => void;
  isMaximized?: boolean;
}

function ChartHeader({
  title,
  description,
  descriptionTooltipMaxWidth,
  headerActions,
  onMaximizeClick,
  isMaximized,
}: ChartHeaderProps) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 52,
        px: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="subtitle1"
        style={{ marginLeft: 8, marginRight: 16, flex: 1 }}
        sx={{
          color: 'text.primary',
          fontWeight: 650,
        }}
      >
        {title}
      </Typography>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
        }}
      >
        {description && <TooltipPrompt maxWidth={descriptionTooltipMaxWidth}>{description}</TooltipPrompt>}
        {headerActions}
        <Tooltip title={isMaximized ? 'Exit full screen' : 'View full screen'}>
          <IconButton aria-label={isMaximized ? 'Exit full screen' : 'View full screen'} onClick={onMaximizeClick}>
            {isMaximized ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
