import { MergeRequestForPage } from './../utils/GitLabUtils';

export interface MergeRequestProps extends MergeRequestForPage {}

export function MergeRequest({ item, readyPeriod, readyTime }: MergeRequestProps) {
  return (
    <li key={item.mergeRequest.id}>
      <div>
        <a href={item.mergeRequest.web_url} target="_blank" rel="noreferrer">
          {item.mergeRequest.title}
        </a>
      </div>
      <div>
        In Review - Days: {readyPeriod.days}, Hours: {readyPeriod.hours}
      </div>
      <div>Author: {item.mergeRequest.author.name}</div>
      <div>Reviewers: {item.mergeRequest.reviewers?.map((item) => item.name).join(', ')}</div>
    </li>
  );
}
