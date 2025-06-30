// islands/admin/UserAdjustmentDisplay.tsx
import { useEffect, useState } from "preact/hooks";
import { OverrideEvent, UserScoreOverview } from "./AdjustmentFormFields.tsx";
import ScoreResult from "../tools/creditscore/ScoreResult.tsx";

interface UserAdjustmentDisplayProps {
  debouncedUsername: string;
  onUserOverviewFetched: (user: UserScoreOverview | null) => void;
  isLoadingParent: boolean;
  refreshTrigger: number; // New prop to trigger a refresh
}

export default function UserAdjustmentDisplay({
  debouncedUsername,
  onUserOverviewFetched,
  isLoadingParent,
  refreshTrigger,
}: UserAdjustmentDisplayProps) {
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userOverview, setUserOverview] = useState<UserScoreOverview | null>(
    null,
  );
  const [userError, setUserError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Record<number, boolean>>(
    {},
  );

  // This effect fetches data when debouncedUsername changes OR refreshTrigger increments
  useEffect(() => {
    console.log(
      "[UserAdjustmentDisplay] Effect triggered. Debounced username:",
      debouncedUsername,
      "Refresh Trigger:",
      refreshTrigger,
    );
    // Don't fetch if debouncedUsername is empty
    if (!debouncedUsername) {
      setUserOverview(null);
      setUserError(null);
      onUserOverviewFetched(null);
      setIsLoadingUser(false);
      return;
    }

    const fetchAndSetUserData = async (targetUsername: string) => {
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
          const errorMessage = data.error ||
            `User @${targetUsername} not found.`;
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
        onUserOverviewFetched(overview); // Notify parent
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
    };

    fetchAndSetUserData(debouncedUsername);
  }, [debouncedUsername, onUserOverviewFetched, refreshTrigger]); // Added refreshTrigger

  const handleDelete = async (eventToDelete: OverrideEvent) => {
    if (!userOverview) return;

    if (!confirmDelete[eventToDelete.timestamp]) {
      setConfirmDelete((prev) => ({
        ...prev,
        [eventToDelete.timestamp]: true,
      }));
      setTimeout(() => {
        setConfirmDelete((prev) => ({
          ...prev,
          [eventToDelete.timestamp]: false,
        }));
      }, 3000);
      return;
    }

    console.log("[UserAdjustmentDisplay] Deleting override:", eventToDelete);
    try {
      const response = await fetch("/api/v0/admin/delete-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userOverview.userId,
          timestamp: eventToDelete.timestamp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete adjustment.");
      }
      console.log("[UserAdjustmentDisplay] Override deleted successfully.");
      // Trigger a refresh in the display by incrementing the refreshTrigger in the parent
      // This will cause this component's useEffect to re-run and re-fetch.
      if (userOverview.username) {
        onUserOverviewFetched({ ...userOverview }); // Notify parent to trigger a full refresh
      }
      setConfirmDelete({});
    } catch (err) {
      console.error(
        `[UserAdjustmentDisplay] Error deleting override: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`,
      );
    }
  };

  const formatTimestampToDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {isLoadingUser && (
        <p class="text-gray-400 text-sm mt-2">Loading user data...</p>
      )}
      {userError && <p class="text-red-400 text-sm mt-2">{userError}</p>}

      {userOverview && !userError && (
        <>
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

          {userOverview.existingOverrideEvents.length > 0 && (
            <div class="p-4 bg-gray-800 rounded-lg shadow-inner border border-gray-700">
              <h4 class="text-md font-semibold text-white mb-4">
                Existing Overrides:
              </h4>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-700">
                  <thead class="bg-gray-700">
                    <tr>
                      <th class="px-4 py-2 text-left text-xxs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th class="px-4 py-2 text-left text-xxs font-medium text-gray-300 uppercase tracking-wider">
                        Modifier
                      </th>
                      <th class="px-4 py-2 text-left text-xxs font-medium text-gray-300 uppercase tracking-wider">
                        Notes
                      </th>
                      <th class="px-4 py-2 text-left text-xxs font-medium text-gray-300 uppercase tracking-wider">
                        URL
                      </th>
                      <th class="px-4 py-2 text-center text-xxs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-800">
                    {userOverview.existingOverrideEvents.map((event) => (
                      <tr key={event.timestamp} class="hover:bg-gray-700">
                        <td class="px-4 py-2 text-xxs text-gray-200">
                          {formatTimestampToDate(event.dateOfInfraction)}
                        </td>
                        <td class="px-4 py-2 text-xxs text-gray-200">
                          {event.modifier > 0
                            ? `+${event.modifier}`
                            : event.modifier}
                        </td>
                        <td class="px-4 py-2 text-xxs text-gray-300 max-w-[200px] truncate">
                          {event.description}
                        </td>
                        <td class="px-4 py-2 text-xxs text-blue-400 hover:underline">
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Link
                          </a>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-right text-xxs font-medium">
                          <button
                            type="button"
                            onClick={() => {
                              onUserOverviewFetched(
                                {
                                  ...userOverview,
                                  modifyingEvent: event,
                                } as UserScoreOverview & {
                                  modifyingEvent: OverrideEvent;
                                },
                              );
                            }}
                            class="text-blue-500 hover:text-blue-700 mr-2"
                            disabled={isLoadingParent}
                          >
                            Modify
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(event)}
                            class={`font-medium py-1 px-2 rounded ${
                              confirmDelete[event.timestamp]
                                ? "bg-red-600 text-white"
                                : "text-red-500 hover:text-red-700"
                            }`}
                            disabled={isLoadingParent}
                          >
                            {confirmDelete[event.timestamp]
                              ? "Are you sure?"
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
