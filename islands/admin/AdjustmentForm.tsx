// islands/admin/AdjustmentForm.tsx
import { useCallback, useEffect, useState } from "preact/hooks";
import UsernameInput from "../shared/UsernameInput.tsx";
import UserAdjustmentDisplay from "./UserAdjustmentDisplay.tsx";
import AdjustmentFormFields from "./AdjustmentFormFields.tsx";
import ExistingOverridesTable from "./ExistingOverridesTable.tsx"; // NEW: Import it here for its own section
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(globalThis.location.href);
      if (debouncedSearchUsername) {
        url.searchParams.set("q", debouncedSearchUsername);
      } else {
        url.searchParams.delete("q");
      }
      globalThis.history.replaceState(null, "", url.toString());
    }
  }, [debouncedSearchUsername]);

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

  const handleUserOverviewFetched = useCallback(
    (user: UserScoreOverview | null) => {
      console.log("[AdjustmentForm] User overview fetched:", user);
      // We no longer set modifyingEvent here based on initial fetch.
      // ModifyingEvent is set ONLY when "Modify" button in table is clicked.
      setSelectedUserOverview(user);
      setSubmitMessage(null);
      setSubmitMessageType("");
    },
    [],
  );

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

      setModifyingEvent(null); // Clear modifying state after successful submit
      setRefreshDisplayTrigger((prev) => prev + 1); // Trigger refresh

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
    // This is now redundant since handleFormSubmit already triggers refreshDisplayTrigger
  }, []);

  const handleUserDisplayRefreshNeeded = useCallback(() => {
    console.log("[AdjustmentForm] User display requested refresh.");
    setRefreshDisplayTrigger((prev) => prev + 1);
  }, []);

  const handleFormFieldError = useCallback((message: string) => {
    console.error("[AdjustmentForm] Form fields reported error:", message);
    setSubmitMessage(message);
    setSubmitMessageType("error");
  }, []);

  const handleModifyEventFromTable = useCallback((event: OverrideEvent) => {
    console.log("[AdjustmentForm] Received modify event from table:", event);
    setModifyingEvent(event); // Set the event to modify
  }, []);

  return (
    <div class="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700">
      <div class="mb-6">
        <UsernameInput
          initialValue={initialUsername}
          onDebouncedChange={handleDebouncedUsernameChange}
          isFetching={isSubmitting} // isSubmitting disables input while submitting
        />
      </div>

      {/* Main layout grid for Current User Status + Adjustment Form */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Current User Status Display (which now includes chart) */}
        <div>
          <UserAdjustmentDisplay
            debouncedUsername={debouncedSearchUsername}
            onUserOverviewFetched={handleUserOverviewFetched}
            isLoadingParent={isSubmitting}
            refreshTrigger={refreshDisplayTrigger}
            onDeleteSuccess={handleUserDisplayRefreshNeeded} // Passes through
            onModify={handleModifyEventFromTable} // Passes through
          />
        </div>

        {/* Right Column: Adjustment Form Fields */}
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
            <div class="flex items-center justify-center bg-gray-800 p-6 rounded-lg border border-gray-700 h-full">
              <p class="text-gray-400 text-center">
                Search for a user on the left to add or modify adjustments.
              </p>
            </div>
          )}
      </div>

      {/* NEW: Full-width row for Existing Overrides Table */}
      {selectedUserOverview && !selectedUserOverview.userDeleted &&
          selectedUserOverview.existingOverrideEvents.length > 0
        ? (
          <div class="mt-8 pt-8 border-t border-gray-700">
            {/* Added mt-8 pt-8 border-t for visual separation */}
            <ExistingOverridesTable
              overrideEvents={selectedUserOverview.existingOverrideEvents}
              userId={selectedUserOverview.userId}
              username={selectedUserOverview.username}
              isLoadingParent={isSubmitting} // Pass overall submission state
              onDeleteSuccess={handleUserDisplayRefreshNeeded} // Call the central refresh trigger
              onModify={handleModifyEventFromTable} // Call the central modify event handler
            />
          </div>
        )
        : selectedUserOverview && !selectedUserOverview.userDeleted &&
            selectedUserOverview.existingOverrideEvents.length === 0
        ? (
          <div class="mt-8 pt-8 border-t border-gray-700">
            {/* Consistent spacing/border for "No overrides" message */}
            <div class="p-4 bg-gray-800 rounded-lg shadow-inner border border-gray-700">
              <h4 class="text-md font-semibold text-white mb-4">
                Existing Overrides for @{selectedUserOverview.username}:
              </h4>
              <p class="text-gray-400 text-sm">
                No existing overrides for this user.
              </p>
            </div>
          </div>
        )
        : null}

      {selectedUserOverview?.userDeleted && (
        <div class="mt-6 w-full flex items-center justify-center bg-yellow-900/20 p-6 rounded-lg border border-yellow-700">
          <p class="text-yellow-400 text-center">
            User {selectedUserOverview.username}{" "}
            is deleted and cannot be adjusted.
          </p>
        </div>
      )}
    </div>
  );
}
