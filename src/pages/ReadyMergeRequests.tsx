import { useCallback, useEffect } from 'react';
import { MergeRequest } from '../components/MergeRequest';
import { useRequest } from '../hooks';
import { FullSizeProgress } from '../components';
import { useClient } from '../stores/AuthStore';
import { PageContainer } from './PageContainer';
import { Client, MergeRequestForPage } from '../clients/types';
import { timeSince } from '../utils/TimeSpanUtils';

export interface ReadyMergeRequestsProps {}

export function ReadyMergeRequests(_: ReadyMergeRequestsProps) {
  const client = useClient();
  const requestMergeRequests = useCallback(() => getReadyMergeRequestsForPage(client, '39'), [client]);
  const { makeRequest, response: mrs, isLoading } = useRequest(requestMergeRequests);

  useEffect(() => {
    makeRequest();
  }, [client, makeRequest]);

  if (isLoading) {
    return <FullSizeProgress />;
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', width: 800, margin: '0 auto' }}>
        {mrs && (
          <>
            <div>Merge Requests: {mrs.length}</div>
            <ul>
              {mrs.map((item) => (
                <MergeRequest key={item.item.id} {...item} />
              ))}
            </ul>
          </>
        )}
      </div>
    </PageContainer>
  );
}

//TODO: rename somehow
export async function getReadyMergeRequestsForPage(client: Client, projectId: string): Promise<MergeRequestForPage[]> {
  const mrs = await client.getPullRequests({
    projectId,
    state: 'open',
    owner: '',
    pullRequestCount: Number.MAX_VALUE,
  });

  console.log(mrs);

  return mrs.map((item) => {
    return {
      item,
      // readyTime: getReadyTime(item),
      // readyPeriod: timeSince(new Date(getReadyTime(item))),
    };
  });
  // .sort((item1, item2) => item2.readyPeriod._milliseconds - item1.readyPeriod._milliseconds);
}

// function getReadyTime(mr: PullRequest) {
//   const readyNote = mr.notes.find((item) => item.body === 'marked this merge request as **ready**');
//   return readyNote?.created_at ?? mr.mergeRequest.created_at;
// }
