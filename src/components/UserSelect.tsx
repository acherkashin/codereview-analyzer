import { useEffect, useState } from 'react';
import { Autocomplete, Avatar, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField } from '@mui/material';
import { useClient } from '../stores/AuthStore';
import { User } from '../clients/types';

export interface UserListProps {
  label: string;
  user: User | null;
  onUserSelected: (user: User | null) => void;
}

export function UserSelect({ user, label, onUserSelected }: UserListProps) {
  const client = useClient();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    client.getUsers().then(setUsers);
  }, [client]);

  return (
    <Autocomplete
      value={user}
      options={users}
      getOptionLabel={(option) => option.fullName}
      onChange={(_, newValue) => onUserSelected(newValue)}
      renderOption={(props, item) => (
        <ListItem key={item.id} alignItems="flex-start" /*disabled={item.state === 'blocked'}*/ {...props}>
          <ListItemButton selected={user?.id === item.id}>
            <ListItemAvatar>
              <Avatar alt={item.fullName} src={item.avatarUrl} />
            </ListItemAvatar>
            <ListItemText primary={item.fullName} secondary={item.userName} />
          </ListItemButton>
        </ListItem>
      )}
      renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
    />
  );
}

export default UserSelect;
