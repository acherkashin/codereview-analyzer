import { Grid } from '@mui/material';
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
  getComments,
  getDiscussions,
  getFilteredPullRequests,
  getHostType,
  getUserComments,
  useChartsStore,
} from '../../stores/ChartsStore';
import { ChartsTitle } from './ChartsTitle';
import { ReviewCalendarChart } from '../../components/charts/ReviewCalendarChart/ReviewCalendarChart';
import { WordsCloudProps } from '../../components/charts/WordsCloud/WordsCloud';
import { CommentsLeftBarChartProps } from '../../components/charts/CommentsLeftChart/CommentsLeftBarChart';
import { DiscussionsStartedByPerMonthChartProps } from '../../components/charts/DiscussionsStartedByPerMonthChart/DiscussionsPerMonthChart';
import { useUpdateReason } from '../../hooks/useUpdateReason';
import React from 'react';

export interface CodeReviewChartsProps {
  onWordClick: WordsCloudProps['onClick'];
  onShowComments: (reviewerName: string | null, authorName: string | null) => void;
  onShowDiscussions: (reviewerName: string | null, authorName: string | null) => void;
  onShowDiscussionsAt: DiscussionsStartedByPerMonthChartProps['onClick'];
}

function _CodeReviewCharts({ onWordClick, onShowComments, onShowDiscussions, onShowDiscussionsAt }: CodeReviewChartsProps) {
  const pullRequests = useChartsStore(getFilteredPullRequests);
  const comments = useChartsStore(getComments);
  const discussions = useChartsStore(getDiscussions);
  const user = useChartsStore((state) => state.user);
  const users = useChartsStore((state) => state.users)!;
  const hostType = useChartsStore(getHostType);
  const userComments = useChartsStore(getUserComments);

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
    <div className="charts-container">
      <ChartsTitle>Discussions</ChartsTitle>
      <Grid container className="charts">
        <Grid item xs={12}>
          <DiscussionsStartedByPerMonthChart user={user} discussions={discussions} onClick={onShowDiscussionsAt} />
        </Grid>
        <Grid item xs={12}>
          <DiscussionsStartedWithPerMonthChart user={user} discussions={discussions} onClick={onShowDiscussionsAt} />
        </Grid>
        <Grid item lg={4} md={6} xs={12}>
          <TopLongestDiscussionsChart
            user={user}
            pullRequests={pullRequests}
            count={10}
            onClick={(discussion) => {
              //   setTitle(`Discussion started by ${discussion.reviewerName} in ${discussion.pullRequestName}`);
              //   setFilteredDiscussions([discussion]);
            }}
          />
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
      </Grid>
      <ChartsTitle>Comments</ChartsTitle>
      <Grid container className="charts">
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
          <ReviewRequestRecipientsChart user={user} pullRequests={pullRequests} users={users} />
        </Grid>
        <Grid item lg={4} md={6} xs={12}>
          <ReviewRequestDistributionChart user={user} pullRequests={pullRequests} users={users} />
        </Grid>
        <Grid item xs={12}>
          <ReviewCalendarChart user={user} pullRequests={pullRequests} />
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
  );
}

export const CodeReviewCharts = React.memo(_CodeReviewCharts);
