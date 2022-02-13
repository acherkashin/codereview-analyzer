import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getDiscussionAuthor, UserDiscussion } from './../utils/GitLabUtils';

export interface DiscussionListProps {
  discussions: UserDiscussion[];
}

export function DiscussionList({ discussions }: DiscussionListProps) {
  return (
    <ul>
      {discussions.map((item) => (
        <Accordion key={item.discussion.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Merge Request: {item.mergeRequest.title}</Typography>
            <Typography>Author: {item.mergeRequest.author.username}</Typography>
            <Typography>Reviewer: {getDiscussionAuthor(item.discussion)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {item.discussion.notes?.map((item) => (
              <div key={item.id}>{item.body}</div>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </ul>
  );
}
