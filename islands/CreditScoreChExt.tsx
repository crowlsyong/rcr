import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
// import ScoreResult from "./ScoreResult.tsx";
import ScoreResultChExt from "./ScoreResultsChExt.tsx";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
}

interface CreditScoreProps {
  username: string;
}

export default function CreditScore({ username }: CreditScoreProps) {
  const scoreData = useSignal<CreditScoreData | null>(null);
  const error = useSignal<string>("");

  useEffect(() => {
    if (username) fetchScoreData(username);
    else resetState();
  }, [username]);

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

  return (
    <div
      style="background-color: #0F1729;"
      class="w-full h-full max-w-md mx-auto px-0 sm:px-6"
    >
      <ScoreResultChExt
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={scoreData.value?.riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={!scoreData.value && !error.value}
      />
      {
        /* Input field for username
      <div class="text-center pt-4">
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
          : <p class="text-gray-400">...</p>}
      </div>
      */
      }
    </div>
  );
}
