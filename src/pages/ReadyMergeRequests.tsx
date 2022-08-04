import { Resources } from '@gitbeaker/core';
import { Box } from '@mui/material';

export interface ReadyMergeRequestsProps {
  client: Resources.Gitlab;
}

export function ReadyMergeRequests({ client }: ReadyMergeRequestsProps) {
  return <Box style={{ display: 'flex' }}>Merge Requests</Box>;
}
