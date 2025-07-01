// islands/tools/chart/CreditScoreChart.tsx
import { useEffect, useRef } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import "npm:chartjs-adapter-date-fns";
import type { Chart as ChartJsType, TooltipItem } from "chart.js";
import { OverrideEvent } from "../../../routes/api/v0/credit-score/index.ts";

Chart.register(...registerables);

// Re-defining for clarity in this file as well
export interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

interface InfractionBarDataPoint {
  x: number; // Timestamp
  y: number; // Credit Score (height of the bar)
  eventDetails: OverrideEvent; // The attached event details
}

interface CreditScoreChartProps {
  username: string;
  historicalData: CreditScoreDataPoint[];
  selectedTimeRange: string;
  isLoading: boolean;
  error: string | null;
  overrideEvents: OverrideEvent[];
  chartHeight?: string; // Optional prop for custom height
}

type ChartTimeUnit =
  | "millisecond"
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

function getOptimalTickConfiguration(
  dataLength: number,
  timeRange: string,
): { unit: ChartTimeUnit; maxTicksLimit: number } {
  if (timeRange === "7D") return { unit: "day", maxTicksLimit: 7 };
  if (timeRange === "30D") return { unit: "day", maxTicksLimit: 8 };
  if (timeRange === "90D") return { unit: "week", maxTicksLimit: 10 };
  if (timeRange === "6M") return { unit: "month", maxTicksLimit: 12 };
  return { unit: "month", maxTicksLimit: Math.min(dataLength, 15) };
}

