import { Box, CircularProgress } from '@mui/material';

export function FullSizeProgress() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <CircularProgress size={60} />
    </Box>
  );
}
