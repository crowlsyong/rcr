// islands/Chart.tsx
import { useEffect, useState } from "preact/hooks";
import ScoreResult from "../../tools/creditscore/ScoreResult.tsx";
import CreditScoreChart from "../chart/CreditScoreChart.tsx";
import TimeRangeSelector from "../chart/TimeRangeSelector.tsx";
import { OverrideEvent } from "../../../routes/api/v0/credit-score/index.ts";

interface UserScoreData {
  username: string;
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
  userId: string;
  userDeleted: boolean;
  overrideEvents: OverrideEvent[];
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

export default function Chart({ username }: ChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<UserScoreData | null>(null);
  const [allHistoricalData, setAllHistoricalData] = useState<
    HistoricalDataPoint[]
  >([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30D");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setScoreData(null);
      setAllHistoricalData([]);

      if (!username) {
        setIsLoading(false);
        return;
      }

      try {
        const scoreRes = await fetch(`/api/v0/credit-score?username=${username}`);
        if (!scoreRes.ok) {
          setError(
            `Failed to fetch current score data: ${scoreRes.statusText}`,
          );
          setIsLoading(false);
          return;
        }
        const currentScoreData: UserScoreData = await scoreRes.json();
        setScoreData(currentScoreData);
        console.log("Frontend Chart: Received overrideEvents from API:", currentScoreData.overrideEvents); // LOG 2

        if (!currentScoreData.userExists) {
          setError(`User '${username}' not found on Manifold Markets.`);
          setIsLoading(false);
          return;
        }

        if (!currentScoreData.userId) {
          setError(
            `User '${username}' found, but user ID is missing. Cannot fetch history.`,
          );
          setIsLoading(false);
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
    };

    fetchData();
  }, [username]);

  const filteredHistoricalData = filterDataByTimeRange(
    allHistoricalData,
    selectedTimeRange,
  );

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
            riskBaseFee={scoreData.riskBaseFee}
            avatarUrl={scoreData.avatarUrl}
            isWaiting={false}
          />
        )
        : (
          <p class="text-center text-gray-400 py-8">
            Enter a username to see score details.
          </p>
        )}

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
            username={username}
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
          {scoreData
            ? (
              <>
                <p class="text-sm md:text-base">
                  RISK Base Fee: <strong>{scoreData.riskBaseFee}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Latest League Rank:{" "}
                  <strong>{scoreData.details?.latestRank ?? "N/A"}</strong>
                </p>
                {/* <p class="text-sm md:text-base">
                  Debt: <strong>{scoreData.details?.outstandingDebtImpact}</strong>
                </p> */}
                <p class="text-sm md:text-base">
                  Calculated Profit:{" "}
                  <strong>{Math.round(scoreData.details?.calculatedProfit)}</strong>
                </p>
                <p class="text-sm md:text-base">
                  Approximate Balance:{" "}
                  <strong>{Math.round(scoreData.details?.balance)}</strong>
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
