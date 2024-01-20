import React, { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useDebounce } from '../hooks/useDebounce';
import { Autocomplete, Avatar, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField } from '@mui/material';
import { useClient } from '../stores/AuthStore';
import { Project } from '../clients/types';

export interface ProjectListProps {
  project?: Project;
  onSelected: (project: Project | undefined) => void;
}

export function ProjectList({ project, onSelected }: ProjectListProps) {
  const client = useClient();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (client && open && debouncedValue) {
      setLoading(true);

      client
        .searchProjects(debouncedValue)
        .then(setOptions)
        .finally(() => setLoading(false));
    }
  }, [client, debouncedValue, open]);

  return (
    <Autocomplete
      getOptionLabel={(option) => option.name}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      value={project}
      onChange={(_, newValue) => onSelected(newValue ?? undefined)}
      onInputChange={(_, newInputValue) => setValue(newInputValue)}
      // reset client side filtering
      filterOptions={(x) => x}
      renderOption={(props, item) => (
        <ListItem key={item.id} alignItems="flex-start" {...props}>
          <ListItemButton selected={project?.id === item.id}>
            <ListItemAvatar>
              <Avatar alt={item.name} src={item.avatarUrl} />
            </ListItemAvatar>
            <ListItemText primary={item.name} secondary={item.description} />
          </ListItemButton>
        </ListItem>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Projects"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}