export default function CreditScoreChart({
  username,
  historicalData,
  selectedTimeRange,
  isLoading,
  error,
  overrideEvents,
  chartHeight = "300px", // Default height
}: CreditScoreChartProps) {
  const chartInstanceRef = useRef<ChartJsType | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only proceed if there's data to display or if not loading/error
    if (
      historicalData.length === 0 && overrideEvents.length === 0 || isLoading ||
      error
    ) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const currentCanvas = canvasRef.current;
    if (!currentCanvas) {
      console.warn(
        "Chart: Canvas element is not available in DOM yet. Will retry on next render.",
      );
      return;
    }

    const ctx = currentCanvas.getContext("2d");
    if (!ctx) {
      console.error("Chart: Failed to get 2D context for chart canvas.");
      return;
    }

    // Destroy existing chart instance before creating a new one
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chartDataPoints = historicalData.map((dp) => ({
      x: dp.timestamp,
      y: dp.creditScore,
    }));

    // Data for infraction bars
    const infractionBarData: InfractionBarDataPoint[] = overrideEvents.map(
      (event) => {
        let closestScore = 0;
        let minDiff = Infinity;
        historicalData.forEach((dp) => {
          const diff = Math.abs(dp.timestamp - event.dateOfInfraction);
          if (diff < minDiff) {
            minDiff = diff;
            closestScore = dp.creditScore;
          }
        });
        return {
          x: event.dateOfInfraction,
          y: closestScore === 0 ? 1 : closestScore, // Ensure y is not 0 for bar visibility
          eventDetails: event,
        };
      },
    );

    const tickConfig = getOptimalTickConfiguration(
      historicalData.length,
      selectedTimeRange,
    );

    chartInstanceRef.current = new Chart(ctx, {
      type: "line", // Default type, datasets define their own types
      data: {
        labels: [], // Labels handled by 'time' scale type
        datasets: [{
          type: "line",
          label: "Credit Score",
          data: chartDataPoints,
          fill: true,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgb(75, 192, 192)",
          tension: 0.4,
          pointHitRadius: 20,
          pointRadius: historicalData.length > 50 ? 2 : 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "rgb(75, 192, 192)",
          pointBorderColor: "#fff",
          order: 1, // Line should be drawn first
        }, {
          type: "bar",
          label: "Infraction",
          data: infractionBarData,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 0.8)",
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          minBarLength: 5,
          order: 2, // Bars should be drawn over the line
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
            labels: { color: "#f0f0f0" },
          },
          title: {
            display: false,
            text: "Credit Score History",
            color: "#f0f0f0",
          },
          tooltip: { // Reverted to standard tooltip with callback for bar info
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#ccc",
            borderColor: "rgba(75, 192, 192, 0.8)",
            borderWidth: 1,
            caretPadding: 10,
            displayColors: false,
            callbacks: {
              title: function (context: TooltipItem<"line" | "bar">[]) {
                const timestamp = context[0].parsed.x as number;
                return new Date(timestamp).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              },
              label: function (context: TooltipItem<"line" | "bar">) {
                if (context.dataset.type === "bar") {
                  const rawData = context.raw as InfractionBarDataPoint;
                  if (rawData && rawData.eventDetails) {
                    return [
                      `Override: ${rawData.eventDetails.description}`,
                      `Modifier: ${
                        rawData.eventDetails.modifier > 0 ? "+" : ""
                      }${rawData.eventDetails.modifier}`,
                      `URL: ${rawData.eventDetails.url}`, // Keep URL in tooltip for info
                    ];
                  }
                  return "Infraction event";
                } else {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  label += Math.round(context.parsed.y as number);
                  return label;
                }
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: selectedTimeRange === "7D"
                ? "day"
                : (selectedTimeRange === "30D"
                  ? "day"
                  : (selectedTimeRange === "90D" || selectedTimeRange === "6M"
                    ? "week"
                    : "month")),
              tooltipFormat: "MMM d, yyyy",
              displayFormats: {
                day: "MMM d",
                week: "MMM d",
                month: "MMM yyyy",
                year: "yyyy",
              },
            },
            title: {
              display: false,
              text: "Date",
              color: "#ccc",
              font: { size: 12 },
            },
            ticks: {
              color: "#ccc",
              font: { size: 10 },
              maxTicksLimit: tickConfig.maxTicksLimit,
              autoSkip: true,
              autoSkipPadding: 10,
            },
            grid: {
              color: "#444",
            },
            border: { display: false },
          },
          y: {
            title: {
              display: false,
              text: "Credit Score",
              color: "#ccc",
              font: { size: 12 },
            },
            beginAtZero: false,
            min: 0,
            max: 1000,
            ticks: {
              color: "#ccc",
              font: { size: 10 },
            },
            grid: {
              color: "#444",
            },
            border: { display: false },
          },
        },
        layout: {
          padding: {
            left: 0,
            right: 10,
            top: 10,
            bottom: 0,
          },
        },
      },
      plugins: [],
    });

    // --- NEW: Add Click Event Listener for bars ---
    const handleClick = (event: MouseEvent) => {
      if (!chartInstanceRef.current) return;

      const elements = chartInstanceRef.current.getElementsAtEventForMode(
        event,
        "nearest",
        { intersect: true },
        true,
      );

      const clickedBar = elements.find((el) =>
        chartInstanceRef.current?.data.datasets[el.datasetIndex].type === "bar"
      );

      if (clickedBar) {
        const datasetIndex = clickedBar.datasetIndex;
        const dataIndex = clickedBar.index;
        const rawDataPoint = chartInstanceRef.current.data
          .datasets[datasetIndex].data[dataIndex] as InfractionBarDataPoint;

        if (
          rawDataPoint && rawDataPoint.eventDetails &&
          rawDataPoint.eventDetails.url
        ) {
          globalThis.open(rawDataPoint.eventDetails.url, "_blank"); // Open URL in a new tab
        }
      }
    };

    currentCanvas.addEventListener("click", handleClick);

    return () => {
      // Cleanup: Remove event listener and destroy chart
      currentCanvas.removeEventListener("click", handleClick);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [
    historicalData,
    selectedTimeRange,
    isLoading,
    error,
    username,
    overrideEvents,
    chartHeight,
  ]); // chartHeight added to deps

  const canvasId = `creditScoreChart-${username}`;

  if (isLoading) {
    return (
      <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner border border-gray-700">
        <h2 class="text-xl font-semibold mb-4 text-gray-100">Score History</h2>
        <p class="text-center text-gray-400 py-8">Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
        <h2 class="text-xl font-semibold mb-4 text-gray-100">Score History</h2>
        <p class="text-center text-red-500 py-8">{error}</p>
      </div>
    );
  }

  return (
    <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner border border-gray-700">
      <h2 class="text-xl font-semibold mb-4 text-gray-100">Score History</h2>
      {historicalData.length === 0 && overrideEvents.length === 0 // Check if either data or overrides exist
        ? (
          <p class="text-gray-400 text-sm text-center py-4">
            No historical data available yet.
          </p>
        )
        : (
          <div
            style={{ position: "relative", width: "100%", height: chartHeight }}
          >
            <canvas ref={canvasRef} id={canvasId}></canvas>
          </div>
        )}
    </div>
  );
}
