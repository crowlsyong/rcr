// utils/insurance_info.ts

// Data for Coverage Fee
export const coverageFeeData = [
  { label: "C₂₅ (25% covered)", fee: 0.02 },
  { label: "C₅₀ (50% covered)", fee: 0.05 },
  { label: "C₇₅ (75% covered)", fee: 0.08 },
  { label: "C₁₀₀ (100% covered)", fee: 0.12 },
];

// Data for Risk Fee (Credit Score to Multiplier)
// The fees are approximate percentages that convert to risk multipliers
export const riskFeeData = [
  { scoreRange: "900–1000", description: "Extremely Safe", fee: 0.02 }, // ~2%
  { scoreRange: "800–899", description: "Super Safe", fee: 0.03 }, // ~3%
  { scoreRange: "700–799", description: "Very Safe", fee: 0.05 }, // ~5%
  { scoreRange: "600–699", description: "Safe", fee: 0.07 }, // ~7%
  { scoreRange: "500–599", description: "Moderately Safe", fee: 0.10 }, // ~10%
  { scoreRange: "400–499", description: "A Bit Risky", fee: 0.14 }, // ~14%
  { scoreRange: "300–399", description: "Risky", fee: 0.25 }, // ~25%
  { scoreRange: "200–299", description: "Highly Risky", fee: 0.60 }, // ~60%
  { scoreRange: "100–199", description: "Extremely Risky", fee: 1.00 }, // ~100%
  { scoreRange: "0–99", description: "Outrageously Dangerous", fee: 1.60 }, // ~160%
];
