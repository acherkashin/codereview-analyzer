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
import { useShallow } from 'zustand/react/shallow';
import { AnalyzeParams, Comment, PullRequest, UserDiscussion } from '../../services/types';
import { FilterPanel } from '../../components/FilterPanel/FilterPanel';
import { ImportTextButton, PullRequestList } from '../../components';
import { MarkdownControl } from '../../components/MarkdownControl';
import { PageContainer } from '../shared/PageContainer';
import { useClient } from '../../stores/AuthStore';
import {
  getAnalyze,
  getHostType,
  getOneOnOneActionItems,
  getOneOnOneHighlights,
  getOneOnOneInsights,
  getOneOnOnePullRequests,
  getOneOnOneReviewedPullRequests,
  OneOnOneReviewedPullRequestActivity,
  useChartsStore,
} from '../../stores/ChartsStore';
import { useIsGuest } from '../../hooks/useIsGuest';
import { OneOnOneFilterPanel } from './OneOnOneFilterPanel';

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
  const insights = useChartsStore(getOneOnOneInsights);
  const highlights = useChartsStore(getOneOnOneHighlights);
  const actionItems = useChartsStore(getOneOnOneActionItems);
  const hostType = useChartsStore(getHostType);
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
      { label: 'Total change size', value: `${selectedPullRequest.linesAdded + selectedPullRequest.linesRemoved} lines` },
      { label: 'Reviewers involved', value: `${selectedPullRequest.requestedReviewers.length}` },
      {
        label: 'Most active thread',
        value: mostActiveDiscussion ? `${mostActiveDiscussion.comments.length} comments by ${mostActiveDiscussion.reviewerName}` : 'No active thread',
      },
    ];
  }, [selectedPullRequest]);

  if (allPullRequests == null || users == null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Stack spacing={2} position="sticky" style={{ width: 300 }}>
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
            <Typography variant="body1" color="text.secondary">
              Review authored pull requests, conversation patterns, and next steps for your upcoming 1:1.
            </Typography>
          </Box>

          {!user ? (
            <EmptyStateCard
              title="Select a team member"
              description="Choose a team member above to load authored pull requests, highlights, and action items for the selected period."
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
                <InsightsSection insights={insights} showUnresolvedMetric={hostType === 'Gitlab' && insights.unresolvedDiscussionRate != null} />
                <HighlightsSection highlights={highlights} />
              </Box>

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
                          <Typography variant="body2" color="text.secondary">
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

function InsightsSection({
  insights,
  showUnresolvedMetric,
}: {
  insights: ReturnType<typeof getOneOnOneInsights>;
  showUnresolvedMetric: boolean;
}) {
  const insightCards = [
    { label: 'PRs reviewed', value: insights.reviewedPullRequestsCount },
    { label: 'Discussions started', value: insights.discussionsStartedCount },
    { label: 'PRs authored', value: insights.authoredPullRequestsCount },
    { label: 'Median open time', value: `${insights.medianOpenDays}d` },
    { label: 'Median PR size', value: `${insights.medianPrSize} lines` },
    { label: 'Avg review conversations per authored PR', value: insights.averageReviewLoad.toFixed(1) },
  ];

  if (showUnresolvedMetric) {
    insightCards.push({ label: 'Unresolved rate', value: `${insights.unresolvedDiscussionRate}%` });
  }

  return (
    <Box>
      <Typography variant="h6">
        Insights
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Review conversations = discussion threads + review comments across this person&apos;s authored pull requests in the selected period.
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
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {item.label}
            </Typography>
            <Typography variant="h5" sx={{ color: 'common.white' }}>
              {item.value}
            </Typography>
          </InsightCard>
        ))}
      </Box>
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
            <Typography variant="body2" color="text.secondary">
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
                  <ListItemText primary={highlight} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
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
                <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
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
              <Typography variant="body2" color="text.secondary">
                Select or expand a pull request to inspect discussion threads and review signals.
              </Typography>
            ) : (
              <>
                <Box>
                  <Typography variant="subtitle2">{pullRequest.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
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
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} textAlign="right">
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
                    <Typography variant="body2" color="text.secondary">
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

function ReviewerContributionDetails({
  activity,
}: {
  activity: OneOnOneReviewedPullRequestActivity;
}) {
  const { commentsBySelectedReviewer, discussionsStartedBySelectedReviewer, reviewActivitiesBySelectedReviewer } = activity;
  const reviewSummary = summarizeReviewActivities(reviewActivitiesBySelectedReviewer);
  const hasCapturedText = discussionsStartedBySelectedReviewer.length > 0 || commentsBySelectedReviewer.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Reviewer contribution summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`${discussionsStartedBySelectedReviewer.length} discussions started, ${commentsBySelectedReviewer.length} comments left${
            reviewSummary.length > 0 ? `, ${reviewSummary.join(', ')}` : ''
          }`}
        </Typography>
      </Box>

      {!hasCapturedText && (
        <Typography variant="body2" color="text.secondary">
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
        <Typography variant="body2" fontWeight={600}>
          {discussion.reviewerName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {discussion.comments.length} comment{discussion.comments.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      <Stack spacing={1}>
        {discussion.comments.map((comment) => (
          <Box key={comment.id} sx={{ backgroundColor: 'background.default', p: 1, borderRadius: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              {comment.reviewerName} • {dayjs(comment.createdAt).format('DD MMM YYYY')}
            </Typography>
            <Typography variant="body2">{comment.body}</Typography>
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
        <Typography variant="body2" fontWeight={600}>
          {discussion.reviewerName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Started discussion • {reviewerComments.length} comment{reviewerComments.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      <Stack spacing={1}>
        {reviewerComments.map((comment) => (
          <Box key={comment.id} sx={{ backgroundColor: 'background.default', p: 1, borderRadius: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
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
      <Typography variant="caption" color="text.secondary">
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
          <Typography variant="body2" color="text.secondary">
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

const InsightCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#293164',
  padding: theme.spacing(2),
}));

function summarizeReviewActivities(reviewActivities: OneOnOneReviewedPullRequestActivity['reviewActivitiesBySelectedReviewer']) {
  const activityCounts = reviewActivities.reduce(
    (total, item) => {
      total[item.activityType] = (total[item.activityType] ?? 0) + 1;
      return total;
    },
    {} as Record<string, number>
  );

  return Object.entries(activityCounts).map(([activityType, count]) => `${count} ${activityType}`);
}
