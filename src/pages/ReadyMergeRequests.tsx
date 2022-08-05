import { Resources } from '@gitbeaker/core';
import { Box } from '@mui/material';
import { useEffect } from 'react';
import { getReadyMergeRequests } from '../utils/GitLabUtils';

export interface ReadyMergeRequestsProps {
  client: Resources.Gitlab;
}

export function ReadyMergeRequests({ client }: ReadyMergeRequestsProps) {
  useEffect(() => {
    getReadyMergeRequests(client, 39);
  }, [client]);

  return <Box style={{ display: 'flex' }}>Merge Requests</Box>;
}
