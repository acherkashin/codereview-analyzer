export function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  let chunks = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    let chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return chunks;
}

export function uniqueByProperty<T extends Record<string, any>>(array: T[], property: keyof T): T[] {
  const seen = new Set<any>();
  return array.filter((item) => {
    const value = item[property];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
