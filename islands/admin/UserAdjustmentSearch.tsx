// islands/admin/UserAdjustmentSearch.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { OverrideEvent, UserScoreOverview } from "./AdjustmentFormFields.tsx";
import ScoreResult from "../tools/creditscore/ScoreResult.tsx";

interface UserAdjustmentSearchProps {
  onUserSelected: (user: UserScoreOverview | null) => void;
  isLoadingParent: boolean;
}

function getInitialUsernameFromUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const params = new URLSearchParams(globalThis.location.search);
  return params.get("q") || "";
}

export default function UserAdjustmentSearch(
  { onUserSelected, isLoadingParent }: UserAdjustmentSearchProps,
) {
  const initialUsername = getInitialUsernameFromUrl();
  const usernameInput = useSignal(initialUsername); // This holds the raw input value
  const [debouncedUsername, setDebouncedUsername] = useState(initialUsername); // This holds the debounced value
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userOverview, setUserOverview] = useState<UserScoreOverview | null>(
    null,
  );
  const [userError, setUserError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Record<number, boolean>>(
    {},
  );

  // Effect for debouncing raw usernameInput.value to debouncedUsername
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(usernameInput.value);
    }, 200); // 200ms debounce
    return () => clearTimeout(timer);
  }, [usernameInput.value]); // Depends only on raw input value

  // Effect for fetching data AND updating URL based on debouncedUsername
  useEffect(() => {
    if (debouncedUsername) {
      fetchAndSetUserData(debouncedUsername);
      // Only update URL when debouncedUsername is stable and present
      if (typeof window !== "undefined") {
        const url = new URL(globalThis.location.href);
        url.searchParams.set("q", debouncedUsername);
        globalThis.history.replaceState(null, "", url.toString());
      }
    } else {
      // Clear state and URL params if input is empty
      setUserOverview(null);
      setUserError(null);
      onUserSelected(null);
      if (typeof window !== "undefined") {
        const url = new URL(globalThis.location.href);
        url.searchParams.delete("q");
        globalThis.history.replaceState(null, "", url.toString());
      }
    }
  }, [debouncedUsername]); // Depends only on debouncedUsername

  const fetchAndSetUserData = async (targetUsername: string) => {
    setUserOverview(null);
    setUserError(null);
    setIsLoadingUser(true); // Moved inside so it's only active during actual fetch

    try {
      const res = await fetch(
        `/api/v0/credit-score?username=${targetUsername}`,
      );
      const data = await res.json();

      if (!res.ok || !data.userExists) {
        setUserError(data.error || `User @${targetUsername} not found.`);
        onUserSelected(null);
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
      onUserSelected(overview);
    } catch (err) {
      setUserError(
        `Error fetching user data: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`,
      );
      onUserSelected(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

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

      await fetchAndSetUserData(userOverview.username);
      setConfirmDelete({});
    } catch (err) {
      console.error(
        `Error deleting override: ${
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
    <div class="space-y-6">
      <div class="mb-6">
        <label
          htmlFor="username-search"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Search User by Username:
        </label>
        <input
          id="username-search"
          type="text"
          placeholder="e.g., Tumbles"
          value={usernameInput.value}
          onInput={(
            e,
          ) => (usernameInput.value = (e.target as HTMLInputElement).value)}
          class="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingUser || isLoadingParent}
        />
        {isLoadingUser && (
          <p class="text-gray-400 text-sm mt-2">Loading user data...</p>
        )}
        {userError && <p class="text-red-400 text-sm mt-2">{userError}</p>}
      </div>

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
                              onUserSelected({
                                ...userOverview,
                                modifyingEvent: event,
                              } as UserScoreOverview & {
                                modifyingEvent: OverrideEvent;
                              });
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
    </div>
  );
}
