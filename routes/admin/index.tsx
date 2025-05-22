/// <reference lib="deno.unstable" />
// routes/admin/index.tsx

import { Handlers, PageProps } from "$fresh/server.ts";
import db from "../../db.ts"; // Import your database instance

// Define interface for a KV entry for display
interface DisplayKvEntry {
  key: Deno.KvKey; // The key of the entry
  value: unknown; // The value (can be various types)
  versionstamp: string; // Versionstamp
}

// Define interface for the data passed to the page
interface AdminPageData {
  entries: DisplayKvEntry[]; // Array of KV entries
  error?: string; // Optional error message
}

export const handler: Handlers<AdminPageData> = {
  async GET(_req, ctx): Promise<Response> {
    const entries: DisplayKvEntry[] = [];

    try {
      // List all entries in the database
      // An empty prefix {} means list all entries
      for await (const entry of db.list({ prefix: [] })) {
        entries.push({
          key: entry.key,
          value: entry.value,
          versionstamp: entry.versionstamp,
        });
      }

      // Render the page with the fetched entries
      return ctx.render({ entries });
    } catch (error) {
      console.error("Error fetching KV data for admin panel:", error);
      // Render the page with an error message
      return ctx.render({
        entries: [], // Return empty array on error
        error: "An error occurred while fetching database entries.",
      }, { status: 500 }); // Return a 500 status
    }
  },
};

export default function AdminPage({ data }: PageProps<AdminPageData>) {
  const { entries, error } = data;

  return (
    <div class="pt-16 p-4 mx-auto max-w-screen-lg">
      {/* Added padding and max-width */}
      <h1 class="text-2xl font-bold mb-6 text-white">
        Admin Panel - Deno KV Data
      </h1>

      {error && <p class="text-red-500 mb-4">{error}</p>}

      {entries.length === 0 && !error
        ? <p class="text-gray-400">No entries found in the database.</p>
        : (
          <div class="overflow-x-auto">
            {/* Make table scrollable on small screens */}
            <table class="min-w-full bg-gray-800 rounded-lg shadow-xl">
              <thead>
                <tr class="w-full border-b border-gray-700">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Key
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Versionstamp
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                {entries.map((entry) => (
                  <tr key={JSON.stringify(entry.key)} class="hover:bg-gray-700">
                    <td class="px-4 py-4 whitespace-pre-wrap text-sm font-medium text-gray-200">
                      {JSON.stringify(entry.key)}
                    </td>{" "}
                    {/* Use pre-wrap for keys */}
                    <td class="px-4 py-4 whitespace-pre-wrap text-sm text-gray-300">
                      {JSON.stringify(entry.value, null, 2)}
                    </td>{" "}
                    {/* Use pre-wrap for values, format JSON */}
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                      {entry.versionstamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// Note: For production, you would ABSOLUTELY want to implement
// authentication/authorization here to protect this route.
// This is a basic example for demonstration purposes.
