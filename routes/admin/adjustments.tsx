// routes/admin/adjustments.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import AdjustmentForm from "../../islands/admin/AdjustmentForm.tsx"; // Import the AdjustmentForm island
import { AdminState } from "../_middleware.ts"; // Import AdminState from the middleware

// The handler for this Fresh page.
// It simply renders the page, letting the client-side island handle data fetching.
export const handler: Handlers<null, AdminState> = {
  // FIXED: Removed 'async' keyword as there is no 'await' expression
  GET(_req, ctx) {
    // The middleware already sets ctx.state.isAdmin and ctx.state.githubLogin.
    // We just pass null for data, as the AdjustmentForm island fetches its own data.
    return ctx.render(null);
  },
};

// The default component for the /admin/adjustments page.
export default function AdminAdjustmentsPage(
  { state }: PageProps<null, AdminState>, // PageProps receives state from middleware
) {
  const { isAdmin, githubLogin } = state;

  return (
    <div class="pt-16 p-4 mx-auto max-w-screen-lg">
      <div class="flex justify-end mb-6 items-center">
        {/* Conditional rendering for admin login/logout status */}
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
        Admin Panel - Adjust User Scores
      </h1>

      {/* Conditional rendering based on isAdmin status */}
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
          // If admin, render the AdjustmentForm island.
          // This island will handle all user searching, data display, and adjustment submission.
          <AdjustmentForm />
        )}
    </div>
  );
}
