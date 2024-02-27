import { Avatar, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { User } from '../../services/types';

export interface UserListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  selected: boolean;
  user: User;
}

export function UserListItem({ user, selected, ...props }: UserListItemProps) {
  return (
    <ListItemButton key={user.id} component="li" alignItems="flex-start" selected={selected} {...props}>
      <ListItemAvatar>
        <Avatar alt={user.fullName} src={user.avatarUrl} />
      </ListItemAvatar>
      <ListItemText primary={user.fullName} secondary={user.userName} />
    </ListItemButton>
  );
}
