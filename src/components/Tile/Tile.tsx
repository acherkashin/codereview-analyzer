import { styled } from '@mui/material';
import { Card } from '@mui/material';

export interface TileProps {
  title: string;
  count: string | number;
  color: React.CSSProperties['color'];
  icon: React.ReactNode;
}

const TileRoot = styled(Card)({
  width: 200,
  height: 100,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  margin: 10,
  padding: 15,
  backgroundColor: '#293164' /* Pastel color for the tile background */,
  position: 'relative',
});

const Title = styled('div')(({ theme }) => ({
  fontSize: 18,
  fontWeight: 'bold',
  color: theme.palette.common.white,
  marginBottom: 10 /*theme.spacing(2)*/,
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

export function Tile({ title, count, color, icon }: TileProps) {
  return (
    <TileRoot>
      <Title>{title}</Title>
      <Number>{count}</Number>
      <Icon>{icon}</Icon>
    </TileRoot>
  );
}
