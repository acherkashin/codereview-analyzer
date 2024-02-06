import { useMemo } from 'react';
import { Stack } from '@mui/material';
import {
  getComments,
  useChangedFilesCount,
  useChartsStore,
  useMostCommentsLeft,
  useMostCommentsReceived,
} from '../stores/ChartsStore';
import { Avatar } from '@mui/material';
import { Tile } from '../components/Tile/Tile';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CommentRoundedIcon from '@mui/icons-material/CommentRounded';
import { BranchIcon } from '../icons/BranchIcon';

export function CodeReviewTiles() {
  const pullRequests = useChartsStore((state) => state.pullRequests);
  const comments = useChartsStore(getComments);

  const mostCommentedPRs = useMemo(() => {
    const sorted = pullRequests.toSorted((a, b) => b.comments.length - a.comments.length);
    return sorted[0];
  }, [pullRequests]);

  const { user: mostCommentsLeftUser, total: mostCommentsLeftTotal } = useMostCommentsLeft();
  const { user: mostCommentsReceivedUser, total: mostCommentsReceivedTotal } = useMostCommentsReceived();

  const changedFilesCount = useChangedFilesCount();

  if (pullRequests == null || pullRequests.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" flexWrap={'wrap'}>
      <Tile count={comments.length} title="Comments" icon={<CommentRoundedIcon fontSize="large" sx={{ color: 'white' }} />} />
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
      <Tile count={changedFilesCount} title="Changed files" icon={<FileCopyIcon fontSize="large" sx={{ color: 'white' }} />} />
    </Stack>
  );
}
