import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import dayjs from 'dayjs';
import { DiscussionList, FullScreenDialog } from '../../components';
import { PullRequest, UserDiscussion } from '../../services/types';
import { getFilteredDiscussions } from '../../utils/GitUtils';
import { TeamReviewRelationship } from '../../utils/TeamReviewUtils';
import type { RelationshipMatrixMetric } from './TeamRelationshipMatrix';

interface DiscussionDialogSelection {
  relationshipId: string;
  pullRequestId: string;
}

export function RelationshipDetails({
  relationship,
  metric,
}: {
  relationship: TeamReviewRelationship | null;
  metric: RelationshipMatrixMetric;
}) {
  const [dialogSelection, setDialogSelection] = useState<DiscussionDialogSelection | null>(null);
  const discussionsByPullRequestId = useMemo(() => getRelationshipDiscussionsByPullRequestId(relationship), [relationship]);
  const visiblePullRequests = useMemo(
    () => getVisiblePullRequests(relationship, metric, discussionsByPullRequestId),
    [discussionsByPullRequestId, metric, relationship]
  );
  const selectedPullRequest = useMemo(() => {
    if (!relationship || dialogSelection?.relationshipId !== relationship.id) {
      return null;
    }

    return visiblePullRequests.find((pullRequest) => pullRequest.id === dialogSelection.pullRequestId) ?? null;
  }, [dialogSelection, relationship, visiblePullRequests]);
  const selectedDiscussions = selectedPullRequest ? discussionsByPullRequestId.get(selectedPullRequest.id) ?? [] : [];

  useEffect(() => {
    if (
      dialogSelection &&
      (relationship?.id !== dialogSelection.relationshipId ||
        !visiblePullRequests.some((pullRequest) => pullRequest.id === dialogSelection.pullRequestId))
    ) {
      setDialogSelection(null);
    }
  }, [dialogSelection, relationship?.id, visiblePullRequests]);

  const closeDialog = () => setDialogSelection(null);

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupOutlinedIcon color="primary" />
              <Typography variant="h6">Relationship details</Typography>
            </Box>

            {!relationship ? (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                Select a relationship cell to inspect the relationship.
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <PersonBadge user={relationship.reviewer} label="Reviewer" />
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    -
                  </Typography>
                  <PersonBadge
                    user={relationship.author}
                    label={relationship.isAuthorSelectedTeamMember ? 'Team author' : 'Outside author'}
                  />
                </Box>

                <Divider />

                <Stack spacing={1}>
                  <MetricRow label="Reviewed PRs" value={relationship.reviewedPullRequestsCount} />
                  <MetricRow label="Approvals" value={relationship.approvalsCount} />
                  <MetricRow label="Discussions started" value={relationship.discussionsStartedCount} />
                  <MetricRow label="Comments left" value={relationship.commentsCount} />
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {getPullRequestsSectionTitle(metric)}
                  </Typography>
                  {visiblePullRequests.length > 0 ? (
                    <List dense disablePadding>
                      {visiblePullRequests.map((pullRequest) => {
                        const discussions = discussionsByPullRequestId.get(pullRequest.id) ?? [];

                        return (
                          <RelationshipPullRequestItem
                            key={pullRequest.id}
                            pullRequest={pullRequest}
                            discussionsCount={discussions.length}
                            onShowDiscussions={() =>
                              setDialogSelection({ relationshipId: relationship.id, pullRequestId: pullRequest.id })
                            }
                          />
                        );
                      })}
                    </List>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      {getPullRequestsEmptyText(metric, relationship.reviewer.displayName)}
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      <FullScreenDialog
        icon={<QuestionAnswerOutlinedIcon />}
        title={getDiscussionDialogTitle(selectedPullRequest, relationship)}
        open={selectedPullRequest != null && selectedDiscussions.length > 0}
        onClose={closeDialog}
      >
        <DiscussionList discussions={selectedDiscussions} />
      </FullScreenDialog>
    </>
  );
}

function RelationshipPullRequestItem({
  pullRequest,
  discussionsCount,
  onShowDiscussions,
}: {
  pullRequest: PullRequest;
  discussionsCount: number;
  onShowDiscussions: () => void;
}) {
  return (
    <ListItem disableGutters sx={{ py: 1, alignItems: 'flex-start' }}>
      <ListItemAvatar>
        <Avatar src={pullRequest.author.avatarUrl} alt={pullRequest.author.displayName} />
      </ListItemAvatar>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <ListItemText
          sx={{ my: 0 }}
          primary={
            <Link href={pullRequest.url} target="_blank" rel="noreferrer" underline="hover">
              {pullRequest.title}
            </Link>
          }
          secondary={`${pullRequest.repositoryName} · ${dayjs(pullRequest.createdAt).format('DD MMM YYYY')}`}
        />
        {discussionsCount > 0 ? (
          <Button
            size="small"
            variant="text"
            startIcon={<QuestionAnswerOutlinedIcon />}
            aria-label={`${getViewDiscussionsLabel(discussionsCount)} for ${pullRequest.title}`}
            onClick={onShowDiscussions}
            sx={{ mt: 0.5, minHeight: 44, px: 1 }}
          >
            {getViewDiscussionsLabel(discussionsCount)}
          </Button>
        ) : (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 1,
            }}
          >
            No discussions
          </Typography>
        )}
      </Box>
    </ListItem>
  );
}

function PersonBadge({ user, label }: { user: TeamReviewRelationship['reviewer']; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Avatar src={user.avatarUrl} alt={user.displayName} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          noWrap
          sx={{
            fontWeight: 700,
          }}
        >
          {user.displayName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function getRelationshipDiscussionsByPullRequestId(relationship: TeamReviewRelationship | null) {
  if (!relationship) {
    return new Map<string, UserDiscussion[]>();
  }

  return new Map(
    relationship.pullRequests.map((pullRequest) => [
      pullRequest.id,
      getFilteredDiscussions(pullRequest.discussions, relationship.reviewer.id, relationship.author.id),
    ])
  );
}

function getVisiblePullRequests(
  relationship: TeamReviewRelationship | null,
  metric: RelationshipMatrixMetric,
  discussionsByPullRequestId: Map<string, UserDiscussion[]>
) {
  if (!relationship) {
    return [];
  }

  switch (metric) {
    case 'approvalsCount':
      return relationship.pullRequests.filter((pullRequest) =>
        pullRequest.approvedByUser.some((activity) => activity.user.id === relationship.reviewer.id)
      );
    case 'discussionsStartedCount':
      return relationship.pullRequests.filter((pullRequest) => (discussionsByPullRequestId.get(pullRequest.id)?.length ?? 0) > 0);
    case 'reviewedPullRequestsCount':
      return relationship.pullRequests;
  }
}

function getPullRequestsSectionTitle(metric: RelationshipMatrixMetric) {
  switch (metric) {
    case 'approvalsCount':
      return 'Approved pull requests';
    case 'discussionsStartedCount':
      return 'Pull requests with discussions started';
    case 'reviewedPullRequestsCount':
      return 'Reviewed pull requests';
  }
}

function getPullRequestsEmptyText(metric: RelationshipMatrixMetric, reviewerName: string) {
  switch (metric) {
    case 'approvalsCount':
      return `${reviewerName} did not approve any pull requests in this relationship.`;
    case 'discussionsStartedCount':
      return `${reviewerName} did not start any discussions in this relationship.`;
    case 'reviewedPullRequestsCount':
      return `No reviewed pull requests were captured for ${reviewerName} in this relationship.`;
  }
}

function getViewDiscussionsLabel(discussionsCount: number) {
  return `View ${discussionsCount} discussion${discussionsCount === 1 ? '' : 's'}`;
}

function getDiscussionDialogTitle(pullRequest: PullRequest | null, relationship: TeamReviewRelationship | null) {
  if (!pullRequest || !relationship) {
    return '';
  }

  return `${pullRequest.title} — discussions started by ${relationship.reviewer.displayName}`;
}
