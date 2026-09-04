import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import { useShallow } from 'zustand/react/shallow';
import { AnalyzeParams, Comment, PullRequest, User, UserDiscussion } from '../../services/types';
import { FilterPanel } from '../../components/FilterPanel/FilterPanel';
import { ImportTextButton, PullRequestList } from '../../components';
import { MarkdownControl } from '../../components/MarkdownControl';
import { PageContainer } from '../shared/PageContainer';
import { useClient } from '../../stores/AuthStore';
import {
  getAnalyze,
  getOneOnOneActionItems,
  getOneOnOneHighlights,
  getOneOnOneInsights,
  getOneOnOnePullRequests,
  getOneOnOneReviewedBy,
  getOneOnOneReviewedPullRequests,
  getOneOnOneReviewsFor,
  OneOnOnePersonRelationshipRow,
  OneOnOneReviewedPullRequestActivity,
  useChartsStore,
} from '../../stores/ChartsStore';
import { useIsGuest } from '../../hooks/useIsGuest';
import { OneOnOneFilterPanel } from './OneOnOneFilterPanel';
import { getPullRequestSize } from '../../utils/PullRequestMetrics';

export function OneOnOneReviewPage() {
  const client = useClient();
  const isGuest = useIsGuest();
  const analyze = useChartsStore(getAnalyze);

  const { user, users, allPullRequests } = useChartsStore(
    useShallow((state) => ({
      user: state.user,
      users: state.users,
      allPullRequests: state.pullRequests,
    }))
  );
  const pullRequests = useChartsStore(getOneOnOnePullRequests);
  const reviewedPullRequests = useChartsStore(getOneOnOneReviewedPullRequests);
  const reviewedBy = useChartsStore(getOneOnOneReviewedBy);
  const reviewsFor = useChartsStore(getOneOnOneReviewsFor);
  const insights = useChartsStore(getOneOnOneInsights);
  const highlights = useChartsStore(getOneOnOneHighlights);
  const actionItems = useChartsStore(getOneOnOneActionItems);
  const importData = useChartsStore((state) => state.actions.import);

  const [selectedPullRequest, setSelectedPullRequest] = useState<PullRequest | null>(null);
  const visiblePullRequests = useMemo(() => {
    const byId = new Map<string, PullRequest>();

    pullRequests.forEach((item) => byId.set(item.id, item));
    reviewedPullRequests.forEach((item) => byId.set(item.pullRequest.id, item.pullRequest));

    return [...byId.values()];
  }, [pullRequests, reviewedPullRequests]);

  useEffect(() => {
    if (selectedPullRequest && !visiblePullRequests.some((item) => item.id === selectedPullRequest.id)) {
      setSelectedPullRequest(null);
    }
  }, [selectedPullRequest, visiblePullRequests]);

  const handleAnalyze = useCallback(
    (params: AnalyzeParams) => {
      return analyze(client, params);
    },
    [analyze, client]
  );

  const sidePanelSummaryItems = useMemo(() => {
    if (!selectedPullRequest) {
      return [];
    }

    const mostActiveDiscussion = selectedPullRequest.discussions.reduce<UserDiscussion | null>((current, discussion) => {
      if (!current || discussion.comments.length > current.comments.length) {
        return discussion;
      }

      return current;
    }, null);

    return [
      { label: 'Files touched', value: `${selectedPullRequest.changedFilesCount}` },
      { label: 'Total change size', value: `${getPullRequestSize(selectedPullRequest)} lines` },
      { label: 'Reviewers involved', value: `${getActualReviewers(selectedPullRequest).length}` },
      {
        label: 'Most active thread',
        value: mostActiveDiscussion
          ? `${mostActiveDiscussion.comments.length} comments by ${mostActiveDiscussion.reviewerName}`
          : 'No active thread',
      },
    ];
  }, [selectedPullRequest]);

  if (allPullRequests == null || users == null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Stack
          spacing={2}
          style={{ width: 300 }}
          sx={{
            position: 'sticky',
          }}
        >
          {!isGuest && <FilterPanel onAnalyze={handleAnalyze} />}
          <ImportTextButton
            label="Import as JSON"
            onTextSelected={(json) => {
              try {
                importData(json);
              } catch (error) {
                console.error(error);
              }
            }}
          />
        </Stack>
      </div>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowX: 'hidden' }}>
        <OneOnOneFilterPanel />

        <Stack spacing={3} sx={{ pt: 3, pb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              1:1 Review
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
              }}
            >
              Review authored pull requests, collaboration coverage, and conversation patterns for your upcoming 1:1.
            </Typography>
          </Box>

          {!user ? (
            <EmptyStateCard
              title="Select a team member"
              description="Choose a team member above to load authored pull requests, review relationships, highlights, and action items for the selected period."
            />
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.8fr) minmax(320px, 1fr)' },
                  alignItems: 'start',
                }}
              >
                <InsightsSection insights={insights} />
                <HighlightsSection highlights={highlights} />
              </Box>

              <CollaborationSection userName={user.displayName} reviewedBy={reviewedBy} reviewsFor={reviewsFor} />

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.8fr) minmax(320px, 1fr)' },
                  alignItems: 'start',
                }}
              >
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="h6">Pull requests</Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                            }}
                          >
                            Authored pull requests for {user.displayName} in the selected period.
                          </Typography>
                        </Box>

                        {pullRequests.length > 0 ? (
                          <PullRequestList
                            pullRequests={pullRequests}
                            variant="oneOnOne"
                            selectedPullRequestId={selectedPullRequest?.id}
                            onPullRequestSelect={setSelectedPullRequest}
                          />
                        ) : (
                          <EmptyStateCard
                            title="No pull requests in range"
                            description="Try widening the date range or choosing another team member to review authored PR activity."
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  <ReviewedPullRequestsSection
                    reviewedPullRequests={reviewedPullRequests}
                    selectedPullRequestId={selectedPullRequest?.id}
                    onPullRequestSelect={setSelectedPullRequest}
                  />
                </Stack>

                <SidePanel pullRequest={selectedPullRequest} summaryItems={sidePanelSummaryItems} />
              </Box>

              <ActionItemsSection actionItems={actionItems} />
            </>
          )}
        </Stack>
      </Box>
    </PageContainer>
  );
}

