export function extractWords(text: string) {
  // TODO: need to write test to make sure "I'm" and "Don't" are treated as single word
  // \b\w+\b matches word boundaries and includes words consisting of letters and numbers
  const words = text.toLowerCase().match(/[\w'-]+/g);

  // Create an object to store unique words
  const uniqueWords = new Map<string, number>();

  if (words) {
    words.forEach((word) => {
      const value = uniqueWords.get(word);

      uniqueWords.set(word, (value ?? 0) + 1);
    });
  }

  // Extract the keys (unique words) from the uniqueWords object and return them as an array
  return uniqueWords;
}
