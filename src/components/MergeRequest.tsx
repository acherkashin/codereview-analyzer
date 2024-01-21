import { MergeRequestForPage } from '../clients/types';
import { timeSince, timeSinceString } from '../utils/TimeSpanUtils';
import { UserItem, UserItemProps, UserList } from './UserList';

export interface MergeRequestProps extends MergeRequestForPage {}

export function MergeRequest({ item: mergeRequest, readyPeriod, readyTime }: MergeRequestProps) {
  const users = mergeRequest.reviewers?.map(
    (item) =>
      ({
        name: item.userName,
        avatarUrl: item.avatarUrl,
        userUrl: item.webUrl,
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
        <a href={mergeRequest.url} target="_blank" rel="noreferrer">
          {mergeRequest.title}
        </a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Target Branch</div>
        <div>{mergeRequest.targetBranch}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>In Review</div>
        {/* <div>{timeSinceString(readyPeriod)}</div> */}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Last Update</div>
        <div>{timeSinceString(timeSince(new Date(mergeRequest.updatedAt)))}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Author</div>
        <UserItem
          component="div"
          name={mergeRequest.author.userName}
          avatarUrl={mergeRequest.author.avatarUrl}
          userUrl={mergeRequest.author.webUrl}
        />
      </div>

      <UserList users={users} />
    </li>
  );
}
