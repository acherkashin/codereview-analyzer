import { UserComment, getNoteUrl } from './../utils/GitLabUtils';
import { Avatar, Link, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';
import { MarkdownControl } from './MarkdownControl';

export interface CommentListProps {
  comments: UserComment[];
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <List>
      {comments.map((item) => (
        <ListItem key={item.comment.id}>
          <ListItemAvatar>
            <Avatar src={item.comment.author.avatar_url} />
          </ListItemAvatar>
          <ListItemText
            primary={
              <Link underline="none" variant="subtitle2" href={getNoteUrl(item)} target="_blank" rel="noreferrer">
                {item.mergeRequest.title}
              </Link>
            }
            secondary={<MarkdownControl markdown={item.comment.body} />}
          />
        </ListItem>
      ))}
    </List>
  );
}
