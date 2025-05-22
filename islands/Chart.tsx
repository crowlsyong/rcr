/// <reference lib="deno.unstable" />
// islands/CreditScoreChart.tsx

import { useEffect, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";

// Register Chart.js components (like linear scales, line controller, etc.)
Chart.register(...registerables);

interface HistoricalDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number; // Unix timestamp
}

interface CreditScoreChartProps {
  userId: string; // Pass the user ID as a prop to the island
}

export default function CreditScoreChart({ userId }: CreditScoreChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    [],
  );

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/history?userId=${userId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch historical data: ${res.statusText}`);
        }
        const data: HistoricalDataPoint[] = await res.json();
        setHistoricalData(data);
      } catch (err) {
        console.error("Error fetching historical data:", err);
        setError("Could not load historical data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchHistoricalData();
    }
  }, [userId]); // Refetch data if the userId prop changes

  useEffect(() => {
    if (historicalData.length === 0 || isLoading || error) {
      return; // Don't render chart if no data, loading, or error
    }

    const canvas = document.getElementById(`creditScoreChart-${userId}`) as
      | HTMLCanvasElement
      | null;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    // Prepare data for Chart.js
    const labels = historicalData.map((dp) =>
      new Date(dp.timestamp).toLocaleDateString()
    ); // Use date strings as labels
    const dataPoints = historicalData.map((dp) => dp.creditScore);

    // Destroy previous chart instance if it exists to prevent duplicates
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // @ts-ignore: Chart will be available globally after script loads
    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Credit Score",
          data: dataPoints,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.4,
          pointHitRadius: 20,
          pointRadius: 5,
        }],
      },
      options: {
        responsive: true, // Make chart responsive
        maintainAspectRatio: false, // Allow aspect ratio to be controlled by container
        plugins: {
          legend: {
            labels: { color: "#f0f0f0" },
          },
          title: {
            display: true,
            text: "Credit Score History",
            color: "#f0f0f0",
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Date",
              color: "#f0f0f0",
            },
            ticks: { color: "#ccc" },
            grid: { color: "#444" },
          },
          y: {
            title: {
              display: true,
              text: "Credit Score",
              color: "#f0f0f0",
            },
            beginAtZero: false, // Don't force start at zero for score
            min: 0, // Ensure minimum is 0
            max: 1000, // Ensure maximum is 1000
            ticks: { color: "#ccc" },
            grid: { color: "#444" },
          },
        },
      },
    });
  }, [historicalData, isLoading, error, userId]); // Redraw chart when data, loading state, or error changes

  // Add a unique ID to the canvas based on userId
  const canvasId = `creditScoreChart-${userId}`;

  if (isLoading) {
    return <p>Loading chart data...</p>;
  }

  if (error) {
    return <p class="text-red-500">{error}</p>; // Style error message
  }

  if (historicalData.length === 0) {
    return <p>No historical data available yet.</p>;
  }

  return (
    // Wrap canvas in a div for better responsiveness control
    <div style={{ position: "relative", width: "100%", height: "400px" }}>
      <canvas id={canvasId}></canvas>
    </div>
  );
}
