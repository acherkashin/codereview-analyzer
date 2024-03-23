import { useMemo } from 'react';
import { Grid } from '@mui/material';
import {
  getComments,
  useChartsStore,
  useMostCommentsLeft,
  useMostCommentsReceived,
  getDiscussions,
  getUserComments,
  getUserDiscussions,
  getUserPullRequests,
  getCommentedFilesCount,
  getFilteredPullRequests,
} from '../../stores/ChartsStore';
import { Tile } from '../../components/tiles/Tile';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CommentRoundedIcon from '@mui/icons-material/CommentRounded';
import ForumIcon from '@mui/icons-material/Forum';
import { BranchIcon } from '../../icons/BranchIcon';
import { getLongestDiscussions, getLongestPullRequest } from '../../utils/ChartUtils';
import { User } from '../../services/types';
import { MostCommentsPullRequestTile } from '../../components/tiles/MostCommentsPullRequestTile';
import { MostCommentsLeftByTile } from '../../components/tiles/MostCommentsLeftByTile';
import { MostCommentsReceivedTile } from '../../components/tiles/MostCommentsReceivedTile';
import { LongestPullRequestTile } from '../../components/tiles/LongestPullRequestTile';
import { LongestDiscussionTile } from '../../components/tiles/LongestDiscussionTile';

export interface CodeReviewTilesProps {
  user?: User | null;
}

export function CodeReviewTiles({ user }: CodeReviewTilesProps) {
  const allPullRequests = useChartsStore(getFilteredPullRequests);
  const allComments = useChartsStore(getComments);
  const allDiscussions = useChartsStore(getDiscussions);

  const userComments = useChartsStore(getUserComments);
  const userDiscussions = useChartsStore(getUserDiscussions);
  const userPullRequests = useChartsStore(getUserPullRequests);

  const comments = user ? userComments : allComments;
  const discussions = user ? userDiscussions : allDiscussions;
  const pullRequests = user ? userPullRequests : allPullRequests;

  const mostCommentedPRs = useMemo(() => {
    const sorted = pullRequests.toSorted((a, b) => b.comments.length - a.comments.length);
    return sorted[0];
  }, [pullRequests]);

  const { user: mostCommentsLeftUser, total: mostCommentsLeftTotal } = useMostCommentsLeft();
  const { user: mostCommentsReceivedUser, total: mostCommentsReceivedTotal } = useMostCommentsReceived();

  const commentedFilesCount = useMemo(() => getCommentedFilesCount(comments), [comments]);

  const longestPullRequest = useMemo(() => getLongestPullRequest(userPullRequests), [userPullRequests]);
  const longestDiscussion = useMemo(() => getLongestDiscussions(allPullRequests, 1, user)[0], [allPullRequests, user]);

  const noDiscussionsPr = useMemo(() => {
    const noComments = pullRequests.filter((item) => item.discussions.length === 0);
    const percent = Math.ceil((noComments.length / pullRequests.length) * 100);

    return `${percent}%`;
  }, [pullRequests]);

  if (allPullRequests == null || allPullRequests.length === 0) {
    return null;
  }

  return (
    <Grid container>
      <Grid item xs={6} md={4} lg={2}>
        <Tile count={comments.length} title="Comments" icon={<CommentRoundedIcon fontSize="large" sx={{ color: 'white' }} />} />
      </Grid>

      <Grid item xs={6} md={4} lg={2}>
        <Tile count={discussions.length} title="Discussions" icon={<ForumIcon fontSize="large" sx={{ color: 'white' }} />} />
      </Grid>

      <Grid item xs={6} md={4} lg={2}>
        <Tile count={pullRequests.length} title="Pull requests" icon={<BranchIcon />} />
      </Grid>
      {mostCommentedPRs != null && (
        <Grid item xs={6} md={4} lg={2}>
          <MostCommentsPullRequestTile pullRequest={mostCommentedPRs} />
        </Grid>
      )}
      {mostCommentsLeftUser && user == null && (
        <Grid item xs={6} md={4} lg={2}>
          <MostCommentsLeftByTile user={mostCommentsLeftUser} count={mostCommentsLeftTotal} />
        </Grid>
      )}
      {mostCommentsReceivedUser && user == null && (
        <Grid item xs={6} md={4} lg={2}>
          <MostCommentsReceivedTile user={mostCommentsReceivedUser} count={mostCommentsReceivedTotal} />
        </Grid>
      )}
      {longestPullRequest && (
        <Grid item xs={6} md={4} lg={2}>
          <LongestPullRequestTile pullRequest={longestPullRequest} />
        </Grid>
      )}
      <Grid item xs={6} md={4} lg={2}>
        <Tile
          count={commentedFilesCount}
          title="Commented files"
          icon={<FileCopyIcon fontSize="large" sx={{ color: 'white' }} />}
        />
      </Grid>
      <Grid item xs={6} md={4} lg={2}>
        <LongestDiscussionTile discussion={longestDiscussion} />
      </Grid>
      <Grid item xs={6} md={4} lg={2}>
        <Tile count={noDiscussionsPr} title={'PRs merged without comments'} icon={<BranchIcon />} />
      </Grid>
    </Grid>
  );
}
