import { Avatar, Link, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { MarkdownControl } from './MarkdownControl';

export interface CommentListProps {
  comments: CommentItemProps[];
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <List>
      {comments.map(({ id, ...item }) => (
        <CommentItem key={id} {...item} />
      ))}
    </List>
  );
}

export interface CommentItemProps {
  id: string;
  avatarUrl: string;
  title?: string;
  commentUrl?: string;
  noteText: string;
}

export function CommentItem({ avatarUrl, title, commentUrl, noteText: text }: Omit<CommentItemProps, 'id'>) {
  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar src={avatarUrl} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Link underline="none" variant="subtitle2" href={commentUrl} target="_blank" rel="noreferrer">
            {title}
          </Link>
          // TODO: show icon on hover that indicates that link will be opened in new window
        }
        secondary={<MarkdownControl markdown={text} />}
      />
    </ListItem>
  );
}
