// routes/admin/index.tsx
/// <reference lib="deno.unstable" />

import { PageProps } from "fresh";
import db from "../../database/db.ts";
import { AdminState } from "../_middleware.ts";

interface DisplayKvEntry {
  key: Deno.KvKey;
  value: unknown;
  versionstamp: string;
}

interface AdminPageData {
  entries: DisplayKvEntry[];
  error?: string;
}

export async function handler(ctx: PageProps<AdminPageData, AdminState>) {
  if (!ctx.state.isAdmin) {
    return { data: { entries: [] } };
  }

  const entries: DisplayKvEntry[] = [];
  let error: string | undefined;

  try {
    const MAX_ENTRIES_TO_DISPLAY = 40;

    for await (
      const entry of db.list({ prefix: [] }, {
        limit: MAX_ENTRIES_TO_DISPLAY,
        reverse: true,
      })
    ) {
      entries.push({
        key: entry.key,
        value: entry.value,
        versionstamp: entry.versionstamp,
      });
    }
  } catch (err) {
    console.error("Error fetching KV data for admin panel:", err);
    error = `An error occurred while fetching database entries: ${
      typeof err === "object" && err !== null && "message" in err
        ? (err as { message: string }).message
        : String(err)
    }`;
  }

  return { data: { entries, error } };
}

export default function AdminPage(
  { data, state }: PageProps<AdminPageData, AdminState>,
) {
  const { entries, error } = data;
  const { isAdmin, githubLogin } = state;

  return (
    <div class="pt-16 p-4 mx-auto max-w-5xl">
      <div class="flex justify-end mb-6 items-center">
        {isAdmin
          ? (
            <>
              <span class="text-gray-300 mr-3">Welcome, {githubLogin}!</span>
              <a
                href="/auth/signout"
                class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150"
              >
                Sign Out
              </a>
            </>
          )
          : (
            <a
              href="/auth/signin"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150"
            >
              Sign In with GitHub
            </a>
          )}
      </div>

      <h1 class="text-2xl font-bold mb-6 text-white">
        Admin Panel - Deno KV Data
      </h1>

      {!isAdmin
        ? (
          <div class="text-center bg-gray-800 p-6 rounded-lg shadow-xl">
            <p class="text-xl text-yellow-400 mb-2">Access Restricted</p>
            <p class="text-gray-300">
              Please sign in with an authorized GitHub account to view this
              content.
            </p>
          </div>
        )
        : (
          <>
            {error && (
              <p class="text-red-500 mb-4 bg-red-900 p-3 rounded">{error}</p>
            )}
            {entries.length === 0 && !error
              ? <p class="text-gray-400">No entries found in the database.</p>
              : (
                <div class="overflow-x-auto">
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
                        <tr
                          key={JSON.stringify(entry.key)}
                          class="hover:bg-gray-700 transition-colors duration-150"
                        >
                          <td class="px-4 py-4 whitespace-pre-wrap text-sm font-medium text-gray-200">
                            {JSON.stringify(entry.key)}
                          </td>
                          <td class="px-4 py-4 whitespace-pre-wrap text-sm text-gray-300">
                            {JSON.stringify(entry.value, null, 2)}
                          </td>
                          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                            {entry.versionstamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}
    </div>
  );
}
