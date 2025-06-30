// islands/admin/AdjustmentForm.tsx
import { useState, useCallback } from "preact/hooks";
import UsernameInput from "../shared/UsernameInput.tsx";
import UserAdjustmentDisplay from "./UserAdjustmentDisplay.tsx";
import AdjustmentFormFields from "./AdjustmentFormFields.tsx";
import { OverrideEvent, UserScoreOverview } from "./AdjustmentFormFields.tsx";

function getInitialUsernameFromUrl(): string {
  if (typeof globalThis.location === "undefined") {
    return "";
  }
  const params = new URLSearchParams(globalThis.location.search);
  return params.get("q") || "";
}

export default function AdjustmentForm() {
  const initialUsername = getInitialUsernameFromUrl();
  const [debouncedSearchUsername, setDebouncedSearchUsername] = useState(
    initialUsername,
  );
  const [selectedUserOverview, setSelectedUserOverview] = useState<
    UserScoreOverview | null
  >(null);
  const [modifyingEvent, setModifyingEvent] = useState<OverrideEvent | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitMessageType, setSubmitMessageType] = useState<
    "success" | "error" | ""
  >("");

  const [refreshDisplayTrigger, setRefreshDisplayTrigger] = useState(0);

  const handleDebouncedUsernameChange = useCallback((value: string) => {
    console.log(
      "[AdjustmentForm] Debounced username received from UsernameInput:",
      value,
    );
    setDebouncedSearchUsername(value);
    setModifyingEvent(null);
    setSubmitMessage(null);
    setSubmitMessageType("");
  }, []);

  const handleUserOverviewFetched = useCallback((user: UserScoreOverview | null) => {
    console.log("[AdjustmentForm] User overview fetched:", user);
    if (user && (user as UserScoreOverview & { modifyingEvent?: OverrideEvent })
        .modifyingEvent) {
      setModifyingEvent(
        (user as UserScoreOverview & { modifyingEvent: OverrideEvent })
          .modifyingEvent,
      );
    } else {
      setModifyingEvent(null);
    }
    setSelectedUserOverview(user);
    setSubmitMessage(null);
    setSubmitMessageType("");
  }, []);

  const handleFormSubmit = async (
    payload: {
      userId: string;
      username: string;
      modifier: number;
      url: string;
      dateOfInfraction: number;
      description: string;
      originalTimestamp?: number;
    },
  ) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitMessageType("");
    console.log("[AdjustmentForm] Submitting form with payload:", payload);

    try {
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
      } catch (_parseError) {
        throw new Error(
          `API Error: Unexpected response format. Received non-JSON: "${
            rawResponseText.substring(0, 100)
          }..."`,
        );
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
      console.log("[AdjustmentForm] Form submitted successfully.");

      setModifyingEvent(null);
      setRefreshDisplayTrigger((prev) => prev + 1);

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      const errorMessage = `Error: ${
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : String(err)
      }`;
      setSubmitMessage(errorMessage);
      setSubmitMessageType("error");
      console.error("[AdjustmentForm] Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormFieldSuccess = useCallback(() => {
    console.log("[AdjustmentForm] Form fields reported success.");
    setRefreshDisplayTrigger((prev) => prev + 1);
  }, []);

  const handleFormFieldError = useCallback((message: string) => {
    console.error("[AdjustmentForm] Form fields reported error:", message);
    setSubmitMessage(message);
    setSubmitMessageType("error");
  }, []);

  return (
    <div class="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700">
      <h2 class="text-xl font-bold mb-6 text-white">Adjust User Score</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <UsernameInput
            initialValue={initialUsername}
            onDebouncedChange={handleDebouncedUsernameChange}
            isFetching={isSubmitting} // Changed isDisabled to isFetching
          />
          <UserAdjustmentDisplay
            debouncedUsername={debouncedSearchUsername}
            onUserOverviewFetched={handleUserOverviewFetched}
            isLoadingParent={isSubmitting}
            refreshTrigger={refreshDisplayTrigger}
          />
        </div>

        {selectedUserOverview && !selectedUserOverview.userDeleted
          ? (
            <AdjustmentFormFields
              userOverview={selectedUserOverview}
              modifyingEvent={modifyingEvent}
              setModifyingEvent={setModifyingEvent}
              isSubmitting={isSubmitting}
              submitMessage={submitMessage}
              submitMessageType={submitMessageType}
              onSubmit={handleFormSubmit}
              onSuccess={handleFormFieldSuccess}
              onError={handleFormFieldError}
            />
          )
          : (
            <div class="flex items-center justify-center bg-gray-800 p-6 rounded-lg border border-gray-700">
              <p class="text-gray-400 text-center">
                Search for a user on the left to add or modify adjustments.
              </p>
            </div>
          )}
        {selectedUserOverview?.userDeleted && (
          <div class="flex items-center justify-center bg-yellow-900/20 p-6 rounded-lg border border-yellow-700">
            <p class="text-yellow-400 text-center">
              User {selectedUserOverview.username} is deleted and cannot be
              adjusted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
