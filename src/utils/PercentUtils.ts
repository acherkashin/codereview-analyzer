export function toPercentString(value: number, total: number): string {
  if (!total) {
    return `0%`;
  }

  return `${Math.round(((value ?? 0) / total) * 100)}%`;
}

export function toPercent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round(((value ?? 0) / total) * 100);
}
