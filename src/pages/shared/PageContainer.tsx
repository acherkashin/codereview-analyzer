import { styled } from '@mui/material/styles';

export const PageContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: theme.spacing(2),
  boxSizing: 'border-box',
}));
