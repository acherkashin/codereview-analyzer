export async function requestAllChunked<T>(arr: Array<() => Promise<T>>, chunkSize: number = 8) {
  let result: T[] = [];
  for (let i = 0, len = arr.length; i < len; i += chunkSize) {
    const promises = arr.slice(i, i + chunkSize).map((item) => item());
    const results = await Promise.all(promises);
    result.push(...results);
  }
  return result;
}

/**
 * Function makes sure error is never thrown.
 * Provided function will be either completed and data will be returned or @param defaultValue will be returned.
 * @param fn async function
 * @param attempts how many times function should be retried
 * @param wait time in ms to wait before retry
 * @param defaultValue value to return in case of error
 */
export async function successRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  wait: number = 1000,
  defaultValue: T | null = null
): Promise<T | null> {
  let count = 0;
  while (count++ < attempts) {
    try {
      const result = await fn();
      return result;
    } catch (e) {
      if (count === attempts) {
        return defaultValue;
      }
      await delay(wait); // Wait before retrying
    }
  }
  throw new Error('All retry attempts failed'); // This line should never be reached
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
