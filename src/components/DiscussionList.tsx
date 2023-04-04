import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getDiscussionAuthor, UserDiscussion } from './../utils/GitLabUtils';
import { CommentList } from './CommentList';
import { Avatar, Link } from '@mui/material';

export interface DiscussionListProps {
  discussions: UserDiscussion[];
}

export function DiscussionList({ discussions }: DiscussionListProps) {
  return (
    <ul>
      {discussions.map(({ discussion, mergeRequest }) => {
        const firstNote = (discussion?.notes ?? [])[0];

        return (
          <Accordion key={discussion.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Avatar src={getDiscussionAuthor(discussion)?.avatar_url as string} />
              <Link
                underline="none"
                variant="subtitle2"
                href={`${mergeRequest.web_url}/#note_${firstNote?.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {mergeRequest.title}
              </Link>
            </AccordionSummary>
            <AccordionDetails>
              <CommentList
                comments={(discussion.notes ?? []).map(({ id, body, author }) => ({
                  id: id.toString(),
                  noteText: body,
                  avatarUrl: author.avatar_url as string,
                }))}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </ul>
  );
}
