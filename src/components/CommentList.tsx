import { UserComment, getNoteUrl } from './../utils/GitLabUtils';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';

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
              <a href={getNoteUrl(item)} target="_blank" rel="noreferrer">
                {item.mergeRequest.title}
              </a>
            }
            secondary={item.comment.body}
          />
        </ListItem>
      ))}
    </List>
  );
}
