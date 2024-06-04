import { Stack, styled } from '@mui/material';
import { Card } from '@mui/material';
import { TooltipPrompt } from '../TooltipPrompt';

export interface TileProps {
  title: string;
  details?: string | React.ReactNode;
  count: string | number;
  icon: React.ReactNode;
  description?: React.ReactNode;
}

const TileRoot = styled(Card)(({ theme }) => ({
  height: 150,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  margin: theme.spacing(1),
  padding: theme.spacing(1.5),
  backgroundColor: '#293164' /* Pastel color for the tile background */,
  position: 'relative',
  overflow: 'hidden',
}));

const Header = styled(Stack)(({ theme }) => ({
  color: theme.palette.common.white,
  flexShrink: 0,
  marginBottom: theme.spacing(1),
}));

const Title = styled('div')(({ theme }) => ({
  fontSize: 16,
  fontWeight: 'bold',
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
  bottom: theme.spacing(1),
  right: theme.spacing(1),
  fontSize: 24,
  color: '#333',
}));

export function Tile({ title, count, details, icon, description }: TileProps) {
  return (
    <TileRoot>
      <Header title={title} direction="row" justifyContent="space-between">
        <Title>{title}</Title>
        {description && <TooltipPrompt>{description}</TooltipPrompt>}
      </Header>
      <Details title={typeof details === 'string' ? details : undefined}>{details}</Details>
      <Number title={count.toString()}>{count}</Number>
      <Icon>{icon}</Icon>
    </TileRoot>
  );
}
