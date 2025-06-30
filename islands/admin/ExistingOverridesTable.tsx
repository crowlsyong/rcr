// islands/admin/ExistingOverridesTable.tsx
import { useCallback, useState } from "preact/hooks";
import { OverrideEvent } from "./AdjustmentFormFields.tsx"; // Removed UserScoreOverview import

interface ExistingOverridesTableProps {
  overrideEvents: OverrideEvent[];
  userId: string;
  username: string;
  isLoadingParent: boolean;
  onDeleteSuccess: () => void;
  onModify: (event: OverrideEvent) => void;
}

export default function ExistingOverridesTable({
  overrideEvents,
  userId,
  username,
  isLoadingParent,
  onDeleteSuccess,
  onModify,
}: ExistingOverridesTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<Record<number, boolean>>(
    {},
  );

  const handleDelete = useCallback(async (eventToDelete: OverrideEvent) => {
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

    console.log("[ExistingOverridesTable] Deleting override:", eventToDelete);
    try {
      const response = await fetch("/api/v0/admin/delete-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          timestamp: eventToDelete.timestamp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete adjustment.");
      }
      console.log("[ExistingOverridesTable] Override deleted successfully.");
      setConfirmDelete({});
      onDeleteSuccess();
    } catch (err) {
      console.error(
        `[ExistingOverridesTable] Error deleting override: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message: string }).message
            : String(err)
        }`,
      );
    }
  }, [userId, onDeleteSuccess, confirmDelete]);

  const handleModifyClick = useCallback((event: OverrideEvent) => {
    onModify(event);
  }, [onModify]);

  const formatTimestampToDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  if (overrideEvents.length === 0) {
    return (
      <div class="p-4 bg-gray-800 rounded-lg shadow-inner border border-gray-700">
        <h4 class="text-md font-semibold text-white mb-4">
          Existing Overrides for @{username}:
        </h4>
        <p class="text-gray-400 text-sm">
          No existing overrides for this user.
        </p>
      </div>
    );
  }

  return (
    <div class="p-4 bg-gray-800 rounded-lg shadow-inner border border-gray-700">
      <h4 class="text-md font-semibold text-white mb-4">
        Existing Overrides for @{username}:
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
            {overrideEvents.map((event) => (
              <tr key={event.timestamp} class="hover:bg-gray-700">
                <td class="px-4 py-2 text-xxs text-gray-200">
                  {formatTimestampToDate(event.dateOfInfraction)}
                </td>
                <td class="px-4 py-2 text-xxs text-gray-200">
                  {event.modifier > 0 ? `+${event.modifier}` : event.modifier}
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
                      handleModifyClick(event)}
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
  );
}
