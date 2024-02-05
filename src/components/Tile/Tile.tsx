import { styled } from '@mui/material';
import { Card } from '@mui/material';

export interface TileProps {
  title: string;
  details?: string | React.ReactNode;
  count: string | number;
  icon: React.ReactNode;
}

const TileRoot = styled(Card)({
  width: 220,
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
  marginBottom: 10 /*theme.spacing(2)*/,
  overflow: 'hidden',
  display: '-webkit-box',
  '-webkit-line-clamp': '2',
  '-webkit-box-orient': 'vertical',
}));

const Details = styled('div')(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.common.white,
  marginBottom: 10,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
}));

const Number = styled('div')(({ theme }) => ({
  fontSize: 32,
  fontWeight: 'bold',
  color: theme.palette.common.white,
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
      <Number>{count}</Number>
      <Icon>{icon}</Icon>
    </TileRoot>
  );
}
