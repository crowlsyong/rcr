// islands/CreditScore.tsx

import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import ScoreResult from "./ScoreResult.tsx";
import ShareButton from "./buttons/ShareButton.tsx";
import ChartButton from "./buttons/ChartButton.tsx";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
}

// Function to get the initial username from the URL (for use during component initialization)
function getInitialUsernameFromUrl(): string {
  // Check if running in a browser environment (client-side)
  if (typeof globalThis.location === "undefined") {
    return ""; // Return empty string during server-side rendering
  }
  const params = new URLSearchParams(globalThis.location.search);
  return params.get("q") || "";
}

export default function CreditScore() {
  // Get the initial username directly when defining state
  const initialUsernameFromUrl = getInitialUsernameFromUrl();

  const username = useSignal(initialUsernameFromUrl); // Initialize signal with URL username
  const scoreData = useSignal<CreditScoreData | null>(null);
  const error = useSignal<string>("");
  const [debouncedUsername, setDebouncedUsername] = useState(
    initialUsernameFromUrl,
  ); // Initialize state with URL username
  const inputRef = useRef<HTMLInputElement>(null);

  // Effect for debouncing user input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 200);
    return () => clearTimeout(timer);
  }, [username.value]);

  // Effect for fetching data and updating URL based on debounced username (Keep this as is for now)
  useEffect(() => {
    // This effect will be triggered initially because debouncedUsername is set with the URL username
    if (debouncedUsername) {
      fetchScoreData(debouncedUsername);
      // Update the URL with the debounced username as a query parameter
      const url = new URL(globalThis.location.href);
      url.searchParams.set("q", debouncedUsername);
      // Use replaceState to avoid cluttering the browser history
      globalThis.history.replaceState(null, "", url.toString());
    } else {
      resetState();
      // Remove the query parameter from the URL when the input is empty
      const url = new URL(globalThis.location.href);
      url.searchParams.delete("q");
      globalThis.history.replaceState(null, "", url.toString());
    }
  }, [debouncedUsername]); // This effect runs when debouncedUsername changes

  function resetState() {
    scoreData.value = null;
    error.value = "";
  }

  async function fetchScoreData(user: string) {
    // Ensure we don't fetch for an empty username
    if (!user) {
      resetState();
      return;
    }
    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data: CreditScoreData | { error: string } = await res.json();
      if ("error" in data) {
        error.value = data.error;
        scoreData.value = null;
      } else {
        scoreData.value = data;
        error.value = "";
      }
    } catch (e) {
      console.error("Fetch error:", e);
      error.value = "An error occurred fetching data.";
      scoreData.value = null;
    }
  }

  // Removed the redundant useEffect that ran on mount to read URL params

  useEffect(() => {
    // Focus the input once the component mounts
    inputRef.current?.focus();
  }, []);

  return (
    <div class="w-full max-w-md mx-auto pt-6 pb-6 px-0 sm:px-6">
      {/* ScoreResult remains the same for now */}
      <ScoreResult
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={scoreData.value?.riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={!scoreData.value && !error.value} // isWaiting logic might need refinement depending on desired initial state
      />
      <div class="mt-4 relative">
        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          @
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Ex. Tumbles"
          value={username.value}
          onInput={(
            e,
          ) => (username.value = (e.target as HTMLInputElement).value)}
          class="w-full pl-8 p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="text-center pt-4">
        {error.value
          ? <p class="text-red-400">{error.value}</p>
          : scoreData.value
          ? (
            <div class="flex flex-wrap justify-center items-center gap-2 text-xs text-green-400">
              <span>✅</span>
              <a
                href={`https://manifold.markets/${scoreData.value?.username}`}
                target="_blank"
                class="text-blue-400 hover:underline"
              >
                Visit {scoreData.value.username}'s Manifold page
              </a>
              <div class="flex items-center gap-2 ml-auto">
                <ChartButton username={scoreData.value.username} />
                <ShareButton username={scoreData.value.username} />
              </div>
            </div>
          )
          : null}
      </div>
    </div>
  );
}
