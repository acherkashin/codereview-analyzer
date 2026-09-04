import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import { useShallow } from 'zustand/react/shallow';
import { AnalyzeParams, PullRequest } from '../../services/types';
import { FilterPanel } from '../../components/FilterPanel/FilterPanel';
import { ChartContainer, ImportTextButton, PullRequestList } from '../../components';
import { PageContainer } from '../shared/PageContainer';
import { useClient } from '../../stores/AuthStore';
import { getAnalyze, getTeamReviewAuthoredPullRequests, getTeamReviewModel, useChartsStore } from '../../stores/ChartsStore';
import { useIsGuest } from '../../hooks/useIsGuest';
import { chartColor } from '../../utils/ColorUtils';
import { PieChart } from '../../components/charts/PieChart';
import { TeamReviewPieDatum, TeamReviewSummary } from '../../utils/TeamReviewUtils';
import { TeamReviewFilterPanel } from './TeamReviewFilterPanel';
import { RelationshipMatrixMetric, TeamRelationshipMatrix } from './TeamRelationshipMatrix';
import { PullRequestSizeTrendChart } from './PullRequestSizeTrendChart';
import { RelationshipDetails } from './RelationshipDetails';

export function TeamReviewPage() {
  const client = useClient();
  const isGuest = useIsGuest();
  const analyze = useChartsStore(getAnalyze);
  const teamReviewModel = useChartsStore(getTeamReviewModel);
  const authoredPullRequests = useChartsStore(getTeamReviewAuthoredPullRequests);
  const importData = useChartsStore((state) => state.actions.import);

  const { users, allPullRequests } = useChartsStore(
    useShallow((state) => ({
      users: state.users,
      allPullRequests: state.pullRequests,
    }))
  );

  const [selectedPullRequest, setSelectedPullRequest] = useState<PullRequest | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [relationshipMatrixMetric, setRelationshipMatrixMetric] = useState<RelationshipMatrixMetric>('reviewedPullRequestsCount');

  const selectedRelationship = useMemo(() => {
    return teamReviewModel.relationships.find((relationship) => relationship.id === selectedRelationshipId) ?? null;
  }, [selectedRelationshipId, teamReviewModel.relationships]);

  useEffect(() => {
    if (
      selectedRelationshipId &&
      !teamReviewModel.relationships.some((relationship) => relationship.id === selectedRelationshipId)
    ) {
      setSelectedRelationshipId(null);
    }
  }, [selectedRelationshipId, teamReviewModel.relationships]);

  useEffect(() => {
    if (selectedPullRequest && !authoredPullRequests.some((pullRequest) => pullRequest.id === selectedPullRequest.id)) {
      setSelectedPullRequest(null);
    }
  }, [authoredPullRequests, selectedPullRequest]);

  const handleAnalyze = useCallback(
    (params: AnalyzeParams) => {
      return analyze(client, params);
    },
    [analyze, client]
  );

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
        <TeamReviewFilterPanel />

        <Stack spacing={3} sx={{ pt: 3, pb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              Team Review
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
              }}
            >
              Review team collaboration, review coverage, and authored pull request shape for the selected period.
            </Typography>
          </Box>

          {teamReviewModel.selectedTeamMembers.length === 0 ? (
            <EmptyStateCard
              title="Select team members"
              description="Choose several team members above to load their authored pull requests and reviewer-to-author relationships."
            />
          ) : (
            <>
              <TeamInsightsSection summary={teamReviewModel.summary} />

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.9fr) minmax(340px, 0.8fr)' },
                  alignItems: 'stretch',
                }}
              >
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <SectionTitle icon={<AccountTreeOutlinedIcon color="primary" />} title="Review relationships" />
                      {teamReviewModel.relationships.length > 0 ? (
                        <TeamRelationshipMatrix
                          model={teamReviewModel}
                          metric={relationshipMatrixMetric}
                          selectedRelationshipId={selectedRelationshipId}
                          onMetricChange={setRelationshipMatrixMetric}
                          onRelationshipSelect={setSelectedRelationshipId}
                        />
                      ) : (
                        <EmptyStatePanel description="No captured review relationships were found for the selected team in this period." />
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <RelationshipDetails relationship={selectedRelationship} metric={relationshipMatrixMetric} />
              </Box>

              <PullRequestSizeTrendChart
                summary={teamReviewModel.summary}
                monthlySizeBuckets={teamReviewModel.monthlySizeBuckets}
                authoredPullRequests={authoredPullRequests}
              />

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
                  alignItems: 'stretch',
                }}
              >
                <ReviewShareChart
                  title="Approvals"
                  description="Share of approvals given by selected team members."
                  data={teamReviewModel.approvalShare}
                  emptyText="No approvals from selected team members were captured."
                />
                <ReviewShareChart
                  title="Discussions started"
                  description="Share of review discussions started by selected team members."
                  data={teamReviewModel.discussionShare}
                  emptyText="No started discussions from selected team members were captured."
                />
              </Box>

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <SectionTitle icon={<AssignmentOutlinedIcon color="primary" />} title="Pull requests" />
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      Authored pull requests created by selected team members in the selected period.
                    </Typography>

                    {authoredPullRequests.length > 0 ? (
                      <PullRequestList
                        pullRequests={authoredPullRequests}
                        variant="oneOnOne"
                        selectedPullRequestId={selectedPullRequest?.id}
                        onPullRequestSelect={setSelectedPullRequest}
                      />
                    ) : (
                      <EmptyStatePanel description="Selected team members did not create pull requests in this period." />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </Box>
    </PageContainer>
  );
}

function TeamInsightsSection({ summary }: { summary: TeamReviewSummary }) {
  const insightCards = [
    { label: 'Team members', value: summary.teamMembersCount },
    { label: 'PRs authored', value: summary.authoredPullRequestsCount },
    { label: 'PRs reviewed', value: summary.reviewedPullRequestsCount },
    { label: 'Approvals', value: summary.approvalsCount },
    { label: 'Discussions', value: summary.discussionsStartedCount },
    { label: 'Comments', value: summary.commentsCount },
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
        Snapshot of authored work and directional review activity for the selected team.
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

function ReviewShareChart({
  title,
  description,
  data,
  emptyText,
}: {
  title: string;
  description: string;
  data: TeamReviewPieDatum[];
  emptyText: string;
}) {
  const visibleData = data.filter((item) => item.value > 0);

  return (
    <ChartContainer title={title} description={description} height={360} style={{ margin: 0, height: '100%' }}>
      {visibleData.length > 0 ? (
        <PieChart data={visibleData} colors={chartColor} />
      ) : (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {emptyText}
          </Typography>
        </Box>
      )}
    </ChartContainer>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
}

function EmptyStateCard({ title, description }: { title: string; description: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <SectionTitle icon={<SpeakerNotesOutlinedIcon color="primary" />} title={title} />
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

function EmptyStatePanel({ description }: { description: string }) {
  return (
    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.default' }}>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

const InsightCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderTop: `3px solid ${theme.palette.primary.main}`,
}));
