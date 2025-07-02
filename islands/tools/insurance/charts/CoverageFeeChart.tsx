// islands/insurance/charts/CoverageFeeChart.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import { JSX } from "preact";
import { COVERAGE_FEE_DATA } from "../../../../utils/tools/score_utils.ts";

Chart.register(...registerables);

interface CoverageFeeChartProps {
  highlightCoverage?: number | null; // e.g., 25, 50, 75, 100
}

export default function CoverageFeeChart(
  { highlightCoverage }: CoverageFeeChartProps,
): JSX.Element {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart instance before creating a new one
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const labels = COVERAGE_FEE_DATA.map((d) => d.label);
      const fees = COVERAGE_FEE_DATA.map((d) => d.fee);

      const backgroundColors: string[] = [];
      const borderColors: string[] = [];
      const borderWidths: number[] = [];

      COVERAGE_FEE_DATA.forEach((d) => {
        const defaultBgColor = "rgba(75, 192, 192, 0.6)"; // Default bar background
        const defaultBorderColor = "rgba(75, 192, 192, 1)"; // Default bar border (opaque)
        const highlightBorderColor = "rgb(255, 255, 255)"; // Prominent white border for highlight
        const highlightBorderWidth = 3;
        const defaultBorderWidth = 1;

        backgroundColors.push(defaultBgColor);

        // --- THE CRITICAL CHANGE HERE: Use d.coverageValue directly ---
        if (
          highlightCoverage !== null && highlightCoverage !== undefined &&
          d.coverageValue === highlightCoverage // Directly compare coverageValue
        ) {
          borderColors.push(highlightBorderColor);
          borderWidths.push(highlightBorderWidth);
        } else {
          borderColors.push(defaultBorderColor);
          borderWidths.push(defaultBorderWidth);
        }
      });

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [{
              label: "Coverage Fee",
              data: fees,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: borderWidths,
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

    // Add highlightCoverage to useEffect dependencies so chart re-renders if selection changes
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [highlightCoverage]); // Dependency on highlightCoverage

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
