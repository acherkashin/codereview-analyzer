import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar, Link, ListItem, ListItemAvatar, ListItemText, Typography, Chip, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ChatIcon from '@mui/icons-material/Chat';
import { PullRequest } from '../services/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

// Utility functions for PR display
const getFilesColor = (fileCount: number) => {
  if (fileCount <= 5) return 'success';
  if (fileCount <= 15) return 'warning';
  if (fileCount <= 30) return 'error';
  return 'error';
};

const getPRDuration = (pr: PullRequest) => {
  const startDate = dayjs(pr.createdAt);
  const endDate = pr.mergedAt ? dayjs(pr.mergedAt) : dayjs();
  const diff = endDate.diff(startDate, 'day');

  if (pr.mergedAt) {
    return `Was open ${diff} day${diff !== 1 ? 's' : ''}`;
  } else {
    return `Open ${diff} day${diff !== 1 ? 's' : ''}`;
  }
};

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
              <ListItem sx={{ width: '100%', pr: 2 }}>
                <ListItemAvatar>
                  <Avatar src={pr.author.avatarUrl} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Link underline="none" variant="subtitle2" href={pr.url} target="_blank" rel="noreferrer">
                        {pr.title}
                      </Link>
                      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, ml: 2 }}>
                        <Chip
                          icon={<ScheduleIcon />}
                          label={getPRDuration(pr)}
                          size="small"
                          variant="outlined"
                          color={pr.mergedAt ? 'default' : 'info'}
                        />
                        <Chip
                          icon={<FolderIcon />}
                          label={`${pr.changedFilesCount} files`}
                          size="small"
                          variant="outlined"
                          color={getFilesColor(pr.changedFilesCount)}
                        />
                        <Chip
                          icon={<ChatIcon />}
                          label={`${pr.comments.length} comments`}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        by {pr.author.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {dayjs(pr.createdAt).fromNow()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {pr.branchName} → {pr.targetBranch}
                      </Typography>
                      {pr.mergedAt && (
                        <Typography variant="caption" color="success.main">
                          • Merged {dayjs(pr.mergedAt).fromNow()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

                {pr.requestedChangesByUser.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Requested Changes by:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {pr.requestedChangesByUser.map((change, index) => (
                        <Box key={`${change.user.id}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar src={change.user.avatarUrl} sx={{ width: 20, height: 20 }} />
                          <Typography variant="caption">{change.user.displayName}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}
