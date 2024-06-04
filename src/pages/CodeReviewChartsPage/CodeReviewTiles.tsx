import { useMemo } from 'react';
import { Grid, Stack } from '@mui/material';
import {
  getComments,
  useChartsStore,
  getMostCommentsLeft,
  getMostCommentsReceived,
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
import { getLongestDiscussions, getLongestPullRequest, getReviewRation, getReviewRationForUser } from '../../utils/ChartUtils';
import { User } from '../../services/types';
import { MostCommentsPullRequestTile } from '../../components/tiles/MostCommentsPullRequestTile';
import { MostCommentsLeftByTile } from '../../components/tiles/MostCommentsLeftByTile';
import { MostCommentsReceivedTile } from '../../components/tiles/MostCommentsReceivedTile';
import { LongestPullRequestTile } from '../../components/tiles/LongestPullRequestTile';
import { LongestDiscussionTile } from '../../components/tiles/LongestDiscussionTile';
import { TileGridItem } from './TileGridItem';
import { toPercentString } from '../../utils/PercentUtils';

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

  const { user: mostCommentsLeftUser, total: mostCommentsLeftTotal } = useChartsStore(getMostCommentsLeft);
  const { user: mostCommentsReceivedUser, total: mostCommentsReceivedTotal } = useChartsStore(getMostCommentsReceived);

  const commentedFilesCount = useMemo(() => getCommentedFilesCount(comments), [comments]);

  const longestPullRequest = useMemo(() => getLongestPullRequest(userPullRequests), [userPullRequests]);
  const longestDiscussion = useMemo(() => getLongestDiscussions(allPullRequests, 1, user)[0], [allPullRequests, user]);

  const noDiscussionsPr = useMemo(() => {
    const noComments = pullRequests.filter((item) => item.discussions.length === 0);

    return toPercentString(noComments.length, pullRequests.length);
  }, [pullRequests]);

  const reviewRation = useMemo(() => {
    const ration = user == null ? getReviewRation(allPullRequests) : getReviewRationForUser(allPullRequests, user.id);

    return `${ration}%`;
  }, [allPullRequests, user]);

  if (allPullRequests == null || allPullRequests.length === 0) {
    return null;
  }

  return (
    <Grid container>
      <TileGridItem>
        <Tile count={comments.length} title="Comments" icon={<CommentRoundedIcon fontSize="large" sx={{ color: 'white' }} />} />
      </TileGridItem>

      <TileGridItem>
        <Tile count={discussions.length} title="Discussions" icon={<ForumIcon fontSize="large" sx={{ color: 'white' }} />} />
      </TileGridItem>

      <TileGridItem>
        <Tile count={pullRequests.length} title="Pull requests" icon={<BranchIcon />} />
      </TileGridItem>
      {mostCommentedPRs != null && (
        <TileGridItem>
          <MostCommentsPullRequestTile pullRequest={mostCommentedPRs} />
        </TileGridItem>
      )}
      {mostCommentsLeftUser && user == null && (
        <TileGridItem>
          <MostCommentsLeftByTile user={mostCommentsLeftUser} count={mostCommentsLeftTotal} />
        </TileGridItem>
      )}
      {mostCommentsReceivedUser && user == null && (
        <TileGridItem>
          <MostCommentsReceivedTile user={mostCommentsReceivedUser} count={mostCommentsReceivedTotal} />
        </TileGridItem>
      )}
      {longestPullRequest && (
        <TileGridItem>
          <LongestPullRequestTile pullRequest={longestPullRequest} />
        </TileGridItem>
      )}
      <TileGridItem>
        <Tile
          count={commentedFilesCount}
          title="Commented files"
          icon={<FileCopyIcon fontSize="large" sx={{ color: 'white' }} />}
        />
      </TileGridItem>
      <TileGridItem>
        <LongestDiscussionTile discussion={longestDiscussion} />
      </TileGridItem>
      <TileGridItem>
        <Tile count={noDiscussionsPr} title={'PRs merged without comments'} icon={<BranchIcon />} />
      </TileGridItem>
      <TileGridItem>
        <Tile
          count={reviewRation}
          title="Review ration"
          icon={<BranchIcon />}
          description={
            <Stack direction="column" spacing={1}>
              <div>Represents probability that the developer will review a pull request assigned to him.</div>
              <div>Filter by user to see review ration for a specific user.</div>
            </Stack>
          }
        />
      </TileGridItem>
    </Grid>
  );
}
