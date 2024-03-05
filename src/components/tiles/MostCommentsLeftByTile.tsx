import { Avatar } from '@mui/material';
import { User } from '../../services/types';
import { Tile } from './Tile';

export interface MostCommentsLeftByTileProps {
  user: User;
  count: number;
}

export function MostCommentsLeftByTile({ user, count }: MostCommentsLeftByTileProps) {
  return (
    <Tile
      count={count}
      title={`Most comments left by ${user.fullName}`}
      icon={<Avatar alt={`${user.fullName}'s avatar`} sizes="40px" title={user.fullName} src={user.avatarUrl} />}
    />
  );
}