function InsightsSection({ insights }: { insights: ReturnType<typeof getOneOnOneInsights> }) {
  const insightCards = [
    { label: 'PRs authored', value: insights.authoredPullRequestsCount },
    { label: 'PRs reviewed', value: insights.reviewedPullRequestsCount },
    { label: 'Unique reviewers', value: insights.uniqueReviewersCount },
    { label: 'Unique authors reviewed', value: insights.uniqueReviewedAuthorsCount },
    { label: 'Median PR size', value: `${insights.medianPrSize} lines` },
    { label: 'Average PR size', value: `${insights.averagePrSize} lines` },
    { label: 'Large PRs', value: insights.largePullRequestsCount },
    { label: 'Median open time', value: `${insights.medianOpenDays}d` },
    { label: 'Average open time', value: `${insights.averageOpenDays}d` },
    { label: 'Discussions started', value: insights.discussionsStartedCount },
  ];

  return (
    <Box>
      <Typography variant="h6">Insights</Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 1.5,
        }}
      >
        Snapshot of authored work, review reach, and pull request cadence for the selected period.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {insightCards.map((item) => (
          <InsightCard key={item.label}>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {item.label}
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
              {item.value}
            </Typography>
          </InsightCard>
        ))}
      </Box>
    </Box>
  );
}

