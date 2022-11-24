import { styled } from '@mui/material/styles';
import React, { Suspense } from 'react';

const MarkdownView = React.lazy(() => import('react-showdown'));

export interface MarkdownControlProps {
  markdown: string;
}

export function MarkdownControl({ markdown }: MarkdownControlProps) {
  return (
    <MarkdownWrapper>
      <Suspense fallback={<div>Loading...</div>}>
        <MarkdownView markdown={markdown} options={{ tables: true, emoji: true }} />
      </Suspense>
    </MarkdownWrapper>
  );
}

const MarkdownWrapper = styled('div')(() => ({
  '& p': {
    margin: 0,
  },
}));
