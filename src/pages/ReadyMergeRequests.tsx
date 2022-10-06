import { Resources } from '@gitbeaker/core';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { getReadyMergeRequestsForPage, MergeRequestForPage } from '../utils/GitLabUtils';
import { MergeRequest } from './MergeRequest';

export interface ReadyMergeRequestsProps {
  client: Resources.Gitlab;
}

export function ReadyMergeRequests({ client }: ReadyMergeRequestsProps) {
  const [mrs, setMrs] = useState<MergeRequestForPage[]>([]);

  useEffect(() => {
    getReadyMergeRequestsForPage(client, 39).then((result) => setMrs(result));
  }, [client]);

  return (
    <Box style={{ display: 'flex' }}>
      Merge Requests: {mrs.length}
      <ul>
        {mrs.map((item) => (
          <MergeRequest {...item} />
        ))}
      </ul>
    </Box>
  );
}
