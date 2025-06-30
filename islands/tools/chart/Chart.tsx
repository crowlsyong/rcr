// islands/tools/charts/Chart.tsx
import { useEffect, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { OverrideEvent } from "../../../routes/api/v0/credit-score/index.ts";
import ScoreResult from "../../tools/creditscore/ScoreResult.tsx";
import CreditScoreChart from "./CreditScoreChart.tsx";
import TimeRangeSelector from "./TimeRangeSelector.tsx";
// REMOVED IMPORTS: ShareButton, ChartButton

interface UserScoreData {
  username: string;
  userId: string;
  creditScore: number;
  riskBaseFee: number;
  avatarUrl: string | null;
  userExists: boolean;
  fetchSuccess: boolean;
  details: {
    latestRank: number | null;
    outstandingDebtImpact: number;
    calculatedProfit: number;
    balance: number;
    rawMMR: number;
  };
  historicalDataSaved: boolean;
  userDeleted: boolean;
  overrideEvents: OverrideEvent[];
}

interface HistoricalDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

function getInitialUsernameFromUrl(): string {
  if (typeof globalThis.location === "undefined") {
    return "";
  }
  const params = new URLSearchParams(globalThis.location.search);
  return params.get("q") || "";
}

function filterDataByTimeRange(
  data: HistoricalDataPoint[],
  range: string,
): HistoricalDataPoint[] {
  if (range === "ALL" || data.length === 0) return data;

  const now = Date.now();
  let cutoffTime: number;

  switch (range) {
    case "7D":
      cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
      break;
    case "30D":
      cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
      break;
    case "90D":
      cutoffTime = now - (90 * 24 * 60 * 60 * 1000);
      break;
    case "6M":
      cutoffTime = now - (6 * 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }

  return data.filter((point) => point.timestamp >= cutoffTime);
}

export default function Chart() {
  const initialUsername = getInitialUsernameFromUrl();
  const username = useSignal(initialUsername);

  const [searchTriggerUsername, setSearchTriggerUsername] = useState(
    initialUsername,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<UserScoreData | null>(null);
  const [allHistoricalData, setAllHistoricalData] = useState<
    HistoricalDataPoint[]
  >([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30D");

  useEffect(() => {
    if (initialUsername) {
      setSearchTriggerUsername(initialUsername);
    }
  }, []);

  useEffect(() => {
    async function fetchChartData(user: string) {
      setIsLoading(true);
      setError(null);
      setScoreData(null);
      setAllHistoricalData([]);

      if (typeof window !== "undefined") {
        const url = new URL(globalThis.location.href);
        if (user) {
          url.searchParams.set("q", user);
        } else {
          url.searchParams.delete("q");
        }
        globalThis.history.replaceState(null, "", url.toString());
      }

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const scoreRes = await fetch(`/api/v0/credit-score?username=${user}`);
        if (!scoreRes.ok) {
          setError(
            `Failed to fetch current score data: ${scoreRes.statusText}`,
          );
          return;
        }
        const currentScoreData: UserScoreData = await scoreRes.json();
        setScoreData(currentScoreData);

        if (!currentScoreData.userExists) {
          setError(`User '${user}' not found on Manifold Markets.`);
          setScoreData(null);
          return;
        }

        if (!currentScoreData.userId) {
          setError(
            `User '${user}' found, but user ID is missing. Cannot fetch history.`,
          );
          return;
        }

        const historyRes = await fetch(
          `/api/v0/history?userId=${currentScoreData.userId}`,
        );
        if (!historyRes.ok) {
          console.error(
            `Failed to fetch historical data: ${historyRes.statusText}`,
          );
          setError(`Failed to fetch historical data.`);
        } else {
          const historicalData: HistoricalDataPoint[] = await historyRes.json();
          setAllHistoricalData(historicalData);
        }
      } catch (err) {
        console.error("Error fetching data for chart:", err);
        setError("Could not load data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchChartData(searchTriggerUsername);
  }, [searchTriggerUsername]);

  const filteredHistoricalData = filterDataByTimeRange(
    allHistoricalData,
    selectedTimeRange,
  );

  const isWaiting = isLoading && !!searchTriggerUsername;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      setSearchTriggerUsername(username.value);
    }
  };

  const handleSearchClick = () => {
    setSearchTriggerUsername(username.value);
  };

  return (
    <div class="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700">
      <h1 class="text-2xl font-bold mb-6 text-white">Credit Score Chart</h1>

      <div class="mb-6 flex items-end space-x-2">
        <div class="flex-grow">
          <label
            htmlFor="username-input"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Enter Manifold Username:
          </label>
          <input
            id="username-input"
            type="text"
            placeholder="e.g., Alice"
            value={username.value}
            onInput={(
              e,
            ) => (username.value = (e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            class="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={isLoading}
          class={`px-4 py-2 rounded-md font-semibold text-white transition-colors duration-200 ${
            isLoading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Search
        </button>
      </div>

      {isWaiting && (
        <p class="text-center text-gray-400 py-8">Loading data...</p>
      )}

      {error && searchTriggerUsername && (
        <p class="text-center text-red-500 py-8">{error}</p>
      )}

      {!searchTriggerUsername && !isWaiting && !error && (
        <p class="text-center text-gray-400 py-8">
          Enter a username above to see their credit score chart.
        </p>
      )}

      {searchTriggerUsername && !isWaiting && !error && scoreData &&
          scoreData.userExists
        ? (
          <>
            <ScoreResult
              username={scoreData.username}
              creditScore={scoreData.creditScore}
              riskBaseFee={scoreData.riskBaseFee}
              avatarUrl={scoreData.avatarUrl}
              isWaiting={false}
            />

            {/* REMOVED ChartButton and ShareButton from here */}

            <div class="mt-6">
              <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 class="text-xl font-semibold text-gray-100 mb-2 md:mb-0">
                    Score History
                  </h2>
                  {allHistoricalData.length > 0 && (
                    <TimeRangeSelector
                      selectedRange={selectedTimeRange}
                      onRangeChange={setSelectedTimeRange}
                    />
                  )}
                </div>

                <CreditScoreChart
                  username={searchTriggerUsername}
                  historicalData={filteredHistoricalData}
                  selectedTimeRange={selectedTimeRange}
                  isLoading={false}
                  error={null}
                  overrideEvents={scoreData?.overrideEvents || []}
                />
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-200">
              <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
                <h2 class="text-xl font-semibold mb-3 text-gray-100">
                  Current Score Details
                </h2>
                <p class="text-sm md:text-base">
                  RISK Base Fee: <strong>{scoreData.riskBaseFee}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Latest League Rank:{" "}
                  <strong>{scoreData.details?.latestRank ?? "N/A"}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Debt:{" "}
                  <strong>{scoreData.details?.outstandingDebtImpact}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Calculated Profit:{" "}
                  <strong>
                    {Math.round(scoreData.details?.calculatedProfit)}
                  </strong>
                </p>
                <p class="text-sm md:text-base">
                  Approximate Balance:{" "}
                  <strong>{Math.round(scoreData.details?.balance)}</strong>
                </p>
              </div>

              <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner">
                <h2 class="text-xl font-semibold mb-3 text-gray-100">Notes</h2>
                <p class="text-xs md:text-sm text-gray-400">
                  The historical data updates at most every 24 hours. The
                  current score displayed above reflects the latest data from
                  RISK. It creates a datapoint whenever a score is fetched, so
                  long as 24 hours have elapsed since the last datapoint was
                  created. This is extremely experimental and may completely
                  fail to work. Hehe!
                </p>
                {scoreData?.historicalDataSaved && (
                  <p class="text-xs md:text-sm text-green-500 mt-2">
                    Historical data point saved during this request.
                  </p>
                )}
              </div>
            </div>
          </>
        )
        : null}
    </div>
  );
}
