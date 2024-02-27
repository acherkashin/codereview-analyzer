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
import { useClient } from '../../stores/AuthStore';
import { User } from '../../services/types';
import { useDebounce } from '../../hooks';
import { UserListItem } from './UserListItem';

export interface UserSearchBoxProps {
  label: string;
  user?: User;
  search: (value: string) => Promise<User[]>;
  onSelected: (user: User | undefined) => void;
  style?: React.CSSProperties | undefined;
}

export function UserSearchBox({ user, label, style, search, onSelected }: UserSearchBoxProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (open && debouncedValue) {
      setLoading(true);

      search(debouncedValue)
        .then(setOptions)
        .finally(() => setLoading(false));
    }
  }, [debouncedValue, open, search]);

  return (
    <Autocomplete
      style={style}
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
      renderOption={(props, item) => <UserListItem key={item.id} user={item} selected={item.id === user?.id} {...props} />}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
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
