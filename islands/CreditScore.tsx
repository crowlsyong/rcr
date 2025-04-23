import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import ScoreResult from "./ScoreResult.tsx"; // Import your result box

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
}

export default function CreditScore() {
  const username = useSignal("");
  const scoreData = useSignal<CreditScoreData | null>(null);
  const error = useSignal<string>("");

  const [debouncedUsername, setDebouncedUsername] = useState("");

  // Set up effect to listen for changes in the username field
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 100);
    return () => clearTimeout(timer);
  }, [username.value]);

  // Fetch score data if username changes
  useEffect(() => {
    if (debouncedUsername) fetchScoreData(debouncedUsername);
    else resetState(); // Reset state when the textbox is cleared
  }, [debouncedUsername]);

  // Reset state to waiting
  function resetState() {
    scoreData.value = null;
    error.value = "";
  }

  // Fetch the score data from the backend
  async function fetchScoreData(user: string) {
    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data = await res.json();
      if (data.error) {
        error.value = data.error;
        scoreData.value = null;
      } else {
        scoreData.value = data;
        error.value = ""; // Clear any previous error
      }
    } catch {
      error.value = "An error occurred while fetching data.";
      scoreData.value = null;
    }
  }

  // URL parsing to fetch the username from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUsername = params.get("username");
    if (urlUsername) {
      username.value = urlUsername;
      setDebouncedUsername(urlUsername); // Update debouncedUsername to trigger the fetch
    }
  }, []);

  return (
    <div class="w-full max-w-md mx-auto p-6">
      <ScoreResult
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={scoreData.value?.riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null} // Pass the avatar URL here
        isWaiting={!scoreData.value && !error.value} // Check if still waiting
      />

      <div class="mt-4">
        <input
          type="text"
          placeholder="Enter username"
          value={username.value}
          onInput={(
            e,
          ) => (username.value = (e.target as HTMLInputElement).value)}
          class="w-full p-3 mb-4 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Always render the error container or success message */}
      <div class="text-center mt-2">
        {error.value
          ? <p class="text-red-400">{error.value}</p>
          : scoreData.value
          ? (
            <p class="text-green-400">
              ✅User found
              <a
                href={`https://manifold.markets/${scoreData.value?.username}`}
                target="_blank"
                class="text-blue-400 hover:underline ml-2"
              >
                Visit {scoreData.value.username}'s Manifold page
              </a>
            </p> // Green message with clickable link when user is found
          )
          : (
            <p class="text-gray-400">To type something...</p> // Default waiting message
          )}
      </div>
    </div>
  );
}
