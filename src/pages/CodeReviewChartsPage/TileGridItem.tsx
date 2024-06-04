import { Grid } from '@mui/material';

export function TileGridItem({ children }: React.PropsWithChildren) {
  return (
    <Grid item xs={6} md={4} lg={3} xl={2}>
      {children}
    </Grid>
  );
}
