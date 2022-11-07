import { Box, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { getReadyMergeRequestsForPage, MergeRequestForPage } from '../utils/GitLabUtils';
import { MergeRequest } from '../components/MergeRequest';
import { useContext } from 'react';
import { AppContext } from './AppContext';
import { useRequest } from '../hooks';
import { FullSizeProgress } from '../components';

export interface ReadyMergeRequestsProps {}

export function ReadyMergeRequests({}: ReadyMergeRequestsProps) {
  const { client } = useContext(AppContext);
  const requestMergeRequests = useCallback(() => getReadyMergeRequestsForPage(client, 39), []);
  const { makeRequest, response: mrs, isLoading } = useRequest(requestMergeRequests);

  useEffect(() => {
    makeRequest();
  }, [client]);

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
