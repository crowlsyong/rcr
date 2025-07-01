// islands/admin/UserAdjustmentDisplay.tsx
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { OverrideEvent, UserScoreOverview } from "./AdjustmentFormFields.tsx";
import ScoreResult from "../tools/creditscore/ScoreResult.tsx";
import CreditScoreChart from "../tools/chart/CreditScoreChart.tsx";
import { CreditScoreDataPoint } from "../tools/chart/CreditScoreChart.tsx";
// REMOVED: import ExistingOverridesTable from "./ExistingOverridesTable.tsx"; // No longer needed here

interface UserAdjustmentDisplayProps {
  debouncedUsername: string;
  onUserOverviewFetched: (user: UserScoreOverview | null) => void;
  isLoadingParent: boolean;
  refreshTrigger: number;
  onDeleteSuccess: () => void; // This prop can now be removed if not passed to any child
  onModify: (event: OverrideEvent) => void; // This prop can now be removed if not passed to any child
}

export default function UserAdjustmentDisplay({
  debouncedUsername,
  onUserOverviewFetched,
  refreshTrigger,
  // Removed onDeleteSuccess and onModify from props as they are not passed down
}: UserAdjustmentDisplayProps) {
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userOverview, setUserOverview] = useState<UserScoreOverview | null>(
    null,
  );
  const [userError, setUserError] = useState<string | null>(null);
  const [allHistoricalData, setAllHistoricalData] = useState<
    CreditScoreDataPoint[]
  >([]);

  const hasMounted = useRef(false);

  useEffect(() => {
    if (hasMounted.current) {
      if (typeof window !== "undefined") {
        const url = new URL(globalThis.location.href);
        if (debouncedUsername) {
          url.searchParams.set("q", debouncedUsername);
        } else {
          url.searchParams.delete("q");
        }
        globalThis.history.replaceState(null, "", url.toString());
      }
    } else {
      hasMounted.current = true;
    }
  }, [debouncedUsername]);

  const fetchAndSetUserData = useCallback(async (targetUsername: string) => {
    setUserOverview(null);
    setUserError(null);
    setAllHistoricalData([]);
    setIsLoadingUser(true);
    console.log("[UserAdjustmentDisplay] Fetching data for:", targetUsername);

    try {
      const res = await fetch(
        `/api/v0/credit-score?username=${targetUsername}`,
      );
      const data = await res.json();

      if (!res.ok || !data.userExists) {
        const errorMessage = data.error || `User @${targetUsername} not found.`;
        setUserError(errorMessage);
        onUserOverviewFetched(null);
        console.error(
          "[UserAdjustmentDisplay] Fetch failed:",
          targetUsername,
          errorMessage,
        );
        return;
      }

      let fetchedHistoricalData: CreditScoreDataPoint[] = [];
      if (data.userId) {
        const historyRes = await fetch(`/api/v0/history?userId=${data.userId}`);
        if (historyRes.ok) {
          fetchedHistoricalData = await historyRes.json();
          setAllHistoricalData(fetchedHistoricalData);
        } else {
          console.error(
            "Failed to fetch historical data for chart:",
            historyRes.statusText,
          );
        }
      }

      const overview: UserScoreOverview = {
        userExists: data.userExists,
        fetchSuccess: data.fetchSuccess,
        userId: data.userId,
        username: data.username,
        avatarUrl: data.avatarUrl,
        creditScore: data.creditScore,
        riskBaseFee: data.riskBaseFee,
        userDeleted: data.userDeleted,
        existingOverrideEvents: data.overrideEvents || [],
        allHistoricalData: fetchedHistoricalData,
      };
      setUserOverview(overview);
      onUserOverviewFetched(overview);
      console.log("[UserAdjustmentDisplay] User data fetched:", overview);
    } catch (err) {
      const errorMessage = `Error fetching user data: ${
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      }`;
      setUserError(errorMessage);
      onUserOverviewFetched(null);
      console.error("[UserAdjustmentDisplay] Fetch error:", err);
    } finally {
      setIsLoadingUser(false);
    }
  }, [onUserOverviewFetched]);

  useEffect(() => {
    console.log(
      "[UserAdjustmentDisplay] Data fetch effect triggered. Debounced username:",
      debouncedUsername,
      "Refresh Trigger:",
      refreshTrigger,
    );
    if (!debouncedUsername) {
      setUserOverview(null);
      setUserError(null);
      onUserOverviewFetched(null);
      setIsLoadingUser(false);
      setAllHistoricalData([]);
      return;
    }
    fetchAndSetUserData(debouncedUsername);
  }, [debouncedUsername, refreshTrigger, fetchAndSetUserData]);

  return (
    <>
      {isLoadingUser && (
        <p class="text-gray-400 text-sm mt-2">Loading user data...</p>
      )}
      {userError && <p class="text-red-400 text-sm mt-2">{userError}</p>}

      {userOverview && !userError && (
        <>
          <div class="p-4 bg-gray-800 rounded-lg border border-gray-700 mb-6">
            <h3 class="text-lg font-semibold text-white mb-2">
              Current User Status:
            </h3>
            <ScoreResult
              username={userOverview.username}
              creditScore={userOverview.creditScore}
              riskBaseFee={userOverview.riskBaseFee}
              avatarUrl={userOverview.avatarUrl}
              isWaiting={false}
              userExists={userOverview.userExists}
              fetchSuccess={userOverview.fetchSuccess}
              isEmptyInput={false}
              userDeleted={userOverview.userDeleted}
            />
          </div>

          {userOverview.allHistoricalData.length > 0 ||
              userOverview.existingOverrideEvents.length > 0
            ? (
              <div class="bg-gray-900 rounded-lg">
                <CreditScoreChart
                  username={userOverview.username}
                  historicalData={allHistoricalData}
                  selectedTimeRange="ALL"
                  isLoading={isLoadingUser}
                  error={userError}
                  overrideEvents={userOverview.existingOverrideEvents}
                  chartHeight="200px" // Pass a smaller height here
                />
              </div>
            )
            : (
              <div class="bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner border border-gray-700 mb-6">
                <h2 class="text-xl font-semibold mb-4 text-gray-100">
                  Score History
                </h2>
                <p class="text-gray-400 text-sm text-center py-4">
                  No historical score or override data to display yet for this
                  user.
                </p>
              </div>
            )}
        </>
      )}
    </>
  );
}
