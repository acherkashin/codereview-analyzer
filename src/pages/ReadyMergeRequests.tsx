import { Box } from '@mui/material';
import { useCallback, useEffect } from 'react';
import { getReadyMergeRequestsForPage } from '../utils/GitLabUtils';
import { MergeRequest } from '../components/MergeRequest';
import { useRequest } from '../hooks';
import { FullSizeProgress } from '../components';
import { useClient } from '../stores/AuthStore';

export interface ReadyMergeRequestsProps {}

export function ReadyMergeRequests({}: ReadyMergeRequestsProps) {
  const client = useClient();
  const requestMergeRequests = useCallback(() => getReadyMergeRequestsForPage(client, 39), [client]);
  const { makeRequest, response: mrs, isLoading } = useRequest(requestMergeRequests);

  useEffect(() => {
    makeRequest();
  }, [client, makeRequest]);

  if (isLoading) {
    return <FullSizeProgress />;
  }

  return (
    <Box>
      <div style={{ display: 'flex', flexDirection: 'column', width: 800, margin: '0 auto' }}>
        {mrs && (
          <>
            <div>Merge Requests: {mrs.length}</div>
            <ul>
              {mrs.map((item) => (
                <MergeRequest key={item.item.mergeRequest.id} {...item} />
              ))}
            </ul>
          </>
        )}
      </div>
    </Box>
  );
}
