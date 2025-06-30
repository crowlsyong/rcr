// islands/admin/AdjustmentForm.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { OverrideEvent } from "../../routes/api/v0/credit-score/index.ts";
import ScoreResult from "../tools/creditscore/ScoreResult.tsx";

interface UserScoreOverview {
  userExists: boolean;
  fetchSuccess: boolean;
  userId: string;
  username: string;
  avatarUrl: string | null;
  creditScore: number;
  riskBaseFee: number;
  userDeleted: boolean;
  existingOverrideEvents: OverrideEvent[];
}

export default function AdjustmentForm() {
  const usernameInput = useSignal("");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userOverview, setUserOverview] = useState<UserScoreOverview | null>(
    null,
  );
  const [userError, setUserError] = useState<string | null>(null);

  const modifierInput = useSignal<number | null>(null);
  const dateInput = useSignal("");
  const urlInput = useSignal("");
  const descriptionInput = useSignal("");

  const [confirmDelete, setConfirmDelete] = useState<Record<number, boolean>>(
    {},
  );
  const [modifyingEvent, setModifyingEvent] = useState<OverrideEvent | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitMessageType, setSubmitMessageType] = useState<
    "success" | "error" | ""
  >("");

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(globalThis.location.search);
      const q = params.get("q");
      if (q && q !== usernameInput.value) {
        usernameInput.value = q;
        setDebouncedUsername(q);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(usernameInput.value);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(globalThis.location.search);
        if (usernameInput.value) {
          params.set("q", usernameInput.value);
        } else {
          params.delete("q");
        }
        globalThis.history.replaceState(null, "", `?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameInput.value]);

  const fetchAndSetUserData = async (targetUsername: string) => {
    setUserOverview(null);
    setUserError(null);
    if (!targetUsername) {
      setIsLoadingUser(false);
      return;
    }

    setIsLoadingUser(true);
    try {
      const res = await fetch(
        `/api/v0/credit-score?username=${targetUsername}`,
      );
      const data = await res.json();

      if (!res.ok || !data.userExists) {
        setUserError(data.error || `User @${targetUsername} not found.`);
        return;
      }

      setUserOverview({
        userExists: data.userExists,
        fetchSuccess: data.fetchSuccess,
        userId: data.userId,
        username: data.username,
        avatarUrl: data.avatarUrl,
        creditScore: data.creditScore,
        riskBaseFee: data.riskBaseFee,
        userDeleted: data.userDeleted,
        existingOverrideEvents: data.overrideEvents || [],
      });
    } catch (err) {
      setUserError(
        `Error fetching user data: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`,
      );
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchAndSetUserData(debouncedUsername);
  }, [debouncedUsername]);

  useEffect(() => {
    if (!dateInput.value && dateInputRef.current) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }
  }, [dateInput.value]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitMessage(null);
    setSubmitMessageType("");

    if (!userOverview || !userOverview.userId) {
      setSubmitMessage("Please select a valid user first.");
      setSubmitMessageType("error");
      return;
    }
    if (
      modifierInput.value === null || isNaN(modifierInput.value) ||
      !descriptionInput.value || !urlInput.value || !dateInput.value
    ) {
      setSubmitMessage("Please fill all adjustment fields.");
      setSubmitMessageType("error");
      return;
    }
    const infractionDateTimestamp = new Date(dateInput.value).getTime();
    if (isNaN(infractionDateTimestamp)) {
      setSubmitMessage("Please select a valid date for the infraction.");
      setSubmitMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: {
        userId: string;
        username: string;
        modifier: number;
        url: string;
        dateOfInfraction: number;
        description: string;
        originalTimestamp?: number;
      } = {
        userId: userOverview.userId,
        username: userOverview.username,
        modifier: modifierInput.value,
        url: urlInput.value,
        dateOfInfraction: infractionDateTimestamp,
        description: descriptionInput.value,
      };

      if (modifyingEvent) {
        payload.originalTimestamp = modifyingEvent.timestamp;
      }

      const endpoint = modifyingEvent
        ? "/api/v0/admin/update-override"
        : "/api/v0/admin/adjust-score";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawResponseText = await response.text();
      let result;
      try {
        result = JSON.parse(rawResponseText);
      } catch (parseError) {
        setSubmitMessage(
          `API Error: Unexpected response format. Received non-JSON: "${
            rawResponseText.substring(0, 100)
          }..."`,
        );
        setSubmitMessageType("error");
        console.error(
          "Failed to parse API response as JSON:",
          parseError,
          rawResponseText,
        );
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to apply adjustment.");
      }

      setSubmitMessage(
        result.message ||
          (modifyingEvent
            ? "Adjustment updated successfully!"
            : "Adjustment added successfully!"),
      );
      setSubmitMessageType("success");

      modifierInput.value = null;
      dateInput.value = new Date().toISOString().split("T")[0];
      urlInput.value = "";
      descriptionInput.value = "";
      setModifyingEvent(null);
      setConfirmDelete({});

      await new Promise((r) => setTimeout(r, 500));
      fetchAndSetUserData(userOverview.username);
    } catch (err) {
      setSubmitMessage(
        `Error: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`,
      );
      setSubmitMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventToDelete: OverrideEvent) => {
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

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitMessageType("");

    try {
      const response = await fetch("/api/v0/admin/delete-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userOverview?.userId,
          timestamp: eventToDelete.timestamp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete adjustment.");
      }

      setSubmitMessage(result.message || "Adjustment deleted successfully!");
      setSubmitMessageType("success");
      setConfirmDelete({});

      await new Promise((r) => setTimeout(r, 500));
      fetchAndSetUserData(userOverview?.username || "");
    } catch (err) {
      setSubmitMessage(
        `Error: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`,
      );
      setSubmitMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModify = (eventToModify: OverrideEvent) => {
    setModifyingEvent(eventToModify);
    modifierInput.value = eventToModify.modifier;
    dateInput.value = new Date(eventToModify.dateOfInfraction).toISOString()
      .split("T")[0];
    urlInput.value = eventToModify.url;
    descriptionInput.value = eventToModify.description;
    setConfirmDelete({});
  };

  const formatTimestampToDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div class="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700">
      <h2 class="text-xl font-bold mb-6 text-white">Adjust User Score</h2>

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
          disabled={isLoadingUser}
        />
        {isLoadingUser && (
          <p class="text-gray-400 text-sm mt-2">Loading user data...</p>
        )}
        {userError && <p class="text-red-400 text-sm mt-2">{userError}</p>}
      </div>

      {userOverview && !userError && (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Current User Status & Existing Overrides */}
          <div class="space-y-6">
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
                              onClick={() =>
                                handleModify(event)}
                              class="text-blue-500 hover:text-blue-700 mr-2"
                              disabled={isSubmitting}
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
                              disabled={isSubmitting}
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
          </div>

          {/* Right Column: Adjustment Form */}
          <div>
            <form
              onSubmit={handleSubmit}
              class="space-y-4 bg-gray-800 p-6 rounded-lg border border-gray-700"
            >
              <h3 class="text-lg font-bold text-white mb-4">
                {modifyingEvent
                  ? `Modify Adjustment for ${modifyingEvent.username} on ${
                    formatTimestampToDate(modifyingEvent.dateOfInfraction)
                  }`
                  : "Add New Adjustment:"}
              </h3>

              <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1">
                  <label
                    htmlFor="modifier"
                    class="block text-sm font-medium text-gray-300"
                  >
                    Score Modifier (e.g., -50, +25):
                  </label>
                  <input
                    id="modifier"
                    type="number"
                    value={modifierInput.value !== null
                      ? modifierInput.value.toString()
                      : ""}
                    onInput={(e) =>
                      modifierInput.value = parseInt(
                        (e.target as HTMLInputElement).value,
                      ) || null}
                    class="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div class="flex-1">
                  <label
                    htmlFor="date"
                    class="block text-sm font-medium text-gray-300"
                  >
                    Date of Infraction/Event:
                  </label>
                  <input
                    ref={dateInputRef}
                    id="date"
                    type="date"
                    value={dateInput.value}
                    onInput={(e) =>
                      dateInput.value = (e.target as HTMLInputElement).value}
                    class="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="url"
                  class="block text-sm font-medium text-gray-300"
                >
                  Related URL (e.g., Manifold comment, market):
                </label>
                <input
                  id="url"
                  type="url"
                  value={urlInput.value}
                  onInput={(e) =>
                    urlInput.value = (e.target as HTMLInputElement).value}
                  placeholder="https://manifold.markets/..."
                  class="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  class="block text-sm font-medium text-gray-300"
                >
                  Description (e.g., "Late repayment of loan #123"):
                </label>
                <textarea
                  id="description"
                  value={descriptionInput.value}
                  onInput={(e) =>
                    descriptionInput.value =
                      (e.target as HTMLTextAreaElement).value}
                  rows={3}
                  class="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                </textarea>
              </div>

              <button
                type="submit"
                class={`w-full py-3 px-4 rounded-md font-semibold text-lg transition-colors duration-200 ${
                  isSubmitting
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Applying Adjustment..."
                  : (modifyingEvent ? "Update Adjustment" : "Apply Adjustment")}
              </button>

              {modifyingEvent && (
                <button
                  type="button"
                  onClick={() => {
                    setModifyingEvent(null);
                    modifierInput.value = null;
                    dateInput.value = new Date().toISOString().split("T")[0];
                    urlInput.value = "";
                    descriptionInput.value = "";
                  }}
                  class="w-full py-2 mt-2 px-4 rounded-md text-sm bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Cancel Modify
                </button>
              )}

              {submitMessage && (
                <p
                  class={`mt-4 text-center text-sm ${
                    submitMessageType === "error"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {submitMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
