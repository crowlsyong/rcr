// islands/insurance/charts/CoverageFeeChart.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { JSX } from "preact";
import { COVERAGE_FEE_DATA } from "../../../../utils/score_utils.ts"; // Corrected import path

Chart.register(...registerables);

export default function CoverageFeeChart(): JSX.Element {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const labels = COVERAGE_FEE_DATA.map((d) => d.label);
      const fees = COVERAGE_FEE_DATA.map((d) => d.fee);

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [{
              label: "Coverage Fee",
              data: fees,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
              barPercentage: 0.8,
              categoryPercentage: 0.8,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Coverage Type",
                  color: "#e2e8f0",
                },
                grid: {
                  color: "#374151",
                },
                ticks: {
                  color: "#e2e8f0",
                  font: {
                    size: 10,
                  },
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Fee Percentage",
                  color: "#e2e8f0",
                },
                max: 0.15,
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
    <div class="p-4 bg-gray-900 border border-gray-700 rounded-md shadow-lg text-left">
      <h3 class="text-white text-lg font-bold mb-3 text-center">
        Coverage Fee Structure
      </h3>
      <div class="w-full" style="height: 250px;">
        <canvas ref={chartRef}></canvas>
      </div>
      {!isChartReady && (
        <p class="text-gray-400 text-sm text-center mt-2">Loading chart...</p>
      )}
    </div>
  );
}
