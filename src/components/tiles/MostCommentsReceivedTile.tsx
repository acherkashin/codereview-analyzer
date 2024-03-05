import { Avatar } from '@mui/material';
import { User } from '../../services/types';
import { Tile } from './Tile';

export interface MostCommentsReceivedTileProps {
  user: User;
  count: number;
}

export function MostCommentsReceivedTile({ user, count }: MostCommentsReceivedTileProps) {
  return (
    <Tile
      count={count}
      title={`Most comments received by ${user.fullName}`}
      icon={<Avatar alt={`${user.fullName}'s avatar`} sizes="40px" title={user.fullName} src={user.avatarUrl} />}
    />
  );
}
