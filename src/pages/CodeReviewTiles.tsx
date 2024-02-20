import { useMemo } from 'react';
import { Stack } from '@mui/material';
import {
  getComments,
  useChangedFilesCount as useCommentedFilesCount,
  useChartsStore,
  useMostCommentsLeft,
  useMostCommentsReceived,
  getDiscussions,
} from '../stores/ChartsStore';
import { Avatar } from '@mui/material';
import { Tile } from '../components/Tile/Tile';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CommentRoundedIcon from '@mui/icons-material/CommentRounded';
import ForumIcon from '@mui/icons-material/Forum';
import { BranchIcon } from '../icons/BranchIcon';
import { getLongestDiscussions, getLongestPullRequest } from '../utils/ChartUtils';
import { timeSince, timeSinceString } from '../utils/TimeSpanUtils';

export function CodeReviewTiles() {
  const pullRequests = useChartsStore((state) => state.pullRequests);
  const comments = useChartsStore(getComments);
  const discussions = useChartsStore(getDiscussions);

  const mostCommentedPRs = useMemo(() => {
    const sorted = pullRequests.toSorted((a, b) => b.comments.length - a.comments.length);
    return sorted[0];
  }, [pullRequests]);

  const { user: mostCommentsLeftUser, total: mostCommentsLeftTotal } = useMostCommentsLeft();
  const { user: mostCommentsReceivedUser, total: mostCommentsReceivedTotal } = useMostCommentsReceived();

  const commentedFilesCount = useCommentedFilesCount();

  const longestPullRequest = useMemo(() => getLongestPullRequest(pullRequests), [pullRequests]);
  const longestDiscussion = useMemo(() => getLongestDiscussions(pullRequests, 1)[0], [pullRequests]);

  const noDiscussionsPr = useMemo(() => {
    const noComments = pullRequests.filter((item) => item.discussions.length === 0);
    const percent = Math.ceil((noComments.length / pullRequests.length) * 100);

    return `${percent}%`;
  }, [pullRequests]);

  if (pullRequests == null || pullRequests.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" flexWrap={'wrap'}>
      <Tile count={comments.length} title="Comments" icon={<CommentRoundedIcon fontSize="large" sx={{ color: 'white' }} />} />
      <Tile count={discussions.length} title="Discussions" icon={<ForumIcon fontSize="large" sx={{ color: 'white' }} />} />
      <Tile count={pullRequests.length} title="Pull requests" icon={<BranchIcon />} />
      {mostCommentedPRs != null && (
        <Tile
          count={mostCommentedPRs.comments.length}
          title="Most comments for PR"
          details={
            <a href={mostCommentedPRs.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
              {mostCommentedPRs.title}
            </a>
          }
          icon={
            <Avatar
              alt={`${mostCommentedPRs.author.fullName}'s avatar`}
              sizes="40px"
              title={mostCommentedPRs.author.fullName}
              src={mostCommentedPRs.author.avatarUrl}
            />
          }
        />
      )}
      {mostCommentsLeftUser && (
        <Tile
          count={mostCommentsLeftTotal}
          title={`Most comments left by ${mostCommentsLeftUser.fullName}`}
          icon={
            <Avatar
              alt={`${mostCommentsLeftUser.fullName}'s avatar`}
              sizes="40px"
              title={mostCommentsLeftUser.fullName}
              src={mostCommentsLeftUser.avatarUrl}
            />
          }
        />
      )}
      {mostCommentsReceivedUser && (
        <Tile
          count={mostCommentsReceivedTotal}
          title={`Most comments received by ${mostCommentsReceivedUser.fullName}`}
          icon={
            <Avatar
              alt={`${mostCommentsReceivedUser.fullName}'s avatar`}
              sizes="40px"
              title={mostCommentsReceivedUser.fullName}
              src={mostCommentsReceivedUser.avatarUrl}
            />
          }
        />
      )}
      {longestPullRequest && (
        <Tile
          count={timeSinceString(timeSince(new Date(longestPullRequest.createdAt), new Date(longestPullRequest.mergedAt!)))}
          title="Longest pull request"
          details={
            <a href={longestPullRequest.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
              {longestPullRequest.title}
            </a>
          }
          icon={
            <Avatar
              alt={`${longestPullRequest.author.fullName}'s avatar`}
              sizes="40px"
              title={longestPullRequest.author.fullName}
              src={longestPullRequest.author.avatarUrl}
            />
          }
        />
      )}
      <Tile
        count={commentedFilesCount}
        title="Commented files"
        icon={<FileCopyIcon fontSize="large" sx={{ color: 'white' }} />}
      />
      <Tile
        count={longestDiscussion.comments.length}
        title="Longest Discussion"
        details={
          <a href={longestDiscussion.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
            {longestDiscussion.pullRequestName}
          </a>
        }
        icon={
          <Avatar
            alt={`${longestDiscussion.reviewerName}'s avatar`}
            sizes="40px"
            title={longestDiscussion.reviewerName}
            src={longestDiscussion.reviewerAvatarUrl}
          />
        }
      />
      <Tile count={noDiscussionsPr} title={'PRs merged without comments'} icon={<BranchIcon />} />
    </Stack>
  );
}
