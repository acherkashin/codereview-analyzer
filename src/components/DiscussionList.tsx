import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CommentList } from './CommentList';
import { Avatar, Link, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { UserDiscussion } from '../services/types';

export interface DiscussionListProps {
  discussions: UserDiscussion[];
}

export function DiscussionList({ discussions }: DiscussionListProps) {
  return (
    <div>
      {discussions.map(({ id, comments, url, pullRequestName, reviewerAvatarUrl }) => {
        return (
          <Accordion key={id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar src={reviewerAvatarUrl} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Link underline="none" variant="subtitle2" href={url} target="_blank" rel="noreferrer">
                      {pullRequestName}
                    </Link>
                  }
                />
              </ListItem>
            </AccordionSummary>
            <AccordionDetails>
              <CommentList
                comments={(comments ?? []).map(({ id, body, reviewerAvatarUrl, prAuthorName, reviewerName }) => ({
                  id: id,
                  noteText: body,
                  title: reviewerName,
                  avatarUrl: reviewerAvatarUrl,
                  authorName: prAuthorName,
                }))}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}
