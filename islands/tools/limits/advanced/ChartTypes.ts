// islands/charts/ChartTypes.ts
/** Defines the available types of bet distributions. */
export enum DistributionType {
  Constant = "constant",
  Linear = "linear",
  LinearDecay = "linear-decay",
  Quadratic = "quadratic",
  QuadraticNegative = "quadratic-negative",
  Absolute = "absolute",
  AbsoluteNegative = "absolute-negative",
  Logistic = "logistic",
  NegativeLogistic = "negative-logistic",
  Exponential = "exponential",
  ExponentialInverse = "exponential-inverse", // New: Mirrored Exponential
  ExponentialNegative = "exponential-negative", // Current negative exponential
  ExponentialNegativeInverse = "exponential-negative-inverse", // New: Mirrored Negative Exponential
  SquareRoot = "square-root",
  SquareRootNegative = "square-root-negative",
  BellCurve = "bell-curve",
  NegativeBellCurve = "negative-bell-curve",
}

/** Interface for our custom vertical line plugin options (no longer directly used by BasicChart but kept for type definitions). */
export interface VerticalLinePluginOptions {
  markerProb?: number; // The probability at which to draw the line (e.g., 50 for 50%)
}
