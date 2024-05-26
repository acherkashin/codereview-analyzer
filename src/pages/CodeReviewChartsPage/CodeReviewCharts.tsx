import React from 'react';
import { Grid, styled } from '@mui/material';
import {
  ReviewRequestRecipientsChart,
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
  DiscussionsStartedByPerMonthChart,
  DiscussionsStartedWithPerMonthChart,
  PullRequestsCreatedChart,
  ChangesToDiscussionsCorrelationChart,
} from '../../components/charts';
import {
  getAllUsers,
  getComments,
  getDiscussions,
  getFilteredPullRequests,
  getHostType,
  getUser,
  getUserComments,
  useChartsStore,
} from '../../stores/ChartsStore';
import { ChartsTitle } from './ChartsTitle';
import { ReviewCalendarChart } from '../../components/charts/ReviewCalendarChart/ReviewCalendarChart';
import { WordsCloudProps } from '../../components/charts/WordsCloud/WordsCloud';
import { DiscussionsStartedByPerMonthChartProps } from '../../components/charts/DiscussionsStartedByPerMonthChart/DiscussionsPerMonthChart';
import { useUpdateReason } from '../../hooks/useUpdateReason';
import { UserDiscussion } from '../../services/types';
import { useShallow } from 'zustand/react/shallow';
// import { UsersConnectionChart } from '../components/charts/UsersConnectionChart/UsersConnectionChart';

export interface CodeReviewChartsProps {
  onWordClick: WordsCloudProps['onClick'];
  onShowComments: (reviewerName: string | null, authorName: string | null) => void;
  onShowDiscussions: (reviewerName: string | null, authorName: string | null) => void;
  onShowDiscussionsAt: DiscussionsStartedByPerMonthChartProps['onClick'];
  onDiscussionClick: (discussion: UserDiscussion) => void;
}

