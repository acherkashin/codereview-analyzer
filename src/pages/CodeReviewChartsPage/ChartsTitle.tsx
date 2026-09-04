import Typography from '@mui/material/Typography';
import { PropsWithChildren } from 'react';

export function ChartsTitle({ children }: PropsWithChildren<{}>) {
  return (
    <Typography
      variant="h4"
      component="h2"
      sx={{
        mt: 2,
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}
