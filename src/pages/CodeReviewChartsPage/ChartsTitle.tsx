import Typography from '@mui/material/Typography';
import { PropsWithChildren } from 'react';

export function ChartsTitle({ children }: PropsWithChildren<{}>) {
  return (
    <Typography variant="h3" component="h2" ml={3}>
      {children}
    </Typography>
  );
}
