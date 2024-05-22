import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, CircularProgress, FilterOptionsState, TextField, createFilterOptions } from '@mui/material';
import { User } from '../../services/types';
import { useDebounce } from '../../hooks';
import { UserListItem } from './UserListItem';
import { styled } from '@mui/system';

export interface UsersListProps {
  label: string;
  user?: User | null;
  users: ((value: string) => Promise<User[]>) | User[] | null;
  onSelected: (user: User | undefined) => void;
  style?: React.CSSProperties | undefined;
}

const emptyUsersArray: User[] = [];

export function UsersList({
  /**
   * null should be used instead of "undefined" to prevent Autocomplete warning about
   * switching between controlled and uncontrolled value state
   * */
  user = null,
  label,
  style,
  users = emptyUsersArray,
  onSelected,
}: UsersListProps) {
  const [open, setOpen] = useState(false);
  const isApiSearchMode = typeof users === 'function';
  const [options, setOptions] = useState<User[]>(isApiSearchMode ? [] : users!);
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce(value, 300);

  const filter = useMemo(() => {
    return filterOptions(isApiSearchMode, options);
  }, [isApiSearchMode, options]);

  useEffect(() => {
    if (!isApiSearchMode) return;

    if (open && debouncedValue) {
      setLoading(true);

      users(debouncedValue)
        .then(setOptions)
        .finally(() => setLoading(false));
    }
  }, [debouncedValue, isApiSearchMode, open, users]);

  return (
    <UsersListAutocomplete
      style={style}
      getOptionLabel={(option) => option.displayName}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      value={user}
      onChange={(_, newValue) => onSelected(newValue ?? undefined)}
      onInputChange={(_, newInputValue) => setValue(newInputValue)}
      filterOptions={filter}
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

function filterOptions(isApiSearchMode: boolean, users: User[]) {
  if (isApiSearchMode) {
    // search happens on backend, so we don't need to do anything on frontend
    return (x: User[], state: FilterOptionsState<User>) => x;
  } else {
    return createFilterOptions<User>({
      ignoreCase: true,
      stringify: (user) => (user.displayName || '') + (user.fullName || '') + (user.userName || ''),
    });
  }
}

const UsersListAutocomplete = styled(Autocomplete)({
  minWidth: 300,
}) as any as typeof Autocomplete;
