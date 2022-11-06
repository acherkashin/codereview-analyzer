import { MergeRequestForPage } from '../utils/GitLabUtils';
import { UserItemProps, UserList } from './UserList';

export interface MergeRequestProps extends MergeRequestForPage {}

export function MergeRequest({ item, readyPeriod, readyTime }: MergeRequestProps) {
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
      <div>
        <a href={item.mergeRequest.web_url} target="_blank" rel="noreferrer">
          {item.mergeRequest.title}
        </a>
      </div>
      <div>
        In Review - Days: {readyPeriod.days}, Hours: {readyPeriod.hours}
      </div>
      <div>Author: {item.mergeRequest.author.name as any}</div>

      <UserList users={users} />
    </li>
  );
}
