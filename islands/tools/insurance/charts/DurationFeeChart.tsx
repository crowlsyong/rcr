// islands/insurance/charts/DurationFeeChart.tsx
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

export default function DurationFeeChart(): JSX.Element {
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

      const maxDays = 365 * 5;
      for (let d = 1; d <= maxDays; d += 5) {
        labels.push(d);
        data.push(calculateFeeFromDays(d));
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [{
              label: "Loan Fee",
              data: data,
              borderColor: "lime",
              backgroundColor: "rgba(0,255,0,0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 8,
              pointHitRadius: 15,
            }],
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
                },
              },
              tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || "";
                    if (context.parsed.y !== null) {
                      return `${label}: ${
                        (context.parsed.y * 100).toFixed(2)
                      }%`;
                    }
                    return label;
                  },
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

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

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
