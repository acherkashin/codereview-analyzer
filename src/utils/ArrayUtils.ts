export function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  let chunks = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    let chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return chunks;
}
