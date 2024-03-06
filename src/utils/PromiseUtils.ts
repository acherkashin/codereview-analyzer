export async function requestAllChunked<T>(arr: Array<() => Promise<T>>, chunkSize: number = 10) {
  let result: T[] = [];
  for (let i = 0, len = arr.length; i < len; i += chunkSize) {
    const promises = arr.slice(i, i + chunkSize).map((item) => item());
    const results = await Promise.all(promises);
    result.push(...results);
  }
  return result;
}
