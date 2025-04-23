// islands/CreditScore.tsx
import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
}

export default function CreditScore() {
  const username = useSignal(""); // The username input
  const scoreData = useSignal<CreditScoreData | null>(null);
  const error = useSignal<string>(""); // For error handling

  // Local state to handle debouncing
  const [debouncedUsername, setDebouncedUsername] = useState("");

  // Set up a debounce to trigger after typing stops for 100ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username.value);
    }, 100);

    return () => clearTimeout(timer); // Clean up the timer on re-render
  }, [username.value]);

  // Fetch data when the debounced username changes
  useEffect(() => {
    if (debouncedUsername) {
      fetchScoreData(debouncedUsername);
    }
  }, [debouncedUsername]);

  const fetchScoreData = async (user: string) => {
    if (!user) {
      error.value = "Please enter a username.";
      return;
    }

    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data = await res.json();

      if (data.error) {
        error.value = data.error;
      } else {
        scoreData.value = data;
        error.value = ""; // Clear any previous errors
      }
    } catch (err) {
      error.value = "An error occurred while fetching data.";
    }
  };

  return (
    <div class="w-full max-w-md mx-auto flex flex-col items-center justify-center bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
      <input
        type="text"
        placeholder="Enter username to fetch credit score"
        value={username.value}
        onInput={(e) => username.value = (e.target as HTMLInputElement).value}
        class="w-full p-3 mb-4 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p class="text-sm text-gray-400 mt-1">Usernames are case sensitive</p>
      {error.value && <p class="mt-4 text-red-400 text-center">{error.value}</p>}

      {scoreData.value && !error.value && (
        <div class="mt-6 text-center text-lg text-white">
          <h3 class="font-semibold">Credit Score for {scoreData.value.username}</h3>
          <p>Credit Score: {scoreData.value.creditScore}</p>
          <p>Risk Multiplier: {scoreData.value.riskMultiplier}</p>
        </div>
      )}
    </div>
  );
}
