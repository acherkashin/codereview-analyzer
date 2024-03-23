import { Box, Paper, Typography } from '@mui/material';

export interface ChartContainerProps {
  title: string;
  style?: React.CSSProperties | undefined;
  children: React.ReactNode;
}

export function ChartContainer({ children, title, style }: ChartContainerProps) {
  return (
    <Paper variant="outlined" component="section" style={{ ...style }}>
      <Typography variant="subtitle1" textAlign="center">
        {title}
      </Typography>
      <Box style={{ height: 500 }}>{children}</Box>
    </Paper>
  );
}
