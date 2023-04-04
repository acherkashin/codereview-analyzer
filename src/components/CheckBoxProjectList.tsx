import { Avatar, Checkbox, List, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

export interface ProjectItem {
  id: number;
  name: string;
  avatarUrl: string;
  description?: string;
}

export interface CheckBoxProjectListProps {
  projects: ProjectItem[];
  onChange: (projectIds: number[]) => void;
}

export function CheckBoxProjectList({ projects, onChange }: CheckBoxProjectListProps) {
  const [checkedProjects, setCheckedProjects] = useState<number[]>([]);
  const handleChange = useCallback(
    (projectId: number, checked: boolean) => {
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

export interface CheckBoxProjectItemProps extends ProjectItem {
  checked: boolean;
  onChange: (projectId: number, checked: boolean) => void;
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
