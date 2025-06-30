// islands/admin/AdjustmentFormFields.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

export interface OverrideEvent {
  timestamp: number;
  userId: string; // Added userId
  username: string; // Added username
  modifier: number;
  url: string;
  dateOfInfraction: number;
  description: string; // Added description
}

export interface UserScoreOverview {
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

interface AdjustmentFormFieldsProps {
  userOverview: UserScoreOverview | null;
  modifyingEvent: OverrideEvent | null;
  setModifyingEvent: (event: OverrideEvent | null) => void;
  isSubmitting: boolean;
  submitMessage: string | null;
  submitMessageType: "success" | "error" | "";
  onSubmit: (
    payload: {
      userId: string;
      username: string;
      modifier: number;
      url: string;
      dateOfInfraction: number;
      description: string;
      originalTimestamp?: number;
    },
  ) => Promise<void>;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function AdjustmentFormFields(
  {
    userOverview,
    modifyingEvent,
    setModifyingEvent,
    isSubmitting,
    submitMessage,
    submitMessageType,
    onSubmit,
    onSuccess,
    onError,
  }: AdjustmentFormFieldsProps,
) {
  const modifierInput = useSignal<number | null>(null);
  const dateInput = useSignal("");
  const urlInput = useSignal("");
  const descriptionInput = useSignal("");

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modifyingEvent) {
      modifierInput.value = modifyingEvent.modifier;
      dateInput.value = new Date(modifyingEvent.dateOfInfraction).toISOString()
        .split("T")[0];
      urlInput.value = modifyingEvent.url;
      descriptionInput.value = modifyingEvent.description;
    } else {
      modifierInput.value = null;
      urlInput.value = "";
      descriptionInput.value = "";
      if (!dateInput.value && dateInputRef.current) {
        dateInput.value = new Date().toISOString().split("T")[0];
      }
    }
  }, [modifyingEvent]);

  useEffect(() => {
    if (!dateInput.value && dateInputRef.current) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!userOverview || !userOverview.userId) {
      onError("Please select a valid user first.");
      return;
    }
    if (
      modifierInput.value === null || isNaN(modifierInput.value) ||
      !descriptionInput.value || !urlInput.value || !dateInput.value
    ) {
      onError("Please fill all adjustment fields.");
      return;
    }
    const infractionDateTimestamp = new Date(dateInput.value).getTime();
    if (isNaN(infractionDateTimestamp)) {
      onError("Please select a valid date for the infraction.");
      return;
    }

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

    try {
      await onSubmit(payload);
      modifierInput.value = null;
      dateInput.value = new Date().toISOString().split("T")[0];
      urlInput.value = "";
      descriptionInput.value = "";
      setModifyingEvent(null);
      onSuccess();
    } catch (err) {
      onError(
        `Error: ${
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
          disabled={isSubmitting}
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
            descriptionInput.value = (e.target as HTMLTextAreaElement).value}
          rows={3}
          class="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isSubmitting}
        >
        </textarea>
      </div>

      <button
        type="submit"
        class={`w-full py-3 px-4 rounded-md font-semibold text-lg transition-colors duration-200 ${
          isSubmitting || !userOverview
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        disabled={isSubmitting || !userOverview}
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
  );
}
