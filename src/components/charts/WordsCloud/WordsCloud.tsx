import { memo, useMemo } from 'react';
import { Comment } from '../../../clients/types';
import { extractWords } from './WordsCloudUtils';
import { ChartContainer } from '../../ChartContainer';
import ReactWordcloud from 'react-wordcloud';

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
    <ChartContainer title="Tags cloud created from most popular words in comments" style={{ padding: 8, overflow: 'hidden' }}>
      <ReactWordcloud
        size={[1000, 500]}
        words={data}
        maxWords={350}
        options={{ fontSizes: [10, 120] }}
        callbacks={{
          onWordClick: (e) => {
            onClick(e.text);
          },
        }}
      />
    </ChartContainer>
  );
}

export const WordsCloud = memo(_WordsCloud);
