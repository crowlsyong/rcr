import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks"; // add useRef
import ScoreResult from "./ScoreResult.tsx";
import ShareButton from "./ShareButton.tsx"; // Import the ShareButton

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
      error.value = "Not found";
      scoreData.value = null;
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const urlUsername = params.get("username");
    if (urlUsername) {
      username.value = urlUsername;
      setDebouncedUsername(urlUsername);
    }
    // Focus the input once the component mounts
    inputRef.current?.focus();
  }, []);

  return (
    <div class="w-full max-w-md mx-auto pt-6 pb-6 px-0 sm:px-6">
      <ScoreResult
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={scoreData.value?.riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={!scoreData.value && !error.value}
      />
      <div class="mt-4 relative">
        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          @
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter a manifold username"
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
              <span>✅User found</span>
              <a
                href={`https://manifold.markets/${scoreData.value?.username}`}
                target="_blank"
                class="text-blue-400 hover:underline"
              >
                Visit {scoreData.value.username}'s Manifold page
              </a>
              <div class="ml-auto">
                <ShareButton username={scoreData.value.username} />
              </div>
            </div>
          )
          : <p class="text-gray-400">...</p>}
      </div>
    </div>
  );
}
