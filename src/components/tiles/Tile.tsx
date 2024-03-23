import { styled } from '@mui/material';
import { Card } from '@mui/material';

export interface TileProps {
  title: string;
  details?: string | React.ReactNode;
  count: string | number;
  icon: React.ReactNode;
}

const TileRoot = styled(Card)({
  minWidth: 220,
  height: 110,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  margin: 10,
  padding: 15,
  backgroundColor: '#293164' /* Pastel color for the tile background */,
  position: 'relative',
  overflow: 'hidden',
});

const Title = styled('div')(({ theme }) => ({
  fontSize: 16,
  fontWeight: 'bold',
  color: theme.palette.common.white,
  flexShrink: 0,
  marginBottom: 10 /*theme.spacing(2)*/,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: '2',
  WebkitBoxOrient: 'vertical',
}));

const Details = styled('div')(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.common.white,
  opacity: 0.7,
  marginBottom: 10,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
}));

const Number = styled('div')(({ theme }) => ({
  fontSize: 32,
  fontWeight: 'bold',
  color: theme.palette.common.white,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  width: 'calc(100% - 48px)',
}));

const Icon = styled('i')(({ theme }) => ({
  position: 'absolute',
  bottom: 10,
  right: 10,
  fontSize: 24,
  color: '#333',
}));

export function Tile({ title, count, details, icon }: TileProps) {
  return (
    <TileRoot>
      <Title title={title}>{title}</Title>
      <Details title={typeof details === 'string' ? details : undefined}>{details}</Details>
      <Number title={count.toString()}>{count}</Number>
      <Icon>{icon}</Icon>
    </TileRoot>
  );
}
