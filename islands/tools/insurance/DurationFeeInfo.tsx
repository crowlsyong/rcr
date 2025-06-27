// islands/insurance/DurationFeeInfo.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { JSX } from "preact";

// Register all Chart.js components needed
Chart.register(...registerables);

// Fee calculation function (remains the same)
const calculateFeeFromDays = (days: number): number => {
  const a = 0.0000207; // scaling constant
  const b = 1.5; // exponent
  const fee = Math.min(a * Math.pow(days, b), 0.75); // cap at 75%
  return parseFloat(fee.toFixed(4));
};

export default function DurationFeeInfo(): JSX.Element {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Define specific points and their labels for "exponential" view
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

      const labels: number[] = [];
      const data: number[] = [];

      // Generate more data points for a smoother curve
      // Let's go up to 5 years (365 * 5 days)
      const maxDays = 365 * 5;
      // Increment by a smaller amount, e.g., every 5 days for the first year, then larger increments
      for (let d = 1; d <= maxDays; d += 5) { // Increased density of points
        labels.push(d); // This will be the underlying numerical x-axis for plotting
        data.push(calculateFeeFromDays(d));
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            // Chart.js can handle numerical labels on the x-axis and
            // we will use the `ticks.callback` to format them into custom strings.
            // This allows the actual plot to be continuous with many points,
            // while the visible labels are sparse.
            labels: labels,
            datasets: [{
              label: "Loan Fee",
              data: data,
              borderColor: "lime",
              backgroundColor: "rgba(0,255,0,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 0, // Hide actual points
              pointHoverRadius: 8, // Make hover point bigger (but not visible)
              pointHitRadius: 15, // Significantly increase hit area
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false, // Allows flexible sizing
            scales: {
              x: {
                type: "linear", // Keep as linear for precise plotting of all data points
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
                  // Use custom labels only at specific intervals
                  callback: function (val) {
                    const days = val as number;
                    // Find the closest predefined label for this tick value
                    for (let i = 0; i < daysPointsForLabels.length; i++) {
                      if (days === daysPointsForLabels[i]) {
                        return customLabels[i];
                      }
                    }
                    // For other ticks, don't display a label
                    return "";
                  },
                  autoSkip: false, // Prevent Chart.js from automatically skipping labels
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
                max: 0.8, // Maximum value for the scale, still a decimal
                grid: {
                  color: "#374151",
                },
                ticks: {
                  color: "#e2e8f0",
                  // Format Y-axis ticks as percentages
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
                },
              },
              tooltip: {
                mode: "index", // Show all tooltips for points at same X location
                intersect: false, // Show tooltip even if not directly on a point, using pointHitRadius
                callbacks: {
                  // Format tooltip Y-value as percentage
                  label: function (context) {
                    const label = context.dataset.label || "";
                    if (context.parsed.y !== null) {
                      return `${label}: ${
                        (context.parsed.y * 100).toFixed(2)
                      }%`;
                    }
                    return label;
                  },
                  // Show corresponding days in the tooltip title
                  title: function (context) {
                    const days = context[0].label;
                    return `Duration: ${days} days`;
                  },
                },
              },
            },
          },
        });
        setIsChartReady(true);
      }
    }

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount

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
