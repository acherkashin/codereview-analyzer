import { MergeRequestForPage } from '../utils/GitLabUtils';
import { timeSince, timeSinceString } from '../utils/TimeSpanUtils';
import { UserItem, UserItemProps, UserList } from './UserList';

export interface MergeRequestProps extends MergeRequestForPage {}

export function MergeRequest({ item: { mergeRequest }, readyPeriod, readyTime }: MergeRequestProps) {
  const users = mergeRequest.reviewers?.map(
    (item) =>
      ({
        name: item.name as any,
        avatarUrl: item.avatar_url as any,
        userUrl: item.web_url as any,
      } as UserItemProps)
  );

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
      key={mergeRequest.id}
    >
      <div style={{ marginBottom: 8 }}>
        <a href={mergeRequest.web_url} target="_blank" rel="noreferrer">
          {mergeRequest.title}
        </a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Target Branch</div>
        <div>{mergeRequest.target_branch}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>In Review</div>
        <div>{timeSinceString(readyPeriod)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Last Update</div>
        <div>{timeSinceString(timeSince(new Date(mergeRequest.updated_at)))}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Author</div>
        <UserItem
          component="div"
          name={mergeRequest.author.name as any}
          avatarUrl={mergeRequest.author.avatar_url as any}
          userUrl={mergeRequest.author.web_url as any}
        />
      </div>

      <UserList users={users} />
    </li>
  );
}
