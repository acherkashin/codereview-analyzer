import { useMemo, useEffect, useState } from 'react';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { Autocomplete, Avatar, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField } from '@mui/material';
import { Credentials } from '../App';
import { Gitlab } from '@gitbeaker/browser';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface UserListProps {
  label: string;
  user: UserSchema | null;
  onUserSelected: (user: UserSchema | null) => void;
}

export function UserList({ user, label, onUserSelected }: UserListProps) {
  const [credentials] = useLocalStorage<Credentials | null>('credentials', null);
  const client = useMemo(() => new Gitlab(credentials), [credentials]);
  const [users, setUsers] = useState<UserSchema[]>([]);

  useEffect(() => {
    client.Users.all({ perPage: 100 }).then((users) => {
      setUsers(users);
    });
  }, [client]);

  return (
    <Autocomplete
      value={user}
      options={users}
      getOptionLabel={(option) => option.name}
      onChange={(_, newValue) => onUserSelected(newValue)}
      renderOption={(props, item) => (
        <ListItem key={item.id} alignItems="flex-start" disabled={item.state === 'blocked'} {...props}>
          <ListItemButton selected={user?.id === item.id}>
            <ListItemAvatar>
              <Avatar alt={item.name} src={item.avatar_url} />
            </ListItemAvatar>
            <ListItemText primary={item.name} secondary={item.username} />
          </ListItemButton>
        </ListItem>
      )}
      renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
    />
  );
}

export default UserList;
