import { useMemo } from 'react';
import { Stack } from '@mui/material';
import { getComments, useChartsStore, useMostCommentsLeft, useMostCommentsReceived } from '../stores/ChartsStore';
import { Avatar } from '@mui/material';
import { Tile } from '../components/Tile/Tile';
import CommentRoundedIcon from '@mui/icons-material/CommentRounded';
import { BranchIcon } from '../icons/BranchIcon';

export function CodeReviewTiles() {
  const pullRequests = useChartsStore((state) => state.pullRequests);
  const comments = useChartsStore(getComments);

  const mostCommentedPRs = useMemo(() => {
    const sorted = pullRequests.toSorted((a, b) => b.comments.length - a.comments.length);
    return sorted.slice(0, 3);
  }, [pullRequests]);

  const { user: mostCommentsLeftUser, total: mostCommentsLeftTotal } = useMostCommentsLeft();
  const { user: mostCommentsReceivedUser, total: mostCommentsReceivedTotal } = useMostCommentsReceived();

  return (
    <Stack direction="row" flexWrap={'wrap'}>
      <Tile count={comments.length} title="Comments" icon={<CommentRoundedIcon fontSize="large" sx={{ color: 'white' }} />} />
      <Tile count={pullRequests.length} title="Pull requests" icon={<BranchIcon />} />
      {mostCommentedPRs[0] != null && (
        <Tile
          count={mostCommentedPRs[0].comments.length}
          title="Most comments for PR"
          details={
            <a href={mostCommentedPRs[0].url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
              {mostCommentedPRs[0].title}
            </a>
          }
          icon={
            <Avatar
              alt={`${mostCommentedPRs[0].author.fullName}'s avatar`}
              sizes="40px"
              title={mostCommentedPRs[0].author.fullName}
              src={mostCommentedPRs[0].author.avatarUrl}
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
    </Stack>
  );
}
