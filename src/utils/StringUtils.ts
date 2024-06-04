export function shortenText(text: string, maxLength: number): string {
  // Unicode for ellipsis character
  return (text ?? '').length > maxLength ? text.substring(0, maxLength) + '\u2026' : text;
}
