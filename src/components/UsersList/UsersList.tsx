import { useEffect, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { User } from '../../services/types';
import { useDebounce } from '../../hooks';
import { UserListItem } from './UserListItem';
import { styled } from '@mui/system';

export interface UsersListProps {
  label: string;
  user?: User | null;
  users: ((value: string) => Promise<User[]>) | User[];
  onSelected: (user: User | undefined) => void;
  style?: React.CSSProperties | undefined;
}

export function UsersList({ user, label, style, users, onSelected }: UsersListProps) {
  const [open, setOpen] = useState(false);
  const isSearchMode = typeof users === 'function';
  const [options, setOptions] = useState<User[]>(isSearchMode ? [] : users);
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (!isSearchMode) return;

    if (open && debouncedValue) {
      setLoading(true);

      users(debouncedValue)
        .then(setOptions)
        .finally(() => setLoading(false));
    }
  }, [debouncedValue, isSearchMode, open, users]);

  return (
    <UsersListAutocomplete
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
      filterOptions={isSearchMode ? (x) => x : undefined}
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

const UsersListAutocomplete = styled(Autocomplete)({
  minWidth: 300,
}) as any as typeof Autocomplete;
