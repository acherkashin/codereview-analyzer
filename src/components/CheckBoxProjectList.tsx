import { Avatar, Checkbox, List, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Project } from '../services/types';

export interface CheckBoxProjectListProps {
  projects: Project[];
  onChange: (projectIds: string[]) => void;
}

export function CheckBoxProjectList({ projects, onChange }: CheckBoxProjectListProps) {
  const [checkedProjects, setCheckedProjects] = useState<string[]>([]);
  const handleChange = useCallback(
    (projectId: string, checked: boolean) => {
      if (checked) {
        setCheckedProjects([...checkedProjects, projectId]);
      } else {
        setCheckedProjects(checkedProjects.filter((item) => item !== projectId));
      }
    },
    [checkedProjects]
  );

  useEffect(() => {
    onChange(checkedProjects);
  }, [checkedProjects, onChange]);

  return (
    <List>
      {projects.map((item) => (
        <CheckBoxProjectItem key={item.id} {...item} onChange={handleChange} checked={checkedProjects.includes(item.id)} />
      ))}
    </List>
  );
}

export interface CheckBoxProjectItemProps extends Project {
  checked: boolean;
  onChange: (projectId: string, checked: boolean) => void;
}

export function CheckBoxProjectItem({ id, name, description, avatarUrl, checked, onChange }: CheckBoxProjectItemProps) {
  return (
    <ListItem
      secondaryAction={<Checkbox edge="end" onChange={(_, value) => onChange(id, value)} checked={checked} />}
      disablePadding
    >
      <ListItemButton>
        <ListItemAvatar>
          <Avatar alt={`Avatar of project ${name}`} src={avatarUrl} />
        </ListItemAvatar>
        <ListItemText primary={name} secondary={description} />
      </ListItemButton>
    </ListItem>
  );
}
