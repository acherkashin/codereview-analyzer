import { Avatar } from '@mui/material';
import { UserDiscussion } from '../../services/types';
import { Tile } from './Tile';

export interface LongestDiscussionTileProps {
  discussion: UserDiscussion;
}

export function LongestDiscussionTile({ discussion }: LongestDiscussionTileProps) {
  return (
    <Tile
      count={discussion?.comments?.length ?? 0}
      title="Longest Discussion"
      details={
        discussion && (
          <a href={discussion.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
            {discussion.pullRequestName}
          </a>
        )
      }
      icon={
        discussion && (
          <Avatar
            alt={`${discussion.reviewerName}'s avatar`}
            sizes="40px"
            title={discussion.reviewerName}
            src={discussion.reviewerAvatarUrl}
          />
        )
      }
    />
  );
}
