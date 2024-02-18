import { PullRequest } from '../clients/types';
import { timeSince, timeSinceString } from '../utils/TimeSpanUtils';
import { UserItem, UserItemProps, UserList } from './UserList';

export interface MergeRequestProps {
  pullRequest: PullRequest;
}

export function MergeRequest({ pullRequest }: MergeRequestProps) {
  const users = pullRequest.requestedReviewers?.map(
    (item) =>
      ({
        name: item.userName,
        avatarUrl: item.avatarUrl,
        userUrl: item.webUrl,
      } as UserItemProps)
  );

  const readyPeriod = pullRequest.readyAt ? timeSince(new Date(pullRequest.readyAt)) : null;

  return (
    <li
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        marginBottom: 8,
        border: '1px solid gray',
        padding: 8,
      }}
      key={pullRequest.id}
    >
      <div style={{ marginBottom: 8 }}>
        <a href={pullRequest.url} target="_blank" rel="noreferrer">
          {pullRequest.title}
        </a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Target Branch</div>
        <div>{pullRequest.targetBranch}</div>
      </div>
      {readyPeriod && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
          <div style={{ fontWeight: 'bold' }}>In Review</div>
          <div>{timeSinceString(readyPeriod)}</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Last Update</div>
        <div>{timeSinceString(timeSince(new Date(pullRequest.updatedAt)))}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Author</div>
        <UserItem
          component="div"
          name={pullRequest.author.userName}
          avatarUrl={pullRequest.author.avatarUrl}
          userUrl={pullRequest.author.webUrl}
        />
      </div>

      <UserList users={users} />
    </li>
  );
}
