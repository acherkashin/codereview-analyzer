import { Avatar } from '@mui/material';
import { PullRequest } from '../../services/types';
import { Tile } from './Tile';

export interface MostCommentsPullRequestTileProps {
  pullRequest: PullRequest;
}

export function MostCommentsPullRequestTile({ pullRequest }: MostCommentsPullRequestTileProps) {
  return (
    <Tile
      count={pullRequest.comments.length}
      title="Most comments for PR"
      details={
        <a href={pullRequest.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
          {pullRequest.title}
        </a>
      }
      icon={
        <Avatar
          alt={`${pullRequest.author.fullName}'s avatar`}
          sizes="40px"
          title={pullRequest.author.fullName}
          src={pullRequest.author.avatarUrl}
        />
      }
    />
  );
}
