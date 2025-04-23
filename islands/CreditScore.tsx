import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks"; // add useRef
import ScoreResult from "./ScoreResult.tsx";

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
  const inputRef = useRef<HTMLInputElement>(null); // create ref for input

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 100);
    return () => clearTimeout(timer);
  }, [username.value]);

  useEffect(() => {
    if (debouncedUsername) fetchScoreData(debouncedUsername);
    else resetState();
  }, [debouncedUsername]);

  function resetState() {
    scoreData.value = null;
    error.value = "";
  }

  async function fetchScoreData(user: string) {
    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data = await res.json();
      if (data.error) {
        error.value = data.error;
        scoreData.value = null;
      } else {
        scoreData.value = data;
        error.value = "";
      }
    } catch {
      error.value = "An error occurred while fetching data.";
      scoreData.value = null;
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUsername = params.get("username");
    if (urlUsername) {
      username.value = urlUsername;
      setDebouncedUsername(urlUsername);
    }
    // Focus the input once the component mounts
    inputRef.current?.focus();
  }, []);

  return (
    <div class="w-full max-w-md mx-auto p-6">
      <ScoreResult
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={scoreData.value?.riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={!scoreData.value && !error.value}
      />

      <div class="mt-4">
        <input
          ref={inputRef} // attach the ref here
          type="text"
          placeholder="Enter username"
          value={username.value}
          onInput={(e) => (username.value = (e.target as HTMLInputElement).value)}
          class="w-full p-3 mb-4 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
            </p>
          )
          : (
            <p class="text-gray-400">To type something...</p>
          )}
      </div>
    </div>
  );
}
