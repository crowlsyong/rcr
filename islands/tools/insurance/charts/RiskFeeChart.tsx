// islands/insurance/charts/RiskFeeChart.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { JSX } from "preact";
import {
  getScoreColor,
  RISK_LEVEL_DATA,
} from "../../../../utils/score_utils.ts";

Chart.register(...registerables);

interface RiskFeeChartProps {
  highlightScore?: number; // Optional prop for the score to highlight
}

export default function RiskFeeChart(
  { highlightScore }: RiskFeeChartProps,
): JSX.Element { // Destructure highlightScore prop
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const displayData = RISK_LEVEL_DATA;

      const labels = displayData.map((d) => `${d.scoreMin}–${d.scoreMax}`);
      const fees = displayData.map((d) => d.feeMultiplier);

      const backgroundColors: string[] = [];
      const borderColors: string[] = [];
      const borderWidths: number[] = [];

      displayData.forEach((d) => {
        const representativeScore = (d.scoreMin + d.scoreMax) / 2;
        const color = getScoreColor(representativeScore);

        backgroundColors.push(color);

        // Check if this range should be highlighted
        if (
          highlightScore !== undefined &&
          highlightScore >= d.scoreMin &&
          highlightScore <= d.scoreMax
        ) {
          borderColors.push("rgb(255, 255, 255)"); // White border
          borderWidths.push(3); // Thicker border
        } else {
          borderColors.push(color.replace("rgb", "rgba").replace(")", ", 1)")); // Default opaque border
          borderWidths.push(1); // Default border width
        }
      });

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [{
              label: "Risk Fee",
              data: fees,
              backgroundColor: backgroundColors, // Use generated colors
              borderColor: borderColors, // Use generated borders
              borderWidth: borderWidths, // Use generated widths
            }],
          },
          options: {
            indexAxis: "y", // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: "logarithmic",
                title: {
                  display: true,
                  text: "Fee Percentage",
                  color: "#e2e8f0",
                },
                min: 0.005,
                max: 2.0,
                ticks: {
                  color: "#e2e8f0",
                  font: { // Added font property for size
                    size: 9, // Smaller font size (e.g., 9 or 10)
                  },
                  callback: function (value) {
                    const percentage = value as number * 100;
                    if (percentage === 0.1) return "0.1%";
                    if (percentage === 1) return "1%";
                    if (percentage === 10) return "10%";
                    if (percentage === 50) return "50%";
                    if (percentage === 100) return "100%";
                    if (percentage === 200) return "200%";
                    return null;
                  },
                },
                grid: {
                  color: "#374151",
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
                    const dataPoint = displayData[context[0].dataIndex];
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
  }, [highlightScore]);

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
