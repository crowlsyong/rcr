// islands/chart/CreditScoreChart.tsx
import { useEffect } from "preact/hooks";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface HistoricalDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

interface CreditScoreChartProps {
  username: string;
  historicalData: HistoricalDataPoint[];
  selectedTimeRange: string;
  isLoading: boolean;
  error: string | null;
}

function getOptimalTickConfiguration(dataLength: number, timeRange: string) {
  // Calculate optimal number of ticks based on data length and time range
  if (timeRange === "7D") return { maxTicksLimit: 7, stepSize: undefined };
  if (timeRange === "30D") return { maxTicksLimit: 8, stepSize: undefined };
  if (timeRange === "90D") return { maxTicksLimit: 10, stepSize: undefined };
  if (timeRange === "6M") return { maxTicksLimit: 12, stepSize: undefined };

  // For "ALL" time, be more aggressive about limiting ticks
  if (dataLength > 100) return { maxTicksLimit: 15, stepSize: undefined };
  if (dataLength > 50) return { maxTicksLimit: 12, stepSize: undefined };
  return { maxTicksLimit: 10, stepSize: undefined };
}

function formatDateLabel(timestamp: number, timeRange: string): string {
  const date = new Date(timestamp);

  switch (timeRange) {
    case "7D":
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    case "30D":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "90D":
    case "6M":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "ALL":
    default:
      return date.toLocaleDateString(undefined, {
        year: "2-digit",
        month: "short",
      });
  }
}

export default function CreditScoreChart({
  username,
  historicalData,
  selectedTimeRange,
  isLoading,
  error,
}: CreditScoreChartProps) {
  useEffect(() => {
    if (historicalData.length === 0 || isLoading || error) {
      return;
    }

    const canvas = document.getElementById(`creditScoreChart-${username}`) as
      | HTMLCanvasElement
      | null;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    // Keep ALL data points for smooth chart resolution
    const labels = historicalData.map((dp) =>
      formatDateLabel(dp.timestamp, selectedTimeRange)
    );
    const dataPoints = historicalData.map((dp) => dp.creditScore);

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    const tickConfig = getOptimalTickConfiguration(
      historicalData.length,
      selectedTimeRange,
    );

    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Credit Score",
          data: dataPoints,
          fill: true,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgb(75, 192, 192)",
          tension: 0.4,
          pointHitRadius: 20,
          pointRadius: historicalData.length > 50 ? 2 : 5, // Smaller points for lots of data
          pointHoverRadius: 7,
          pointBackgroundColor: "rgb(75, 192, 192)",
          pointBorderColor: "#fff",
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
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#ccc",
            borderColor: "rgba(75, 192, 192, 0.8)",
            borderWidth: 1,
            caretPadding: 10,
            displayColors: false,
            callbacks: {
              title: function (context) {
                // Show full date in tooltip regardless of label format
                const dataIndex = context[0].dataIndex;
                const timestamp = historicalData[dataIndex].timestamp;
                return new Date(timestamp).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              },
            },
          },
        },
        scales: {
          x: {
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
    });
  }, [historicalData, selectedTimeRange, isLoading, error, username]);

  const canvasId = `creditScoreChart-${username}`;

  if (isLoading) {
    return <p class="text-center text-gray-400 py-8">Loading chart data...</p>;
  }

  if (error) {
    return <p class="text-center text-red-500 py-8">{error}</p>;
  }

  return (
    <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
      <h2 class="text-xl font-semibold mb-4 text-gray-100">Score History</h2>
      {historicalData.length === 0
        ? (
          <p class="text-gray-400 text-sm text-center py-4">
            No historical data available yet.
          </p>
        )
        : (
          <div style={{ position: "relative", width: "100%", height: "300px" }}>
            <canvas id={canvasId}></canvas>
          </div>
        )}
    </div>
  );
}
