export function shortenText(text: string, maxLength: number): string {
  // Unicode for ellipsis character
  return (text ?? '').length > maxLength ? text.substring(0, maxLength) + '\u2026' : text;
}

export function percentString(value: number, total: number): string {
  if (!total) {
    return `0%`;
  }

  return `${Math.round(((value ?? 0) / total) * 100)}%`;
}
