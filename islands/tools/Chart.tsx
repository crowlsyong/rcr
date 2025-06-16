/// <reference lib="deno.unstable" />
// islands/Chart.tsx

import { useEffect, useState } from "preact/hooks";
import { Chart, registerables } from "chart.js";
import ScoreResult from "../tools/creditscore/ScoreResult.tsx";

Chart.register(...registerables);

interface UserScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
  userExists: boolean;
  latestRank: number | null;
  outstandingDebtImpact: number;
  calculatedProfit: number;
  balance: number;
  rawMMR: number;
  historicalDataSaved: boolean;
  userId: string;
}

interface HistoricalDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

interface ChartProps {
  username: string;
}

export default function CreditScoreChart({ username }: ChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<UserScoreData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    [],
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setScoreData(null);
      setHistoricalData([]);

      if (!username) {
        setIsLoading(false);
        return;
      }

      try {
        const scoreRes = await fetch(`/api/score?username=${username}`);
        if (!scoreRes.ok) {
          // This block handles non-200 responses from your /api/score endpoint
          setError(
            `Failed to fetch current score data: ${scoreRes.statusText}`,
          );
          setIsLoading(false);
          return;
        }
        const currentScoreData: UserScoreData = await scoreRes.json();
        setScoreData(currentScoreData);

        // --- NEW/MODIFIED LOGIC HERE ---
        // Check if the user actually exists from the API's perspective
        if (!currentScoreData.userExists) {
          setError(`User '${username}' not found on Manifold Markets.`);
          setIsLoading(false);
          return;
        }

        // Only proceed to fetch history if the user was found and a userId is available
        if (!currentScoreData.userId) {
          setError(
            `User '${username}' found, but user ID is missing. Cannot fetch history.`,
          );
          setIsLoading(false);
          return;
        }
        // --- END NEW/MODIFIED LOGIC ---

        const historyRes = await fetch(
          `/api/history?userId=${currentScoreData.userId}`,
        );
        if (!historyRes.ok) {
          console.error(
            `Failed to fetch historical data: ${historyRes.statusText}`,
          );
          setError(`Failed to fetch historical data.`); // Provide a user-facing error
        } else {
          const historicalData: HistoricalDataPoint[] = await historyRes.json();
          setHistoricalData(historicalData);
        }
      } catch (err) {
        console.error("Error fetching data for chart:", err);
        setError("Could not load data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username]);

  useEffect(() => {
    if (historicalData.length === 0 || isLoading || error) {
      return;
    }

    const canvas = document.getElementById(`creditScoreChart-${username}`) as
      | HTMLCanvasElement
      | null;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const labels = historicalData.map((dp) =>
      new Date(dp.timestamp).toLocaleDateString()
    );
    const dataPoints = historicalData.map((dp) => dp.creditScore);

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

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
          pointRadius: 5,
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
  }, [historicalData, isLoading, error, username]);

  const canvasId = `creditScoreChart-${username}`;

  if (isLoading) {
    return <p class="text-center text-gray-400 py-8">Loading data...</p>;
  }

  if (error) {
    return <p class="text-center text-red-500 py-8">{error}</p>;
  }

  return (
    <div>
      {scoreData
        ? (
          <ScoreResult
            username={scoreData.username}
            creditScore={scoreData.creditScore}
            riskMultiplier={scoreData.riskMultiplier}
            avatarUrl={scoreData.avatarUrl}
            isWaiting={false}
          />
        )
        : (
          <p class="text-center text-gray-400 py-8">
            Enter a username to see score details.
          </p>
        )}
      <div class="mt-6 bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
        <h2 class="text-xl font-semibold mb-4 text-gray-100">Score History</h2>
        {" "}
        {historicalData.length === 0
          ? (
            <p class="text-gray-400 text-sm text-center py-4">
              No historical data available yet.
            </p>
          )
          : (
            <div
              style={{ position: "relative", width: "100%", height: "300px" }}
            >
              {/* Reduced height for mobile */}
              <canvas id={canvasId}></canvas>
            </div>
          )}
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-200">
        <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
          <h2 class="text-xl font-semibold mb-3 text-gray-100">
            Current Score Details
          </h2>
          {scoreData
            ? (
              <>
                <p class="text-sm md:text-base">
                  Risk Multiplier: <strong>{scoreData.riskMultiplier}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Latest League Rank:{" "}
                  <strong>{scoreData.latestRank ?? "N/A"}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Debt: <strong>{scoreData.outstandingDebtImpact}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Calculated Profit:{" "}
                  <strong>{Math.round(scoreData.calculatedProfit)}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Approximate Balance:{" "}
                  <strong>{Math.round(scoreData.balance)}</strong>
                </p>
              </>
            )
            : (
              <p class="text-sm text-gray-400">
                Details will load after fetching score.
              </p>
            )}
        </div>
        <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
          <h2 class="text-xl font-semibold mb-3 text-gray-100">Notes</h2>
          <p class="text-xs md:text-sm text-gray-400">
            The historical data updates at most every 24 hours. The current
            score displayed above reflects the latest data from RISK. It creates
            a datapoint whenever a score is fetched, so long as 24 hours have
            elapsed since the last datapoint was created. This is extremely
            experimental and may completely fail to work. Hehe!
          </p>
          {scoreData?.historicalDataSaved && (
            <p class="text-xs md:text-sm text-green-500 mt-2">
              Historical data point saved during this request.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
