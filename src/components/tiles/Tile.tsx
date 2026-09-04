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
  height: 144,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  margin: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  overflow: 'hidden',
}));

const Header = styled(Stack)(({ theme }) => ({
  color: theme.palette.text.secondary,
  flexShrink: 0,
  marginBottom: theme.spacing(1),
}));

const Title = styled('div')(({ theme }) => ({
  fontSize: 16,
  fontWeight: 650,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: '2',
  WebkitBoxOrient: 'vertical',
}));

const Details = styled('div')(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.text.secondary,
  marginBottom: 10,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
}));

const Number = styled('div')(({ theme }) => ({
  fontSize: 34,
  lineHeight: 1.05,
  letterSpacing: '-0.035em',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 750,
  color: theme.palette.text.primary,
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
  display: 'grid',
  placeItems: 'center',
  width: 42,
  height: 42,
  borderRadius: 12,
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.action.selected,
  '& svg': { color: `${theme.palette.primary.main} !important`, fontSize: 24 },
}));

export function Tile({ title, count, details, icon, description }: TileProps) {
  return (
    <TileRoot>
      <Header direction="row" sx={{ justifyContent: 'space-between' }}>
        <Title title={title}>{title}</Title>
        {description && <TooltipPrompt>{description}</TooltipPrompt>}
      </Header>
      <Details title={typeof details === 'string' ? details : undefined}>{details}</Details>
      <Number title={count.toString()}>{count}</Number>
      <Icon>{icon}</Icon>
    </TileRoot>
  );
}
