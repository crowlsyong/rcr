// islands/insurance/charts/DurationFeeChart.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { JSX } from "preact";
import type { TooltipItem } from "chart.js";

// Register all Chart.js components needed
Chart.register(...registerables);

// Fee calculation function (ADJUSTED for flatline at ~3 years)
const calculateFeeFromDays = (days: number): number => {
  const a = 0.00001379; // Adjusted scaling constant to hit 50% around 3 years
  const b = 1.5; // Exponent remains the same
  const fee = Math.min(a * Math.pow(days, b), 0.50); // Cap at 50% (0.50)
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
      // Destroy existing chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // X-axis Tick Values: 0, 100, 200, ..., up to 1800 (approx 5 years) to show flatline
      const desiredXTickValues: number[] = [];
      for (let i = 0; i <= 365 * 5; i += 100) { // Go up to 5 years, every 100 days
        desiredXTickValues.push(i);
      }
      // Ensure 3 years (1095) is exactly on a tick if desired
      if (!desiredXTickValues.includes(365 * 3)) {
        desiredXTickValues.push(365 * 3);
        desiredXTickValues.sort((a, b) => a - b);
      }

      const maxDaysToDisplay = 365 * 5; // Display up to 5 years (1825 days)

      // Convert main data to {x, y} format for consistency with scatter
      const mainChartData: Array<{ x: number; y: number }> = [];
      const labelsForAxis: number[] = []; // Used for Chart.js labels property (numerical X-values)

      // Plot every 5 days for a smooth curve up to the max display.
      for (let d = 0; d <= maxDaysToDisplay; d += 5) {
        labelsForAxis.push(d); // X-axis numerical labels
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
                pointRadius: 0, // Hide points on the main line
                pointHoverRadius: 8,
                pointHitRadius: 15,
                order: 2, // Drawn below highlight dataset
              },
              // Highlight dataset
              {
                label: highlightDays !== undefined && highlightDays > 0
                  ? `Your Loan (${highlightDays} days)`
                  : "",
                data: highlightPointData, // This expects {x, y} objects
                type: "scatter",
                backgroundColor: "white", // Color of the highlight point
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
                  text: "Loan Duration (Days)", // Updated title
                  color: "#e2e8f0",
                },
                min: 0, // Set explicit min
                max: maxDaysToDisplay, // Set explicit max to display the flatline
                grid: {
                  color: "#374151",
                },
                ticks: {
                  color: "#e2e8f0",
                  // Custom callback to show only desired labels
                  callback: function (val) {
                    const days = val as number;
                    // Find if this day value is one of our desired tick values
                    if (desiredXTickValues.includes(days)) {
                      // Optionally, add labels like "1 Year", "3 Years" etc.
                      if (days === 365) return "1 Year";
                      if (days === 365 * 2) return "2 Years";
                      if (days === 365 * 3) return "3 Years";
                      if (days === 0) return "0 Days"; // Label 0 explicitly
                      return days.toString(); // For other 100, 200, etc.
                    }
                    return ""; // Hide other ticks
                  },
                  autoSkip: false, // Prevent Chart.js from auto-skipping our custom ticks
                  maxRotation: 0, // Keep labels horizontal
                  minRotation: 0,
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Fee Percentage",
                  color: "#e2e8f0",
                },
                max: 0.55,
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