function _CodeReviewCharts({
  onWordClick,
  onShowComments,
  onShowDiscussions,
  onShowDiscussionsAt,
  onDiscussionClick,
}: CodeReviewChartsProps) {
  //TODO: getFilteredPullRequests is run too many times
  const pullRequests = useChartsStore(useShallow(getFilteredPullRequests));
  const comments = useChartsStore(useShallow(getComments));
  const discussions = useChartsStore(useShallow(getDiscussions));
  const userComments = useChartsStore(useShallow(getUserComments));
  const user = useChartsStore(getUser);
  const users = useChartsStore(getAllUsers)!;
  const hostType = useChartsStore(getHostType);

  useUpdateReason('CodeReviewCharts', {
    pullRequests,
    comments,
    discussions,
    user,
    users,
    userComments,
    onWordClick,
    onShowComments,
    onShowDiscussions,
    onShowDiscussionsAt,
  });

  return (
    <div className="cr-code-review-charts">
      <ChartsTitle>Discussions</ChartsTitle>
      <ChartsContainer container>
        <Grid item xs={12}>
          <DiscussionsStartedByPerMonthChart user={user} discussions={discussions} onClick={onShowDiscussionsAt} />
        </Grid>
        <Grid item xs={12}>
          <DiscussionsStartedWithPerMonthChart user={user} discussions={discussions} onClick={onShowDiscussionsAt} />
        </Grid>
        <Grid item lg={4} md={6} xs={12}>
          <TopLongestDiscussionsChart user={user} pullRequests={pullRequests} count={10} onClick={onDiscussionClick} />
        </Grid>
        {user == null && (
          <Grid item lg={4} md={6} xs={12}>
            <StartedWithDiscussionsPieChart
              discussions={discussions}
              onClick={(authorName) => onShowDiscussions(null, authorName)}
            />
          </Grid>
        )}
        {user == null && (
          <Grid item lg={4} md={6} xs={12}>
            <StartedByDiscussionsPieChart
              discussions={discussions}
              onClick={(reviewerName) => onShowDiscussions(reviewerName, null)}
            />
          </Grid>
        )}
        <Grid item lg={4} md={6} xs={12}>
          <StartedByDiscussionsChart user={user} discussions={discussions} onClick={onShowDiscussions} />
        </Grid>
        <Grid item lg={4} md={6} xs={12}>
          <StartedWithDiscussionsChart user={user} discussions={discussions} onClick={onShowDiscussions} />
        </Grid>
        {user == null && (
          <Grid item lg={4} md={6} xs={12}>
            <ChangesToDiscussionsCorrelationChart pullRequests={pullRequests} />
          </Grid>
        )}
      </ChartsContainer>
      <ChartsTitle>Comments</ChartsTitle>
      <ChartsContainer container>
        <Grid item xs={12}>
          <CommentsPerMonthChart user={user} comments={comments} />
        </Grid>
        <Grid item xs={12}>
          <WordsCloud comments={user ? userComments : comments} onClick={onWordClick} />
        </Grid>
        <Grid item lg={user != null ? 4 : 12} md={user != null ? 4 : 12} xs={12}>
          <ReviewByUserChart user={user} pullRequests={pullRequests} users={users} />
        </Grid>
        <Grid item lg={4} md={6} xs={12}>
          <TopCommentedPullRequestsChart user={user} pullRequests={pullRequests} count={10} />
        </Grid>
        {user == null && (
          <Grid item lg={4} md={6} xs={12}>
            <CommentsLeftPieChart comments={comments} onClick={(id) => onShowComments(id, null)} />
          </Grid>
        )}
        <Grid item lg={4} md={6} xs={12}>
          <CommentsLeftBarChart user={user} comments={comments} onClick={onShowComments} />
        </Grid>

        {user == null && (
          <Grid item lg={4} md={6} xs={12}>
            <CommentsReceivedPieChart comments={comments} onClick={(id) => onShowComments(null, id)} />
          </Grid>
        )}
        <Grid item lg={4} md={6} xs={12}>
          <CommentsReceivedBarChart user={user} comments={comments} onClick={onShowComments} />
        </Grid>
        {hostType === 'Gitea' && (
          <Grid item lg={4} md={6} xs={12}>
            <CommentedFilesChart user={user} comments={comments} />
          </Grid>
        )}
        {/* <UsersConnectionChart pullRequests={pullRequests} users={users} /> */}
      </ChartsContainer>

      <ChartsTitle>Approvals</ChartsTitle>

      <ChartsContainer container>
        <Grid item lg={4} md={6} xs={12}>
          <ApprovalDistributionChart user={user} pullRequests={pullRequests} users={users} />
        </Grid>
        <Grid item lg={4} md={6} xs={12}>
          <ApprovalRecipientsChart user={user} pullRequests={pullRequests} users={users} />
        </Grid>
      </ChartsContainer>

      <ChartsTitle>Review Requests</ChartsTitle>

      <ChartsContainer container>
        <Grid item lg={4} md={6} xs={12}>
          <ReviewRequestRecipientsChart user={user} pullRequests={pullRequests} users={users} />
        </Grid>
        <Grid item lg={4} md={6} xs={12}>
          <ReviewRequestDistributionChart user={user} pullRequests={pullRequests} users={users} />
        </Grid>
        <Grid item xs={12}>
          <ReviewCalendarChart user={user} pullRequests={pullRequests} />
        </Grid>
      </ChartsContainer>

      <ChartsTitle>Other</ChartsTitle>

      <ChartsContainer container>
        {user == null && (
          <Grid item lg={4} md={6} xs={12}>
            <PullRequestsCreatedChart pullRequests={pullRequests} />
          </Grid>
        )}
      </ChartsContainer>
    </div>
  );
}

const ChartsContainer = styled(Grid)(() => ({
  display: 'flex',
  flexFlow: 'row wrap',
  padding: '10px',
}));

export const CodeReviewCharts = React.memo(_CodeReviewCharts);
