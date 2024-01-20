import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Avatar,
  CircularProgress,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
} from '@mui/material';
import { useClient } from '../stores/AuthStore';
import { User } from '../clients/types';
import { useDebounce } from '../hooks';

export interface UserListProps {
  label: string;
  user?: User;
  onSelected: (user: User | undefined) => void;
}

export function UserSelect({ user, label, onSelected }: UserListProps) {
  const client = useClient();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (client && open && debouncedValue) {
      setLoading(true);

      client
        .searchUsers(debouncedValue)
        .then(setOptions)
        .finally(() => setLoading(false));
    }
  }, [client, debouncedValue, open]);

  return (
    <Autocomplete
      getOptionLabel={(option) => option.fullName}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      value={user}
      onChange={(_, newValue) => onSelected(newValue ?? undefined)}
      onInputChange={(_, newInputValue) => setValue(newInputValue)}
      // reset client side filtering
      filterOptions={(x) => x}
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
      renderInput={(params) => (
        <TextField
          {...params}
          label="Users"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
