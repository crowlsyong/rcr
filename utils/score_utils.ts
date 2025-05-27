// score-utils.ts

// Color interpolation helper
export function lerpColor(
  color1: [number, number, number],
  color2: [number, number, number],
  t: number,
): string {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function getRiskLevelText(score: number): string {
  if (score < 100) return "Outrageously Dangerous";
  if (score < 200) return "Extremely Risky";
  if (score < 300) return "Highly Risky";
  if (score < 400) return "Risky";
  if (score < 500) return "A Bit Risky";
  if (score < 600) return "Moderately Safe";
  if (score < 700) return "Safe";
  if (score < 800) return "Very Safe";
  if (score < 900) return "Super Safe";
  return "Extremely Safe";
}

export function getScoreColor(score: number): string {
  if (score >= 900) {
    // For scores between 900 and 1000, interpolate from the softer green (54, 186, 63) to the full green (96, 225, 105)
    const t = (score - 900) / 100;
    return lerpColor([54, 186, 63], [96, 225, 105], t); // Softer green to full green
  } else if (score >= 800) {
    // For scores between 800 and 900, return the original blue-to-green transition
    const t = (score - 800) / 100;
    return lerpColor([100, 100, 255], [96, 225, 105], t); // Blue to green
  } else if (score >= 600) {
    // For scores between 600 and 799, return the light blue-to-blue transition
    const t = (score - 600) / 200;
    return lerpColor([50, 150, 200], [100, 100, 255], t); // Light blue to blue
  } else {
    // For scores below 600, return the red-to-purple transition
    const t = score / 600;
    return lerpColor([255, 100, 100], [180, 100, 255], t); // Red to purple
  }
}
