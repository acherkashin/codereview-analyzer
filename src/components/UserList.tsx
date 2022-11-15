import { Avatar } from '@mui/material';

interface UserListProps {
  users?: UserItemProps[];
}

export function UserList({ users }: UserListProps) {
  if (!users) {
    return <div>No Reviewers</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <div style={{ fontWeight: 'bold' }}>{users.length} Reviewers</div>
      <ul style={{ padding: 0 }}>
        {users.map((item) => (
          <UserItem key={item.name} {...item} />
        ))}
      </ul>
    </div>
  );
}

export interface UserItemProps {
  component?: string;
  name: string;
  avatarUrl: string;
  userUrl: string;
}

export function UserItem({ name, avatarUrl, userUrl, component }: UserItemProps) {
  const Component = (component ?? 'li') as any;

  return (
    <Component style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Avatar alt={`${name}'s avatar`} style={{ width: 24, height: 24, marginRight: 4 }} src={avatarUrl} />
      <a href={userUrl} target="_blank" rel="noreferrer">
        {name}
      </a>
    </Component>
  );
}
