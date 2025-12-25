import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Avatar,
  Link,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Toolbar,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ChatIcon from '@mui/icons-material/Chat';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { PullRequest } from '../services/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { useState, useMemo } from 'react';

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

// Sorting types and utilities
type SortField = 'date' | 'comments' | 'files' | 'duration';
type SortDirection = 'asc' | 'desc';

interface SortOption {
  field: SortField;
  direction: SortDirection;
}

const getPRDurationInDays = (pr: PullRequest): number => {
  const startDate = dayjs(pr.createdAt);
  const endDate = pr.mergedAt ? dayjs(pr.mergedAt) : dayjs();
  return endDate.diff(startDate, 'day');
};

const sortPullRequests = (prs: PullRequest[], sortOption: SortOption): PullRequest[] => {
  const { field, direction } = sortOption;

  const sorted = [...prs].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (field) {
      case 'date':
        aValue = dayjs(a.createdAt).valueOf();
        bValue = dayjs(b.createdAt).valueOf();
        break;
      case 'comments':
        aValue = a.comments.length;
        bValue = b.comments.length;
        break;
      case 'files':
        aValue = a.changedFilesCount;
        bValue = b.changedFilesCount;
        break;
      case 'duration':
        aValue = getPRDurationInDays(a);
        bValue = getPRDurationInDays(b);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

export interface PullRequestListProps {
  pullRequests: PullRequest[];
}

export function PullRequestList({ pullRequests }: PullRequestListProps) {
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'date', direction: 'desc' });

  const sortedPullRequests = useMemo(() => {
    return sortPullRequests(pullRequests, sortOption);
  }, [pullRequests, sortOption]);

  const handleSortFieldChange = (field: SortField) => {
    setSortOption((prev) => ({ field, direction: prev.direction }));
  };

  const handleSortDirectionToggle = () => {
    setSortOption((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div>
      <Toolbar sx={{ px: 0, minHeight: '48px !important', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {sortedPullRequests.length} pull request{sortedPullRequests.length !== 1 ? 's' : ''}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortOption.field} label="Sort by" onChange={(e) => handleSortFieldChange(e.target.value as SortField)}>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="comments">Comments</MenuItem>
              <MenuItem value="files">Files</MenuItem>
              <MenuItem value="duration">Duration</MenuItem>
            </Select>
          </FormControl>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              padding: 0.5,
              borderRadius: 1,
              '&:hover': { backgroundColor: 'action.hover' },
            }}
            onClick={handleSortDirectionToggle}
          >
            <SwapVertIcon
              sx={{
                transform: sortOption.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {sortOption.direction === 'asc' ? 'Ascending' : 'Descending'}
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      {sortedPullRequests.map((pr) => {
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
