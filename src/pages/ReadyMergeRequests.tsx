import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { getReadyMergeRequestsForPage, MergeRequestForPage } from '../utils/GitLabUtils';
import { MergeRequest } from '../components/MergeRequest';
import { useContext } from 'react';
import { AppContext } from './AppContext';

export interface ReadyMergeRequestsProps {}

export function ReadyMergeRequests({}: ReadyMergeRequestsProps) {
  const [mrs, setMrs] = useState<MergeRequestForPage[]>([]);
  const { client } = useContext(AppContext);

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
