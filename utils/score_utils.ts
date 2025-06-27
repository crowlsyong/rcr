// utils/score_utils.ts

// Existing functions - DO NOT CHANGE OR RENAME
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
    const t = (score - 900) / 100;
    return lerpColor([54, 186, 63], [96, 225, 105], t);
  } else if (score >= 800) {
    const t = (score - 800) / 100;
    return lerpColor([100, 100, 255], [96, 225, 105], t);
  } else if (score >= 600) {
    const t = (score - 600) / 200;
    return lerpColor([50, 150, 200], [100, 100, 255], t);
  } else {
    const t = score / 600;
    return lerpColor([255, 100, 100], [180, 100, 255], t);
  }
}

// New Data and helper for Insurance Calculator - ADDED, NOT CHANGED EXISTING
export const COVERAGE_FEE_DATA = [
  { label: "C₂₅ (25% covered)", fee: 0.02, coverageValue: 25 }, // Added coverageValue
  { label: "C₅₀ (50% covered)", fee: 0.05, coverageValue: 50 }, // Added coverageValue
  { label: "C₇₅ (75% covered)", fee: 0.08, coverageValue: 75 }, // Added coverageValue
  { label: "C₁₀₀ (100% covered)", fee: 0.12, coverageValue: 100 }, // Added coverageValue
];

export const RISK_LEVEL_DATA = [
  {
    scoreMin: 900,
    scoreMax: 1000,
    description: "Extremely Safe",
    feeMultiplier: 0.02,
  },
  {
    scoreMin: 800,
    scoreMax: 899,
    description: "Super Safe",
    feeMultiplier: 0.03,
  },
  {
    scoreMin: 700,
    scoreMax: 799,
    description: "Very Safe",
    feeMultiplier: 0.05,
  },
  { scoreMin: 600, scoreMax: 699, description: "Safe", feeMultiplier: 0.07 },
  {
    scoreMin: 500,
    scoreMax: 599,
    description: "Moderately Safe",
    feeMultiplier: 0.10,
  },
  {
    scoreMin: 400,
    scoreMax: 499,
    description: "A Bit Risky",
    feeMultiplier: 0.14,
  },
  { scoreMin: 300, scoreMax: 399, description: "Risky", feeMultiplier: 0.25 },
  {
    scoreMin: 200,
    scoreMax: 299,
    description: "Highly Risky",
    feeMultiplier: 0.60,
  },
  {
    scoreMin: 100,
    scoreMax: 199,
    description: "Extremely Risky",
    feeMultiplier: 1.00,
  },
  {
    scoreMin: 0,
    scoreMax: 99,
    description: "Outrageously Dangerous",
    feeMultiplier: 1.60,
  },
];
