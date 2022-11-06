import { MergeRequestForPage } from '../utils/GitLabUtils';
import { UserItem, UserItemProps, UserList } from './UserList';

export interface MergeRequestProps extends MergeRequestForPage {}

export function MergeRequest({ item, readyPeriod: { days, hours }, readyTime }: MergeRequestProps) {
  const users = item.mergeRequest.reviewers?.map(
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
      key={item.mergeRequest.id}
    >
      <div style={{ marginBottom: 8 }}>
        <a href={item.mergeRequest.web_url} target="_blank" rel="noreferrer">
          {item.mergeRequest.title}
        </a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>In Review</div>
        <div>
          {days} {days === 1 ? 'day' : 'days'}, {hours} {hours === 1 ? 'hour' : 'hours'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>Author</div>
        <UserItem
          component="div"
          name={item.mergeRequest.author.name as any}
          avatarUrl={item.mergeRequest.author.avatar_url as any}
          userUrl={item.mergeRequest.author.web_url as any}
        />
      </div>

      <UserList users={users} />
    </li>
  );
}
