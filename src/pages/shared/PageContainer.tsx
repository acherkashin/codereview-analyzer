import { styled } from '@mui/material/styles';

export const PageContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: theme.spacing(3, 3, 5),
  [theme.breakpoints.up('lg')]: { paddingLeft: theme.spacing(4), paddingRight: theme.spacing(4) },
  [theme.breakpoints.down('sm')]: { padding: theme.spacing(2, 2, 4) },
}));
