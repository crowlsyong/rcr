// islands/insurance/charts/DurationFeeChart.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { JSX } from "preact";
import type { TooltipItem } from "chart.js";

// Register all Chart.js components needed
Chart.register(...registerables);

// Fee calculation function (ADJUSTED to hit 50% cap around 3 years)
const calculateFeeFromDays = (days: number): number => {
  const a = 0.00001379; // FIXED: Changed 'a' constant for 50% cap at ~3 years
  const b = 1.5;
  const fee = Math.min(a * Math.pow(days, b), 0.50); // FIXED: Changed cap to 0.50 (50%)
  return parseFloat(fee.toFixed(4));
};

interface DurationFeeChartProps {
  highlightDays?: number;
}

export default function DurationFeeChart(
  { highlightDays }: DurationFeeChartProps,
): JSX.Element {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const maxDaysToDisplay = 365 * 5; // Display up to 5 years (1825 days)

      const desiredXTickValues: number[] = [];
      const interval = 365;
      for (let i = 0; i <= maxDaysToDisplay; i += interval) {
        desiredXTickValues.push(i);
      }
      if (!desiredXTickValues.includes(0)) desiredXTickValues.unshift(0);


      const mainChartData: Array<{ x: number; y: number }> = [];
      const labelsForAxis: number[] = [];

      for (let d = 0; d <= maxDaysToDisplay; d += 5) {
        labelsForAxis.push(d);
        mainChartData.push({ x: d, y: calculateFeeFromDays(d) });
      }

      const highlightPointData: Array<{ x: number; y: number }> = [];
      if (highlightDays !== undefined && highlightDays > 0) {
        const highlightFeeValue = calculateFeeFromDays(highlightDays);
        highlightPointData.push({ x: highlightDays, y: highlightFeeValue });
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: labelsForAxis,
            datasets: [
              {
                label: "Loan Fee",
                data: mainChartData,
                borderColor: "lime",
                backgroundColor: "rgba(0,255,0,0.1)",
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHitRadius: 15,
                order: 2,
              },
              {
                label: highlightDays !== undefined && highlightDays > 0
                  ? `Your Loan (${highlightDays} days)`
                  : "",
                data: highlightPointData,
                type: "scatter",
                backgroundColor: "white",
                borderColor: "white",
                pointRadius: 6,
                pointHoverRadius: 10,
                pointHitRadius: 20,
                showLine: false,
                order: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: "linear",
                title: {
                  display: true,
                  text: "Loan Duration (Days)",
                  color: "#e2e8f0",
                },
                min: 0,
                max: maxDaysToDisplay,
                grid: {
                  color: "#374151",
                },
                ticks: {
                  color: "#e2e8f0",
                  callback: function (val) {
                    const days = val as number;
                    if (desiredXTickValues.includes(days)) {
                      if (days === 0) return "0 Days";
                      if (days % 365 === 0) {
                        const years = days / 365;
                        return `${years} Year${years !== 1 ? "s" : ""}`;
                      }
                      return days.toString();
                    }
                    return "";
                  },
                  autoSkip: false,
                  maxRotation: 0,
                  minRotation: 0,
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Fee Percentage",
                  color: "#e2e8f0",
                },
                max: 0.55, // Adjusted max to accommodate new cap (0.50 + a little buffer)
                grid: {
                  color: "#374151",
                },
                ticks: {
                  color: "#e2e8f0",
                  callback: function (value) {
                    return `${(value as number * 100).toFixed(0)}%`;
                  },
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: "#e2e8f0",
                  filter: (legendItem) => legendItem.text !== "",
                },
              },
              tooltip: {
                mode: "nearest",
                intersect: false,
                callbacks: {
                  label: function (context: TooltipItem<"line" | "scatter">) {
                    const label = context.dataset.label || "";
                    if (context.parsed.y !== null) {
                      const rawX = context.parsed.x;
                      const rawY = context.parsed.y;
                      return `${label}: ${rawX} days (${
                        (rawY * 100).toFixed(2)
                      }%)`;
                    }
                    return label;
                  },
                  title: function (
                    context: TooltipItem<"line" | "scatter">[],
                  ): string | void {
                    if (context[0].dataset.type === "line") {
                      return `Duration Details`;
                    }
                    return undefined;
                  },
                },
              },
            },
          },
        });
        setIsChartReady(true);
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [highlightDays]);

  return (
    <div class="p-4 bg-gray-900 border border-gray-700 rounded-md shadow-lg">
      <h3 class="text-white text-lg font-bold mb-3 text-center">
        Loan Fee vs. Duration (Days) – Power Function
      </h3>
      <div class="w-full" style="height: 300px;">
        <canvas ref={chartRef}></canvas>
      </div>
      {!isChartReady && (
        <p class="text-gray-400 text-sm text-center mt-2">Loading chart...</p>
      )}
    </div>
  );
}
