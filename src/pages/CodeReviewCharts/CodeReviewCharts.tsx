import { PropsWithChildren, useCallback, useState } from 'react';
import { getEndDate, getFilteredComments, getFilteredDiscussions, getStartDate } from '../../utils/GitUtils';
import { CommentList, DiscussionList, FullScreenDialog, UsersList } from '../../components';
import { Button, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {
  getAnalyze,
  getComments,
  getDiscussions,
  getFilteredPullRequests,
  getHostType,
  getUserComments,
  useChartsStore,
} from '../../stores/ChartsStore';

import { ImportTextButton } from '../../components/FileUploadButton';
import { useClient } from '../../stores/AuthStore';
import { FilterPanel } from '../../components/FilterPanel/FilterPanel';
import { PageContainer } from '../shared/PageContainer';
import { AnalyzeParams, Comment, UserDiscussion } from '../../services/types';
import { CommentItemProps } from '../../components/CommentList';
import { CodeReviewTiles } from './CodeReviewTiles';
import { useIsGuest } from '../../hooks/useIsGuest';
import {
  ReviewRequestRecipients,
  ReviewRequestDistributionChart,
  ApprovalDistributionChart,
  ApprovalRecipientsChart,
  StartedWithDiscussionsChart,
  StartedWithDiscussionsPieChart,
  CommentsLeftPieChart,
  CommentsReceivedPieChart,
  StartedByDiscussionsPieChart,
  CommentsLeftBarChart,
  CommentsReceivedBarChart,
  ReviewByUserChart,
  CommentedFilesChart,
  CommentsPerMonthChart,
  WordsCloud,
  TopLongestDiscussionsChart,
  TopCommentedPullRequestsChart,
  StartedByDiscussionsChart,
  DiscussionsPerMonthChart,
  PullRequestsCreatedChart,
} from '../../components/charts';
import dayjs from 'dayjs';
import ExportButton from './ExportButton';
// import { UsersConnectionChart } from '../components/charts/UsersConnectionChart/UsersConnectionChart';

export interface CodeReviewChartsProps {}

export function CodeReviewCharts(_: CodeReviewChartsProps) {
  const client = useClient();
  const isGuest = useIsGuest();

  const minDate = useChartsStore((state) => dayjs(getStartDate(state.pullRequests)));
  const maxDate = useChartsStore((state) => dayjs(getEndDate(state.pullRequests)));

  const { user, pullRequests: allPrs, users, startDate, endDate, setStartDate, setEndDate } = useChartsStore();
  const pullRequests = useChartsStore(getFilteredPullRequests);

  const importData = useChartsStore((state) => state.import);
  const closeAnalysis = useChartsStore((state) => state.closeAnalysis);
  const setUser = useChartsStore((state) => state.setUser);
  const comments = useChartsStore(getComments);
  const discussions = useChartsStore(getDiscussions);
  const analyze = useChartsStore(getAnalyze);

  const [title, setTitle] = useState('');
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<UserDiscussion[]>([]);

  const hostType = useChartsStore(getHostType);
  const userComments = useChartsStore(getUserComments);

  const showFilteredComments = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      const filteredComments = getFilteredComments(comments, reviewerName, authorName);

      let title = '';
      if (reviewerName && authorName) {
        title = `Comments received by ${authorName} from ${reviewerName}`;
      } else if (reviewerName) {
        title = `Comments left by ${reviewerName}`;
      } else if (authorName) {
        title = `Comments received by ${authorName}`;
      }

      title += `. Total: ${filteredComments.length}`;

      setTitle(title);
      setFilteredComments(filteredComments);
    },
    [comments]
  );

  const showFilteredDiscussions = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      const filteredDiscussions = getFilteredDiscussions(discussions, reviewerName, authorName);

      let title = '';
      if (reviewerName && authorName) {
        title = `Discussions started by ${reviewerName} with ${authorName}`;
      } else if (reviewerName) {
        title = `Discussions started by ${reviewerName}`;
      } else if (authorName) {
        title = `Discussions started with ${authorName}`;
      }
      title += `. Total: ${filteredDiscussions.length}`;

      setTitle(title);
      setFilteredDiscussions(filteredDiscussions);
    },
    [discussions]
  );

  const handleAnalyze = useCallback(
    (params: AnalyzeParams) => {
      return analyze(client, params);
    },
    [analyze, client]
  );

  const handleWordClick = useCallback(
    (word: string) => {
      const filtered = comments.filter((item) => item.body.includes(word));
      setTitle(`Comments containing "${word}". Count: ${filtered.length}`);
      setFilteredComments(filtered);
    },
    [comments]
  );

  if (allPrs.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Stack spacing={2} position="sticky" style={{ width: 300 }}>
          {!isGuest && <FilterPanel onAnalyze={handleAnalyze} />}
          <ImportTextButton
            label="Import as JSON"
            onTextSelected={(json) => {
              try {
                importData(json);
              } catch (ex) {
                //TODO: need to show error in UI
                console.error(ex);
              }
            }}
          />
        </Stack>
      </div>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowX: 'hidden' }}>
        <Stack direction="row" spacing={2}>
          <DatePicker
            label="Created After"
            format="DD/MM/YYYY"
            value={startDate}
            minDate={minDate}
            maxDate={maxDate}
            onChange={setStartDate}
          />
          <DatePicker
            label="Created Before"
            format="DD/MM/YYYY"
            value={endDate}
            minDate={startDate || undefined}
            maxDate={maxDate}
            onChange={setEndDate}
          />

          <Divider aria-hidden="true" orientation="vertical" variant="middle" />

          <UsersList label="Users" user={user} users={users} onSelected={setUser} />

          <ExportButton style={{ marginLeft: 'auto' }} />

          {/* TODO: probably need to show confirmation dialog to prevent closing analysis if data were not exported */}
          <Tooltip title="Close Analysis">
            <Button size="small" variant="contained" onClick={closeAnalysis}>
              <CloseIcon />
            </Button>
          </Tooltip>
        </Stack>

        <ChartsTitle>Highlights</ChartsTitle>
        <CodeReviewTiles user={user} />

        <div className="charts-container">
          <ChartsTitle>Discussions</ChartsTitle>
          <Grid container className="charts">
            <Grid item xs={12}>
              <DiscussionsPerMonthChart user={user} discussions={discussions} />
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <TopLongestDiscussionsChart
                user={user}
                pullRequests={pullRequests}
                count={10}
                onClick={(discussion) => {
                  setTitle(`Discussion started by ${discussion.reviewerName} in ${discussion.pullRequestName}`);
                  setFilteredDiscussions([discussion]);
                }}
              />
            </Grid>
            {user == null && (
              <Grid item lg={4} md={6} xs={12}>
                <StartedWithDiscussionsPieChart
                  discussions={discussions}
                  onClick={(authorName) => showFilteredDiscussions(null, authorName)}
                />
              </Grid>
            )}
            {user == null && (
              <Grid item lg={4} md={6} xs={12}>
                <StartedByDiscussionsPieChart
                  discussions={discussions}
                  onClick={(reviewerName) => showFilteredDiscussions(reviewerName, null)}
                />
              </Grid>
            )}
            <Grid item lg={4} md={6} xs={12}>
              <StartedByDiscussionsChart user={user} discussions={discussions} onClick={showFilteredDiscussions} />
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <StartedWithDiscussionsChart user={user} discussions={discussions} onClick={showFilteredDiscussions} />
            </Grid>
          </Grid>
          <ChartsTitle>Comments</ChartsTitle>
          <Grid container className="charts">
            <Grid item xs={12}>
              <CommentsPerMonthChart user={user} comments={comments} />
            </Grid>
            <Grid item xs={12}>
              <WordsCloud comments={user ? userComments : comments} onClick={handleWordClick} />
            </Grid>
            <Grid item lg={user != null ? 4 : 12} md={user != null ? 4 : 12} xs={12}>
              <ReviewByUserChart user={user} pullRequests={pullRequests} users={users} />
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <TopCommentedPullRequestsChart user={user} pullRequests={pullRequests} count={10} />
            </Grid>
            {user == null && (
              <Grid item lg={4} md={6} xs={12}>
                <CommentsLeftPieChart comments={comments} onClick={(id) => showFilteredComments(id, null)} />
              </Grid>
            )}
            <Grid item lg={4} md={6} xs={12}>
              <CommentsLeftBarChart user={user} comments={comments} onClick={showFilteredComments} />
            </Grid>

            {user == null && (
              <Grid item lg={4} md={6} xs={12}>
                <CommentsReceivedPieChart comments={comments} onClick={(id) => showFilteredComments(null, id)} />
              </Grid>
            )}
            <Grid item lg={4} md={6} xs={12}>
              <CommentsReceivedBarChart user={user} comments={comments} onClick={showFilteredComments} />
            </Grid>
            {hostType === 'Gitea' && (
              <Grid item lg={4} md={6} xs={12}>
                <CommentedFilesChart user={user} comments={comments} />
              </Grid>
            )}
            {/* <UsersConnectionChart pullRequests={pullRequests} users={users} /> */}
          </Grid>

          <ChartsTitle>Approvals</ChartsTitle>

          <Grid container className="charts">
            <Grid item lg={4} md={6} xs={12}>
              <ApprovalDistributionChart user={user} pullRequests={pullRequests} users={users} />
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <ApprovalRecipientsChart user={user} pullRequests={pullRequests} users={users} />
            </Grid>
          </Grid>

          <ChartsTitle>Review Requests</ChartsTitle>

          <Grid container className="charts">
            <Grid item lg={4} md={6} xs={12}>
              <ReviewRequestRecipients user={user} pullRequests={pullRequests} users={users} />
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <ReviewRequestDistributionChart user={user} pullRequests={pullRequests} users={users} />
            </Grid>
          </Grid>

          <ChartsTitle>Other</ChartsTitle>

          <Grid container className="charts">
            {user == null && (
              <Grid item lg={4} md={6} xs={12}>
                <PullRequestsCreatedChart pullRequests={pullRequests} />
              </Grid>
            )}
          </Grid>
        </div>
      </div>

      <FullScreenDialog
        icon={<SpeakerNotesOutlinedIcon />}
        title={title}
        open={filteredComments.length !== 0}
        onClose={() => {
          setFilteredComments([]);
        }}
      >
        <CommentList
          comments={filteredComments.map(
            (item) =>
              ({
                id: item.id,
                avatarUrl: item.prAuthorAvatarUrl,
                title: item.pullRequestName,
                commentUrl: item.url,
                noteText: item.body,
              } as CommentItemProps)
          )}
        />
      </FullScreenDialog>
      <FullScreenDialog
        icon={<QuestionAnswerOutlinedIcon />}
        title={title}
        open={filteredDiscussions.length !== 0}
        onClose={() => {
          setFilteredDiscussions([]);
        }}
      >
        <DiscussionList discussions={filteredDiscussions} />
      </FullScreenDialog>
    </PageContainer>
  );
}

function ChartsTitle({ children }: PropsWithChildren<{}>) {
  return (
    <Typography variant="h3" component="h2" ml={3}>
      {children}
    </Typography>
  );
}
