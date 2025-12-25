import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar, Link, ListItem, ListItemAvatar, ListItemText, Typography, Chip, Box } from '@mui/material';
import { PullRequest } from '../services/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface PullRequestListProps {
  pullRequests: PullRequest[];
}

export function PullRequestList({ pullRequests }: PullRequestListProps) {
  return (
    <div>
      {pullRequests.map((pr) => {
        return (
          <Accordion key={pr.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar src={pr.author.avatarUrl} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Link underline="none" variant="subtitle2" href={pr.url} target="_blank" rel="noreferrer">
                      {pr.title}
                    </Link>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        by {pr.author.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {dayjs(pr.createdAt).fromNow()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`${pr.branchName} → ${pr.targetBranch}`} variant="outlined" />
                  <Chip size="small" label={`${pr.comments.length} comments`} variant="outlined" />
                  <Chip size="small" label={`${pr.changedFilesCount} files`} variant="outlined" />
                </Box>

                {pr.requestedReviewers.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Requested Reviewers:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {pr.requestedReviewers.map((reviewer) => (
                        <Box key={reviewer.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar src={reviewer.avatarUrl} sx={{ width: 20, height: 20 }} />
                          <Typography variant="caption">{reviewer.displayName}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {pr.approvedByUser.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Approved by:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {pr.approvedByUser.map((approval, index) => (
                        <Box key={`${approval.user.id}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar src={approval.user.avatarUrl} sx={{ width: 20, height: 20 }} />
                          <Typography variant="caption">{approval.user.displayName}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {pr.mergedAt && (
                  <Typography variant="caption" color="success.main">
                    Merged {dayjs(pr.mergedAt).fromNow()}
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}
