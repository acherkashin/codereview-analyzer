import styled from '@emotion/styled';
import { Card } from '@mui/material';

export interface TileProps {
  title: string;
  count: number;
  color: React.CSSProperties['color'];
}

const TileRoot = styled(Card)({
  width: 300,
  height: 150,
  display: 'flex',
  flexDirection: 'column',
});

export function Tile({ title, count, color }: TileProps) {
  return (
    <TileRoot style={{ backgroundColor: color }}>
      {title} - {count}
    </TileRoot>
  );
}
