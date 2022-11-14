import { Paper, Typography } from '@mui/material';

export interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

export function ChartContainer({ children, title }: ChartContainerProps) {
  return (
    <Paper variant="outlined" square component="section">
      <Typography variant="subtitle1">{title}</Typography>
      {children}
    </Paper>
  );
}
