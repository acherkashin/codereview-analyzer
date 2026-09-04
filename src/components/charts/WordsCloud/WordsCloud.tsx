import { memo, useMemo } from 'react';
import { ResponsiveWrapper } from '@nivo/core';
import { Comment } from '../../../services/types';
import { extractWords } from './WordsCloudUtils';
import { ChartContainer } from '../../ChartContainer';
import ReactWordcloud from 'react-wordcloud';
import { Stack, useTheme } from '@mui/material';

export interface WordsCloudProps {
  comments: Comment[];
  onClick: (word: string) => void;
}

function _WordsCloud({ comments, onClick }: WordsCloudProps) {
  const theme = useTheme();
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
        <Stack
          sx={{
            gap: 1,
          }}
        >
          <div>Displays the most popular words that appear in comments to pull requests.</div>
          <div>Click on the specific word to see list of comments that contain it.</div>
        </Stack>
      }
    >
      <ResponsiveWrapper>
        {({ width, height }) => {
          const compact = width < 480;

          return (
            <ReactWordcloud
              size={[width, height]}
              words={data}
              maxWords={compact ? 48 : 140}
              options={{
                colors: [
                  theme.palette.primary.main,
                  theme.palette.secondary.main,
                  theme.palette.info.main,
                  theme.palette.success.main,
                  theme.palette.warning.main,
                  theme.palette.text.primary,
                ],
                deterministic: true,
                enableOptimizations: data.length > 100,
                fontFamily: theme.typography.fontFamily,
                fontSizes: compact ? [12, 40] : [12, 72],
                padding: compact ? 2 : 3,
                rotationAngles: [0, 0],
                rotations: 1,
                transitionDuration: 0,
              }}
              callbacks={{
                onWordClick: (e) => {
                  onClick(e.text);
                },
              }}
            />
          );
        }}
      </ResponsiveWrapper>
    </ChartContainer>
  );
}

export const WordsCloud = memo(_WordsCloud);
