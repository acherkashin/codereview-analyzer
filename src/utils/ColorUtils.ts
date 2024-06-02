import { OrdinalColorScaleConfigCustomFunction } from '@nivo/colors';

export const chartColor: OrdinalColorScaleConfigCustomFunction<any> = (datum) => {
  return stringToColor(datum.id.toString());
};

export function stringToColor(input: string): string {
  // Generate hue based on string hash
  const hue = ((hashCode(input) % 360) + 360) % 360;

  // Use varying saturation and lightness for more diverse colors
  const saturation = 60 + Math.abs(hashCode(input + 'sat') % 40);
  const lightness = 40 + Math.abs(hashCode(input + 'light') % 40);

  // Convert HSL to CSS HSL color representation
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
