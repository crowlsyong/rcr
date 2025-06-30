// islands/admin/UserAdjustmentDisplay.tsx
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { UserScoreOverview } from "./AdjustmentFormFields.tsx";
import ScoreResult from "../tools/creditscore/ScoreResult.tsx";

interface UserAdjustmentDisplayProps {
  debouncedUsername: string;
  onUserOverviewFetched: (user: UserScoreOverview | null) => void;
  isLoadingParent: boolean;
  refreshTrigger: number;
  onTableRefreshNeeded: () => void;
}

export default function UserAdjustmentDisplay({
  debouncedUsername,
  onUserOverviewFetched,
  refreshTrigger,
}: UserAdjustmentDisplayProps) {
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userOverview, setUserOverview] = useState<UserScoreOverview | null>(
    null,
  );
  const [userError, setUserError] = useState<string | null>(null);

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
      return;
    }
    fetchAndSetUserData(debouncedUsername);
  }, [debouncedUsername, refreshTrigger, fetchAndSetUserData]);

  // Removed handleDelete, handleOverridesTableDeleteSuccess, handleOverridesTableModify
  // These responsibilities (delete/modify ops) now reside in the ExistingOverridesTable
  // or are passed through onTableRefreshNeeded directly from AdjustmentForm.

  return (
    <>
      {isLoadingUser && (
        <p class="text-gray-400 text-sm mt-2">Loading user data...</p>
      )}
      {userError && <p class="text-red-400 text-sm mt-2">{userError}</p>}

      {userOverview && !userError && (
        <div class="p-4 bg-gray-800 rounded-lg border border-gray-700">
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
      )}
      {/* ExistingOverridesTable is no longer rendered here */}
    </>
  );
}
