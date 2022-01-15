import React, { useState, useEffect, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { searchProjects } from '../utils/GitLabUtils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Gitlab } from '@gitbeaker/browser';
import { useDebounce } from '../hooks/useDebounce';
import { Credentials } from '../App';
import { ProjectSchema } from '@gitbeaker/core/dist/types/types';
import { Autocomplete, Avatar, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField } from '@mui/material';

export interface ProjectListProps {
  project: ProjectSchema;
  onProjectSelected: (project: ProjectSchema | null) => void;
}

export function ProjectList({ project, onProjectSelected }: ProjectListProps) {
  const [credentials] = useLocalStorage<Credentials | null>('credentials', null);
  const client = useMemo(() => new Gitlab(credentials), [credentials]);
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ProjectSchema[]>([]);
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (client && open && debouncedValue) {
      setLoading(true);
      searchProjects(client, debouncedValue)
        .then(setOptions)
        .finally(() => setLoading(false));
    }
  }, [client, debouncedValue, open]);

  return (
    <Autocomplete
      getOptionLabel={(option) => option.name_with_namespace}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      value={project}
      onChange={(_, newValue) => onProjectSelected(newValue)}
      onInputChange={(_, newInputValue) => setValue(newInputValue)}
      // reset client side filtering
      filterOptions={(x) => x}
      renderOption={(props, item) => (
        <ListItem key={item.id} alignItems="flex-start" {...props}>
          <ListItemButton selected={project?.id === item.id}>
            <ListItemAvatar>
              <Avatar alt={item.name} src={item.avatar_url} />
            </ListItemAvatar>
            <ListItemText primary={item.name_with_namespace} secondary={item.description} />
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
