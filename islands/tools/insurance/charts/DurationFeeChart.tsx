// islands/insurance/charts/DurationFeeChart.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart } from "chart.js";
import { JSX } from "preact";
// Import TooltipModel and TooltipItem types for better callback typing
import type { TooltipItem } from "chart.js";

// Fee calculation function (remains the same)
const calculateFeeFromDays = (days: number): number => {
  const a = 0.0000207; // scaling constant
  const b = 1.5; // exponent
  const fee = Math.min(a * Math.pow(days, b), 0.75); // cap at 75%
  return parseFloat(fee.toFixed(4));
};

interface DurationFeeChartProps {
  highlightDays?: number; // New prop: number of days to highlight
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

      const customLabels = [
        "1 Day",
        "1 Week",
        "1 Month",
        "3 Months",
        "6 Months",
        "1 Year",
        "2 Years",
        "3 Years",
        "4 Years",
        "5 Years",
      ];
      const daysPointsForLabels = [
        1, // 1 Day
        7, // 1 Week
        30, // ~1 Month
        90, // ~3 Months
        180, // ~6 Months
        365, // 1 Year
        365 * 2, // 2 Years
        365 * 3, // 3 Years
        365 * 4, // 4 Years
        365 * 5, // 5 Years
      ];

      // Convert main data to {x, y} format for consistency with scatter
      const mainChartData: Array<{ x: number; y: number }> = [];
      const labelsForAxis: number[] = []; // Only for axis ticks, not direct data

      const maxDays = 365 * 5;
      for (let d = 1; d <= maxDays; d += 5) {
        labelsForAxis.push(d); // X-axis labels
        mainChartData.push({ x: d, y: calculateFeeFromDays(d) });
      }

      // Prepare highlight data as a separate dataset
      const highlightPointData: Array<{ x: number; y: number }> = [];
      if (highlightDays !== undefined && highlightDays > 0) {
        const highlightFeeValue = calculateFeeFromDays(highlightDays);
        highlightPointData.push({ x: highlightDays, y: highlightFeeValue });
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line", // The base chart type
          data: {
            labels: labelsForAxis, // X-axis labels for ticks (linear scale still uses it)
            datasets: [
              {
                label: "Loan Fee",
                data: mainChartData, // Now using {x, y} objects
                borderColor: "lime",
                backgroundColor: "rgba(0,255,0,0.1)",
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHitRadius: 15,
                order: 2,
              },
              // Highlight dataset
              {
                label: highlightDays !== undefined && highlightDays > 0
                  ? `Your Loan (${highlightDays} days)`
                  : "",
                data: highlightPointData, // This expects {x, y} objects
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
                  text: "Loan Duration",
                  color: "#e2e8f0",
                },
                grid: {
                  color: "#374151",
                },
                ticks: {
                  color: "#e2e8f0",
                  callback: function (val) {
                    const days = val as number;
                    for (let i = 0; i < daysPointsForLabels.length; i++) {
                      if (days === daysPointsForLabels[i]) {
                        return customLabels[i];
                      }
                    }
                    return "";
                  },
                  autoSkip: false,
                  maxRotation: 45,
                  minRotation: 45,
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Fee Percentage",
                  color: "#e2e8f0",
                },
                max: 0.8,
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
                  // Label callback will vary based on dataset type
                  label: function (context: TooltipItem<"line" | "scatter">) {
                    const label = context.dataset.label || "";
                    if (context.parsed.y !== null) {
                      // For line chart or highlight scatter
                      const rawX = context.parsed.x;
                      const rawY = context.parsed.y;
                      return `${label}: ${rawX} days (${
                        (rawY * 100).toFixed(2)
                      }%)`;
                    }
                    return label;
                  },
                  // Title callback, explicitly return undefined for no title
                  title: function (
                    context: TooltipItem<"line" | "scatter">[],
                  ): string | void {
                    // Only show title for the main line data if we want one
                    if (context[0].dataset.type === "line") {
                      return `Duration Details`; // Or whatever static title you want
                    }
                    return undefined; // Return undefined for no title
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