function CollaborationSection({
  userName,
  reviewedBy,
  reviewsFor,
}: {
  userName: string;
  reviewedBy: OneOnOnePersonRelationshipRow[];
  reviewsFor: OneOnOnePersonRelationshipRow[];
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupOutlinedIcon color="primary" />
            <Typography variant="h6">Review relationships</Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            See who is actively reviewing {userName}&apos;s work and whose pull requests {userName} reviewed in this period.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <RelationshipList
              title="Reviewed by"
              rows={reviewedBy}
              emptyText="No teammates left captured review activity on this person's authored pull requests in the selected period."
            />
            <RelationshipList
              title="Reviews for"
              rows={reviewsFor}
              emptyText="This person did not leave captured review activity on teammates' pull requests in the selected period."
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RelationshipList({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: OneOnOnePersonRelationshipRow[];
  emptyText: string;
}) {
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>

      {rows.length > 0 ? (
        <List dense disablePadding>
          {rows.map((row) => (
            <ListItem key={row.user.id} disableGutters sx={{ py: 0.75 }}>
              <ListItemAvatar>
                <Avatar src={row.user.avatarUrl} />
              </ListItemAvatar>
              <ListItemText
                primary={row.user.displayName}
                secondary={`${row.pullRequestCount} PR${row.pullRequestCount === 1 ? '' : 's'} reviewed`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {emptyText}
        </Typography>
      )}
    </Box>
  );
}

function ReviewedPullRequestsSection({
  reviewedPullRequests,
  selectedPullRequestId,
  onPullRequestSelect,
}: {
  reviewedPullRequests: OneOnOneReviewedPullRequestActivity[];
  selectedPullRequestId?: string | null;
  onPullRequestSelect: (pullRequest: PullRequest) => void;
}) {
  const reviewedActivityByPullRequestId = useMemo(() => {
    return new Map(reviewedPullRequests.map((item) => [item.pullRequest.id, item]));
  }, [reviewedPullRequests]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Reviewed pull requests</Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Pull requests where this person participated as a reviewer, grouped by the PR they reviewed.
            </Typography>
          </Box>

          {reviewedPullRequests.length > 0 ? (
            <PullRequestList
              pullRequests={reviewedPullRequests.map((item) => item.pullRequest)}
              variant="oneOnOne"
              selectedPullRequestId={selectedPullRequestId}
              onPullRequestSelect={onPullRequestSelect}
              renderExtraDetails={(pullRequest) => {
                const activity = reviewedActivityByPullRequestId.get(pullRequest.id);

                if (!activity) {
                  return null;
                }

                return <ReviewerContributionDetails activity={activity} />;
              }}
            />
          ) : (
            <EmptyStateCard
              title="No reviewed pull requests in range"
              description="This person did not leave captured review activity on other pull requests in the selected period."
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function HighlightsSection({ highlights }: { highlights: string[] }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsightsOutlinedIcon color="primary" />
            <Typography variant="h6">Highlights</Typography>
          </Box>
          {highlights.length > 0 ? (
            <List dense disablePadding>
              {highlights.map((highlight) => (
                <ListItem key={highlight} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={highlight}
                    slotProps={{
                      primary: { variant: 'body2' },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Select a team member to generate meeting highlights.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ActionItemsSection({ actionItems }: { actionItems: string[] }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentTurnedInOutlinedIcon color="primary" />
            <Typography variant="h6">Next actions</Typography>
          </Box>
          <List dense disablePadding>
            {actionItems.map((item) => (
              <ListItem key={item} disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary={item}
                  slotProps={{
                    primary: { variant: 'body2' },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SidePanel({
  pullRequest,
  summaryItems,
}: {
  pullRequest: PullRequest | null;
  summaryItems: { label: string; value: string }[];
}) {
  return (
    <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 96 } }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ForumOutlinedIcon color="primary" />
              <Typography variant="h6">Discussion / work samples</Typography>
            </Box>

            {!pullRequest ? (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                Select or expand a pull request to inspect discussion threads and review signals.
              </Typography>
            ) : (
              <>
                <Box>
                  <Typography variant="subtitle2">{pullRequest.title}</Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {pullRequest.repositoryName}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Work samples
                  </Typography>
                  <Stack spacing={1}>
                    {summaryItems.map((item) => (
                      <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            textAlign: 'right',
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Discussion threads
                  </Typography>
                  {pullRequest.discussions.length > 0 ? (
                    <Stack spacing={1.5}>
                      {pullRequest.discussions
                        .slice()
                        .sort((left, right) => getLatestDiscussionDate(right) - getLatestDiscussionDate(left))
                        .map((discussion) => (
                          <DiscussionThreadCard key={discussion.id} discussion={discussion} />
                        ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      No discussion threads were captured for this pull request.
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function ReviewerContributionDetails({ activity }: { activity: OneOnOneReviewedPullRequestActivity }) {
  const { commentsBySelectedReviewer, discussionsStartedBySelectedReviewer, reviewActivitiesBySelectedReviewer } = activity;
  const reviewSummary = summarizeReviewActivities(reviewActivitiesBySelectedReviewer);
  const hasCapturedText = discussionsStartedBySelectedReviewer.length > 0 || commentsBySelectedReviewer.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Reviewer contribution summary
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {`${discussionsStartedBySelectedReviewer.length} discussions started, ${
            commentsBySelectedReviewer.length
          } comments left${reviewSummary.length > 0 ? `, ${reviewSummary.join(', ')}` : ''}`}
        </Typography>
      </Box>

      {!hasCapturedText && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Reviewed without captured comment text.
        </Typography>
      )}

      {discussionsStartedBySelectedReviewer.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Discussions started
          </Typography>
          <Stack spacing={1.5}>
            {discussionsStartedBySelectedReviewer
              .slice()
              .sort((left, right) => getLatestDiscussionDate(right) - getLatestDiscussionDate(left))
              .map((discussion) => (
                <ReviewerDiscussionContributionCard key={discussion.id} discussion={discussion} />
              ))}
          </Stack>
        </Box>
      )}

      {commentsBySelectedReviewer.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Comments left
          </Typography>
          <Stack spacing={1}>
            {commentsBySelectedReviewer
              .slice()
              .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
              .map((comment) => (
                <CommentContributionCard key={comment.id} comment={comment} />
              ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function DiscussionThreadCard({ discussion }: { discussion: UserDiscussion }) {
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar src={discussion.reviewerAvatarUrl} sx={{ width: 28, height: 28 }} />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
          }}
        >
          {discussion.reviewerName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {discussion.comments.length} comment{discussion.comments.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      <Stack spacing={1}>
        {discussion.comments.map((comment) => (
          <Box key={comment.id} sx={{ backgroundColor: 'background.default', p: 1, borderRadius: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {comment.reviewerName} • {dayjs(comment.createdAt).format('DD MMM YYYY')}
            </Typography>
            <MarkdownControl markdown={comment.body} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function ReviewerDiscussionContributionCard({ discussion }: { discussion: UserDiscussion }) {
  const reviewerComments = discussion.comments.filter((comment) => comment.reviewerId === discussion.reviewerId);

  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar src={discussion.reviewerAvatarUrl} sx={{ width: 28, height: 28 }} />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
          }}
        >
          {discussion.reviewerName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          Started discussion • {reviewerComments.length} comment{reviewerComments.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      <Stack spacing={1}>
        {reviewerComments.map((comment) => (
          <Box key={comment.id} sx={{ backgroundColor: 'background.default', p: 1, borderRadius: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {dayjs(comment.createdAt).format('DD MMM YYYY')}
            </Typography>
            <MarkdownControl markdown={comment.body} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function CommentContributionCard({ comment }: { comment: Comment }) {
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {comment.reviewerName} • {dayjs(comment.createdAt).format('DD MMM YYYY')}
      </Typography>
      <MarkdownControl markdown={comment.body} />
    </Box>
  );
}

function EmptyStateCard({ title, description }: { title: string; description: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeakerNotesOutlinedIcon color="primary" />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function getLatestDiscussionDate(discussion: UserDiscussion) {
  return discussion.comments.reduce((latest, comment) => {
    return Math.max(latest, new Date(comment.createdAt).getTime());
  }, 0);
}

function getActualReviewers(pullRequest: PullRequest) {
  const reviewers = new Map<string, User>();

  pullRequest.reviewedByUser.forEach((activity) => {
    reviewers.set(activity.user.id, activity.user);
  });

  pullRequest.comments.forEach((comment) => {
    reviewers.set(comment.reviewerId, {
      id: comment.reviewerId,
      fullName: comment.reviewerName,
      userName: comment.reviewerName,
      displayName: comment.reviewerName,
      avatarUrl: comment.reviewerAvatarUrl ?? '',
      webUrl: '',
      active: true,
    });
  });

  pullRequest.discussions.forEach((discussion) => {
    reviewers.set(discussion.reviewerId, {
      id: discussion.reviewerId,
      fullName: discussion.reviewerName,
      userName: discussion.reviewerName,
      displayName: discussion.reviewerName,
      avatarUrl: discussion.reviewerAvatarUrl ?? '',
      webUrl: '',
      active: true,
    });
  });

  reviewers.delete(pullRequest.author.id);

  return [...reviewers.values()];
}

const InsightCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderTop: `3px solid ${theme.palette.primary.main}`,
}));

function summarizeReviewActivities(reviewActivities: OneOnOneReviewedPullRequestActivity['reviewActivitiesBySelectedReviewer']) {
  const activityCounts = reviewActivities.reduce((total, item) => {
    total[item.activityType] = (total[item.activityType] ?? 0) + 1;
    return total;
  }, {} as Record<string, number>);

  return Object.entries(activityCounts).map(([activityType, count]) => `${count} ${activityType}`);
}
