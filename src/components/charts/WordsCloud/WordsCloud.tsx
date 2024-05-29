import { memo, useMemo } from 'react';
import { ResponsiveWrapper } from '@nivo/core';
import { Comment } from '../../../services/types';
import { extractWords } from './WordsCloudUtils';
import { ChartContainer } from '../../ChartContainer';
import ReactWordcloud from 'react-wordcloud';
import { Stack } from '@mui/material';

export interface WordsCloudProps {
  comments: Comment[];
  onClick: (word: string) => void;
}

function _WordsCloud({ comments, onClick }: WordsCloudProps) {
  const data = useMemo(() => {
    const text = comments.map((item) => item.body).join(' ');
    const words = extractWords(text);

    const result = Array.from(words)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value);

    return result;
  }, [comments]);

  return (
    <ChartContainer
      title="Tags cloud created from most popular words in comments"
      style={{ padding: 8, overflow: 'hidden' }}
      description={
        <Stack gap={1}>
          <div>Displays the most popular words that appear in comments to pull requests.</div>
          <div>Click on the specific word to see list of comments that contain it.</div>
        </Stack>
      }
    >
      <ResponsiveWrapper>
        {({ width, height }) => (
          <ReactWordcloud
            size={[width, height]}
            words={data}
            maxWords={350}
            options={{ fontSizes: [10, 120] }}
            callbacks={{
              onWordClick: (e) => {
                onClick(e.text);
              },
            }}
          />
        )}
      </ResponsiveWrapper>
    </ChartContainer>
  );
}

export const WordsCloud = memo(_WordsCloud);
