import { Avatar, Link } from '@mui/material';
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
          <Link href={discussion.url} target="_blank" rel="noopener noreferrer" underline="hover">
            {discussion.pullRequestName}
          </Link>
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
