import { Resources } from '@gitbeaker/core';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { getReadyMergeRequestsForPage, MergeRequestForPage } from '../utils/GitLabUtils';
import { MergeRequest } from '../components/MergeRequest';

export interface ReadyMergeRequestsProps {
  client: Resources.Gitlab;
}

export function ReadyMergeRequests({ client }: ReadyMergeRequestsProps) {
  const [mrs, setMrs] = useState<MergeRequestForPage[]>([]);

  useEffect(() => {
    getReadyMergeRequestsForPage(client, 39).then((result) => setMrs(result));
  }, [client]);

  return (
    <Box>
      <div style={{ display: 'flex', flexDirection: 'column', width: 800, margin: '0 auto' }}>
        <div>Merge Requests: {mrs.length}</div>
        <ul>
          {mrs.map((item) => (
            <MergeRequest {...item} />
          ))}
        </ul>
      </div>
    </Box>
  );
}
