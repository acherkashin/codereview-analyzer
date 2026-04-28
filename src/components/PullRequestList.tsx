import { ReactNode, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ChatIcon from '@mui/icons-material/Chat';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReviewsIcon from '@mui/icons-material/Reviews';
import ForumIcon from '@mui/icons-material/Forum';
import DifferenceIcon from '@mui/icons-material/Difference';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from '@mui/material';
import { PullRequest, User, UserDiscussion } from '../services/types';
import {
  PullRequestSizeTier,
  getPullRequestOpenDays,
  getPullRequestSize,
  getPullRequestSizeTier,
  getPullRequestSizeTierLabel,
} from '../utils/PullRequestMetrics';

dayjs.extend(relativeTime);
dayjs.extend(duration);

type PullRequestListVariant = 'default' | 'oneOnOne';
type SortField = 'date' | 'discussionLoad' | 'files' | 'duration' | 'size';
type SortDirection = 'asc' | 'desc';

interface SortOption {
  field: SortField;
  direction: SortDirection;
}

export interface PullRequestListProps {
  pullRequests: PullRequest[];
  variant?: PullRequestListVariant;
  selectedPullRequestId?: string | null;
  onPullRequestSelect?: (pullRequest: PullRequest) => void;
  renderExtraDetails?: (pullRequest: PullRequest) => ReactNode;
}

export function PullRequestList({
  pullRequests,
  variant = 'default',
  selectedPullRequestId,
  onPullRequestSelect,
  renderExtraDetails,
}: PullRequestListProps) {
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'date', direction: 'desc' });
  const [expandedPullRequestId, setExpandedPullRequestId] = useState<string | false>(selectedPullRequestId ?? false);

  useEffect(() => {
    setExpandedPullRequestId(selectedPullRequestId ?? false);
  }, [selectedPullRequestId]);

  const sortedPullRequests = useMemo(() => {
    return sortPullRequests(pullRequests, sortOption);
  }, [pullRequests, sortOption]);

  const handleSortFieldChange = (field: SortField) => {
    setSortOption((prev) => ({ field, direction: prev.direction }));
  };

  const handleSortDirectionToggle = () => {
    setSortOption((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handlePullRequestToggle = (pullRequest: PullRequest, expanded: boolean) => {
    setExpandedPullRequestId(expanded ? pullRequest.id : false);

    if (expanded || variant === 'oneOnOne') {
      onPullRequestSelect?.(pullRequest);
    }
  };

  return (
    <div>
      <Toolbar sx={{ px: 0, minHeight: '48px !important', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          {sortedPullRequests.length} pull request{sortedPullRequests.length !== 1 ? 's' : ''}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortOption.field} label="Sort by" onChange={(e) => handleSortFieldChange(e.target.value as SortField)}>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="discussionLoad">Discussion load</MenuItem>
              <MenuItem value="files">Files</MenuItem>
              <MenuItem value="duration">Duration</MenuItem>
              <MenuItem value="size">Size</MenuItem>
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

      {sortedPullRequests.map((pullRequest) => {
        const isSelected = selectedPullRequestId != null && selectedPullRequestId === pullRequest.id;

        return (
          <Accordion
            key={pullRequest.id}
            expanded={expandedPullRequestId === pullRequest.id}
            onChange={(_, expanded) => handlePullRequestToggle(pullRequest, expanded)}
            sx={{
              border: isSelected ? '1px solid' : undefined,
              borderColor: isSelected ? 'primary.main' : undefined,
              backgroundColor: isSelected ? 'action.selected' : undefined,
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {variant === 'oneOnOne' ? (
                <OneOnOnePullRequestSummary pullRequest={pullRequest} onSelect={onPullRequestSelect} />
              ) : (
                <DefaultPullRequestSummary pullRequest={pullRequest} />
              )}
            </AccordionSummary>
            <AccordionDetails>
              {variant === 'oneOnOne' ? (
                <OneOnOnePullRequestDetails
                  pullRequest={pullRequest}
                  onSelect={onPullRequestSelect}
                  extraDetails={renderExtraDetails?.(pullRequest)}
                />
              ) : (
                <DefaultPullRequestDetails pullRequest={pullRequest} />
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}

function DefaultPullRequestSummary({ pullRequest }: { pullRequest: PullRequest }) {
  return (
    <ListItem sx={{ width: '100%', pr: 2 }}>
      <ListItemAvatar>
        <Avatar src={pullRequest.author.avatarUrl} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Link underline="none" variant="subtitle2" href={pullRequest.url} target="_blank" rel="noreferrer">
              {pullRequest.title}
            </Link>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, ml: 2 }}>
              <Chip
                icon={<ScheduleIcon />}
                label={getPullRequestDurationLabel(pullRequest)}
                size="small"
                variant="outlined"
                color={pullRequest.mergedAt ? 'default' : 'info'}
              />
              <Chip
                icon={<FolderIcon />}
                label={`${pullRequest.changedFilesCount} files`}
                size="small"
                variant="outlined"
                color={getFilesColor(pullRequest.changedFilesCount)}
              />
              <Chip
                icon={<ChatIcon />}
                label={`${pullRequest.reviewCommentCount} comments`}
                size="small"
                variant="outlined"
                color="default"
              />
            </Box>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              by {pullRequest.author.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • {dayjs(pullRequest.createdAt).fromNow()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • {pullRequest.branchName} → {pullRequest.targetBranch}
            </Typography>
            {pullRequest.mergedAt && (
              <Typography variant="caption" color="success.main">
                • Merged {dayjs(pullRequest.mergedAt).fromNow()}
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  );
}

function DefaultPullRequestDetails({ pullRequest }: { pullRequest: PullRequest }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PeopleGroup label="Requested Reviewers" users={pullRequest.requestedReviewers} />
      <PeopleGroup label="Approved by" users={pullRequest.approvedByUser.map((item) => item.user)} />
      <PeopleGroup label="Requested Changes by" users={pullRequest.requestedChangesByUser.map((item) => item.user)} />
    </Box>
  );
}

function OneOnOnePullRequestSummary({
  pullRequest,
  onSelect,
}: {
  pullRequest: PullRequest;
  onSelect?: (pullRequest: PullRequest) => void;
}) {
  const sizeTier = getPullRequestSizeTier(pullRequest);

  return (
    <ListItem
      sx={{ width: '100%', px: 0 }}
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="Open pull request"
          onClick={(event) => {
            event.stopPropagation();
            window.open(pullRequest.url, '_blank', 'noopener,noreferrer');
          }}
        >
          <OpenInNewIcon />
        </IconButton>
      }
    >
      <ListItemAvatar>
        <Avatar src={pullRequest.author.avatarUrl} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography variant="subtitle2">{pullRequest.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={pullRequest.repositoryName} size="small" variant="outlined" />
              <Chip
                label={pullRequest.status}
                size="small"
                color={getStatusColor(pullRequest.status)}
                sx={{ textTransform: 'capitalize' }}
              />
              <Chip label={dayjs(pullRequest.createdAt).format('DD MMM YYYY')} size="small" variant="outlined" />
              <Chip icon={<ScheduleIcon />} label={getPullRequestDurationLabel(pullRequest)} size="small" variant="outlined" />
              <Chip icon={<FolderIcon />} label={`${pullRequest.changedFilesCount} files`} size="small" variant="outlined" />
              <Chip label={getPullRequestSizeTierLabel(sizeTier)} size="small" color={getSizeTierColor(sizeTier)} />
              <Chip
                icon={<DifferenceIcon />}
                label={`+${pullRequest.linesAdded} / -${pullRequest.linesRemoved}`}
                size="small"
                variant="outlined"
              />
              <Chip icon={<ForumIcon />} label={`${pullRequest.discussionCount} threads`} size="small" variant="outlined" />
              <Chip
                icon={<ReviewsIcon />}
                label={`${pullRequest.reviewCommentCount} comments`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        }
        secondary={
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {pullRequest.branchName} → {pullRequest.targetBranch}
          </Typography>
        }
      />
    </ListItem>
  );
}

function OneOnOnePullRequestDetails({
  pullRequest,
  onSelect,
  extraDetails,
}: {
  pullRequest: PullRequest;
  onSelect?: (pullRequest: PullRequest) => void;
  extraDetails?: ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <PeopleGroup label="Reviewers" users={pullRequest.requestedReviewers} emptyText="No reviewers assigned" />
        <PeopleGroup label="Approvers" users={pullRequest.approvedByUser.map((item) => item.user)} emptyText="No approvals yet" />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Discussion preview
        </Typography>
        {pullRequest.discussions.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pullRequest.discussions
              .slice()
              .sort((left, right) => getLastDiscussionTimestamp(right) - getLastDiscussionTimestamp(left))
              .slice(0, 3)
              .map((discussion) => (
                <DiscussionPreview key={discussion.id} discussion={discussion} />
              ))}

            <Button variant="text" sx={{ alignSelf: 'flex-start' }} onClick={() => onSelect?.(pullRequest)}>
              View all discussions in side panel
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No discussion threads were captured for this pull request.
          </Typography>
        )}
      </Box>

      {extraDetails}
    </Box>
  );
}

function DiscussionPreview({ discussion }: { discussion: UserDiscussion }) {
  const firstComment = discussion.comments[0];
  const lastComment = discussion.comments[discussion.comments.length - 1];

  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar src={discussion.reviewerAvatarUrl} sx={{ width: 28, height: 28 }} />
        <Typography variant="body2" fontWeight={600}>
          {discussion.reviewerName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {discussion.comments.length} comment{discussion.comments.length !== 1 ? 's' : ''}
        </Typography>
        {discussion.isResolved != null && (
          <Chip
            size="small"
            label={discussion.isResolved ? 'Resolved' : 'Open'}
            color={discussion.isResolved ? 'success' : 'warning'}
            variant="outlined"
          />
        )}
      </Box>
      <Typography variant="body2" color="text.primary" sx={{ mb: 0.75 }}>
        {trimText(firstComment?.body ?? '', 180)}
      </Typography>
      {lastComment && lastComment.id !== firstComment?.id && (
        <Typography variant="caption" color="text.secondary">
          Last update {dayjs(lastComment.createdAt).fromNow()}
        </Typography>
      )}
    </Box>
  );
}

function PeopleGroup({
  label,
  users,
  emptyText = 'None',
}: {
  label: string;
  users: User[];
  emptyText?: string;
}) {
  const uniqueUsers = uniqueUsersById(users);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        {label}
      </Typography>
      {uniqueUsers.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {uniqueUsers.map((user) => (
            <Box
              key={user.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                py: 0.5,
                px: 1,
                borderRadius: 999,
                backgroundColor: 'action.hover',
              }}
            >
              <Avatar src={user.avatarUrl} sx={{ width: 20, height: 20 }} />
              <Typography variant="caption">{user.displayName}</Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      )}
    </Box>
  );
}

function uniqueUsersById(users: User[]) {
  const seenUsers = new Map<string, User>();

  users.forEach((user) => {
    if (!seenUsers.has(user.id)) {
      seenUsers.set(user.id, user);
    }
  });

  return [...seenUsers.values()];
}

function getFilesColor(fileCount: number) {
  if (fileCount <= 5) return 'success' as const;
  if (fileCount <= 15) return 'warning' as const;
  return 'error' as const;
}

function getPullRequestDurationLabel(pullRequest: PullRequest) {
  const diff = getPullRequestOpenDays(pullRequest);

  if (pullRequest.status === 'open') {
    return `Open ${diff} day${diff !== 1 ? 's' : ''}`;
  }

  return `Was open ${diff} day${diff !== 1 ? 's' : ''}`;
}

function getDiscussionLoad(pullRequest: PullRequest) {
  return pullRequest.discussionCount + pullRequest.reviewCommentCount;
}

function sortPullRequests(pullRequests: PullRequest[], sortOption: SortOption): PullRequest[] {
  const { field, direction } = sortOption;

  return [...pullRequests].sort((left, right) => {
    let leftValue = 0;
    let rightValue = 0;

    switch (field) {
      case 'date':
        leftValue = dayjs(left.createdAt).valueOf();
        rightValue = dayjs(right.createdAt).valueOf();
        break;
      case 'discussionLoad':
        leftValue = getDiscussionLoad(left);
        rightValue = getDiscussionLoad(right);
        break;
      case 'files':
        leftValue = left.changedFilesCount;
        rightValue = right.changedFilesCount;
        break;
      case 'duration':
        leftValue = getPullRequestOpenDays(left);
        rightValue = getPullRequestOpenDays(right);
        break;
      case 'size':
        leftValue = getPullRequestSize(left);
        rightValue = getPullRequestSize(right);
        break;
    }

    if (leftValue < rightValue) return direction === 'asc' ? -1 : 1;
    if (leftValue > rightValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function getStatusColor(status: PullRequest['status']) {
  switch (status) {
    case 'merged':
      return 'success' as const;
    case 'closed':
      return 'default' as const;
    case 'open':
      return 'info' as const;
  }
}

function getSizeTierColor(sizeTier: PullRequestSizeTier) {
  switch (sizeTier) {
    case 'compact':
      return 'success' as const;
    case 'medium':
      return 'default' as const;
    case 'large':
      return 'warning' as const;
    case 'veryLarge':
      return 'error' as const;
  }
}

function trimText(text: string, limit: number) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.substring(0, limit).trim()}...`;
}

function getLastDiscussionTimestamp(discussion: UserDiscussion) {
  return discussion.comments.reduce((latest, comment) => {
    return Math.max(latest, new Date(comment.createdAt).getTime());
  }, 0);
}
