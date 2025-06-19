// islands/tools/limits/advanced/calculate-bet-data.ts
import { DistributionType } from "../ChartTypes.ts";

interface CalculateBetDataParams {
  betAmount: number;
  percentageInterval: number;
  distributionType: DistributionType;
  currentProbability: number;
  minDistributionPercentage: number;
  maxDistributionPercentage: number;
  centerShift: number;
}

export interface CalculatedPoint {
  percentage: number;
  amount: number;
}

interface CalculatedChartData {
  allXAxisLabels: string[];
  mainDatasetData: (number | null)[];
  finalPaddedMaxY: number;
  barIndex: number;
  calculatedPoints: CalculatedPoint[];
}

/**
 * Calculates the data points and chart properties for the bet distribution chart.
 */
export function calculateBetChartData(
  params: CalculateBetDataParams,
): CalculatedChartData {
  const {
    betAmount,
    percentageInterval,
    distributionType,
    currentProbability,
    minDistributionPercentage,
    maxDistributionPercentage,
    centerShift,
  } = params;

  const allXAxisLabels: string[] = [];
  const xAxisMin = 0;
  const xAxisMax = 100;

  for (let p = xAxisMin; p <= xAxisMax; p++) {
    allXAxisLabels.push(`${p}%`);
  }

  const numPoints = Math.max(2, percentageInterval);
  const calculationPoints: number[] = [];

  const effectiveRange = maxDistributionPercentage - minDistributionPercentage;

  if (numPoints === 1) {
    calculationPoints.push(
      Math.round(minDistributionPercentage + effectiveRange / 2),
    );
  } else {
    const step = effectiveRange / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      const point = minDistributionPercentage + i * step;
      calculationPoints.push(Math.round(point));
    }
  }

  const uniqueSortedPoints = [...new Set(calculationPoints)].sort((a, b) =>
    a - b
  );

  let sumOfBaseValues = 0;
  const baseValuesMap = new Map<number, number>();

  for (const percentage of uniqueSortedPoints) {
    let baseValue = 0;
    let effectiveX = percentage;
    let specificMidpoint = 50;

    switch (distributionType) {
      case DistributionType.Linear:
      case DistributionType.Quadratic:
      case DistributionType.Exponential:
      case DistributionType.ExponentialInverse:
      case DistributionType.ExponentialNegative:
      case DistributionType.ExponentialNegativeInverse:
      case DistributionType.SquareRoot:
      case DistributionType.LinearDecay:
      case DistributionType.QuadraticNegative:
      case DistributionType.SquareRootNegative:
        effectiveX = percentage - centerShift;
        break;
      case DistributionType.Absolute:
      case DistributionType.AbsoluteNegative:
      case DistributionType.Logistic:
      case DistributionType.NegativeLogistic:
      case DistributionType.BellCurve:
      case DistributionType.NegativeBellCurve:
        specificMidpoint = 50 + centerShift;
        break;
      case DistributionType.Constant:
        break;
    }

    const expScaleFactor = 0.05;
    let expInput = 0;

    switch (distributionType) {
      case DistributionType.Linear: {
        baseValue = effectiveX;
        break;
      }
      case DistributionType.LinearDecay: {
        baseValue = 100 - effectiveX;
        break;
      }
      case DistributionType.Constant: {
        baseValue = 1;
        break;
      }
      case DistributionType.Quadratic: {
        baseValue = effectiveX * effectiveX;
        break;
      }
      case DistributionType.QuadraticNegative: {
        baseValue = (100 - effectiveX) * (100 - effectiveX);
        break;
      }
      case DistributionType.Absolute: {
        baseValue = Math.abs(percentage - specificMidpoint);
        break;
      }
      case DistributionType.AbsoluteNegative: {
        baseValue = 50 - Math.abs(percentage - specificMidpoint);
        break;
      }
      case DistributionType.Logistic: {
        const kLogistic = 0.15;
        baseValue = 1 /
          (1 + Math.exp(-kLogistic * (percentage - specificMidpoint)));
        break;
      }
      case DistributionType.NegativeLogistic: {
        const kLogistic = 0.15;
        baseValue = 1 -
          (1 / (1 + Math.exp(-kLogistic * (percentage - specificMidpoint))));
        break;
      }
      case DistributionType.Exponential: {
        expInput = effectiveX - 1;
        baseValue = Math.exp(expInput * expScaleFactor);
        break;
      }
      case DistributionType.ExponentialInverse: {
        expInput = (100 - effectiveX) - 1;
        baseValue = Math.exp(expInput * expScaleFactor);
        break;
      }
      case DistributionType.ExponentialNegative: {
        expInput = effectiveX - 1;
        baseValue = 100 - Math.exp(expInput * expScaleFactor);
        break;
      }
      case DistributionType.ExponentialNegativeInverse: {
        expInput = (100 - effectiveX) - 1;
        baseValue = 100 - Math.exp(expInput * expScaleFactor);
        break;
      }
      case DistributionType.SquareRoot: {
        baseValue = Math.sqrt(Math.max(0, effectiveX));
        break;
      }
      case DistributionType.BellCurve: {
        const sigma = 15;
        const amplitude = 100;
        baseValue = amplitude *
          Math.exp(-Math.pow(percentage - specificMidpoint, 2) /
            (2 * Math.pow(sigma, 2)));
        break;
      }
      case DistributionType.NegativeBellCurve: {
        const sigma = 15;
        const amplitude = 100;
        const bellValue = amplitude *
          Math.exp(-Math.pow(percentage - specificMidpoint, 2) /
            (2 * Math.pow(sigma, 2)));
        baseValue = amplitude - bellValue;
        break;
      }
      case DistributionType.SquareRootNegative: {
        baseValue = Math.sqrt(Math.max(0, 100 - effectiveX));
        break;
      }
      default: {
        baseValue = percentage;
        break;
      }
    }
    const finalBaseValue = Math.max(0.01, baseValue);
    baseValuesMap.set(percentage, finalBaseValue);
    sumOfBaseValues += finalBaseValue;
  }

  let sumOfRoundedData = 0;
  const intermediateRoundedData: CalculatedPoint[] = [];

  if (sumOfBaseValues === 0) {
    const distributedPerPoint = betAmount > 0
      ? betAmount / uniqueSortedPoints.length
      : 0;
    for (const percentage of uniqueSortedPoints) {
      const roundedAmount = Math.round(distributedPerPoint);
      intermediateRoundedData.push({ percentage, amount: roundedAmount });
      sumOfRoundedData += roundedAmount;
    }
  } else {
    for (const percentage of uniqueSortedPoints) {
      const distributedAmount =
        (baseValuesMap.get(percentage)! / sumOfBaseValues) *
        betAmount;
      const roundedAmount = Math.round(distributedAmount);
      intermediateRoundedData.push({ percentage, amount: roundedAmount });
      sumOfRoundedData += roundedAmount;
    }
  }

  const remainder = betAmount - sumOfRoundedData;
  if (remainder !== 0) {
    const fractionalParts: { index: number; fraction: number }[] = [];
    for (let i = 0; i < intermediateRoundedData.length; i++) {
      const originalDistributed = (sumOfBaseValues === 0)
        ? (betAmount / uniqueSortedPoints.length)
        : ((baseValuesMap.get(intermediateRoundedData[i].percentage)! /
          sumOfBaseValues) * betAmount);
      const fraction = originalDistributed - Math.floor(originalDistributed);
      fractionalParts.push({ index: i, fraction: fraction });
    }

    if (remainder > 0) {
      fractionalParts.sort((a, b) => b.fraction - a.fraction);
    } else {
      fractionalParts.sort((a, b) => a.fraction - b.fraction);
    }

    for (let i = 0; i < Math.abs(remainder); i++) {
      let adjusted = false;
      for (let j = 0; j < fractionalParts.length; j++) {
        const partIndex = (i + j) % fractionalParts.length;
        const indexToAdjust = fractionalParts[partIndex].index;

        if (remainder > 0) {
          intermediateRoundedData[indexToAdjust].amount += 1;
          adjusted = true;
          break;
        } else {
          if (intermediateRoundedData[indexToAdjust].amount > 0) {
            intermediateRoundedData[indexToAdjust].amount -= 1;
            adjusted = true;
            break;
          }
        }
      }
      if (!adjusted) break;
    }
  }

  for (const item of intermediateRoundedData) {
    item.amount = Math.max(0, item.amount);
  }

  const mainDatasetData: (number | null)[] = new Array(
    allXAxisLabels.length,
  ).fill(null);

  for (const { percentage, amount } of intermediateRoundedData) {
    const labelString = `${percentage}%`;
    const xIndex = allXAxisLabels.indexOf(labelString);
    if (xIndex !== -1) {
      mainDatasetData[xIndex] = amount;
    }
  }

  const newMaxY = mainDatasetData.length > 0
    ? Math.max(...mainDatasetData.filter((val) => val !== null).map(Number), 0)
    : 0;
  const paddedMaxY = newMaxY > 0 ? Math.ceil((newMaxY * 1.1) / 100) * 100 : 100;
  const finalPaddedMaxY = Math.max(100, paddedMaxY);

  const barIndex = allXAxisLabels.findIndex((label) =>
    parseFloat(label) === currentProbability
  );

  return {
    allXAxisLabels,
    mainDatasetData,
    finalPaddedMaxY,
    barIndex,
    calculatedPoints: intermediateRoundedData.filter((p) => p.amount > 0),
  };
}
