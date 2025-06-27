// islands/insurance/charts/RiskFeeChart.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { JSX } from "preact";
import { RISK_LEVEL_DATA } from "../../../../utils/score_utils.ts"; // Corrected import path

Chart.register(...registerables);

export default function RiskFeeChart(): JSX.Element {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // We might want to sort this differently for the chart
      const chartData = [...RISK_LEVEL_DATA].sort((a, b) =>
        a.scoreMin - b.scoreMin
      );

      const labels = chartData.map((d) => `${d.scoreMin}–${d.scoreMax}`);
      const fees = chartData.map((d) => d.feeMultiplier);

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [{
              label: "Risk Fee",
              data: fees,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            }],
          },
          options: {
            indexAxis: "y", // Make it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Fee Percentage",
                  color: "#e2e8f0",
                },
                max: 1.7,
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
              y: {
                title: {
                  display: true,
                  text: "Credit Score Range",
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
            },
            plugins: {
              legend: {
                labels: {
                  color: "#e2e8f0",
                },
              },
              tooltip: {
                callbacks: {
                  title: function (context) {
                    const dataPoint = chartData[context[0].dataIndex];
                    return `Score: ${dataPoint.scoreMin}–${dataPoint.scoreMax} (${dataPoint.description})`;
                  },
                  label: function (context) {
                    const label = context.dataset.label || "";
                    if (context.parsed.x !== null) {
                      return `${label}: ${
                        (context.parsed.x * 100).toFixed(2)
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
        Risk Fee Structure (Based on Credit Score)
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
