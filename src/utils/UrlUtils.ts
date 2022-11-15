export function isValidHttpUrl(urlToTest: string) {
  let url;
  try {
    url = new URL(urlToTest);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}
