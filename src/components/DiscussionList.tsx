import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CommentList } from './CommentList';
import { Avatar, Link } from '@mui/material';
import { UserDiscussion } from '../clients/types';

export interface DiscussionListProps {
  discussions: UserDiscussion[];
}

export function DiscussionList({ discussions }: DiscussionListProps) {
  return (
    <ul>
      {discussions.map(({ id, comments, url, pullRequestName, reviewerAvatarUrl }) => {
        return (
          <Accordion key={id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Avatar src={reviewerAvatarUrl} />
              <Link underline="none" variant="subtitle2" href={url} target="_blank" rel="noreferrer">
                {pullRequestName}
              </Link>
            </AccordionSummary>
            <AccordionDetails>
              <CommentList
                comments={(comments ?? []).map(({ id, body, prAuthorAvatarUrl }) => ({
                  id: id,
                  noteText: body,
                  avatarUrl: prAuthorAvatarUrl,
                }))}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </ul>
  );
}
