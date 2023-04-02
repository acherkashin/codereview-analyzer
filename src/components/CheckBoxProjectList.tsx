import { Avatar, Checkbox, List, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';

export interface ProjectItem {
  id: number;
  name: string;
  avatarUrl: string;
  description?: string;
}

export interface CheckBoxProjectListProps {
  projects: ProjectItem[];
}

export function CheckBoxProjectList({ projects }: CheckBoxProjectListProps) {
  return (
    <List>
      {projects.map((item) => (
        <CheckBoxProjectItem key={item.id} {...item} onChange={() => {}} checked={false} />
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
