import { Avatar } from '@mui/material';
import { PullRequest } from '../../services/types';
import { timeSince, timeSinceString } from '../../utils/TimeSpanUtils';
import { Tile } from './Tile';

export interface LongestPullRequestTileProps {
  pullRequest: PullRequest;
}

export function LongestPullRequestTile({ pullRequest }: LongestPullRequestTileProps) {
  return (
    <Tile
      count={timeSinceString(timeSince(new Date(pullRequest.createdAt), new Date(pullRequest.mergedAt!)))}
      title="Longest pull request"
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
