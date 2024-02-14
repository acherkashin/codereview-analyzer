import { useMemo } from 'react';
import { Comment } from '../../../clients/types';
import { extractWords } from './WordsCloudUtils';
import { ChartContainer } from '../../ChartContainer';
import ReactWordcloud from 'react-wordcloud';

export interface WordsCloudProps {
  comments: Comment[];
}

export function WordsCloud({ comments }: WordsCloudProps) {
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
      <ReactWordcloud size={[1000, 500]} words={data} maxWords={350} options={{ fontSizes: [10, 120] }} />
    </ChartContainer>
  );
}
