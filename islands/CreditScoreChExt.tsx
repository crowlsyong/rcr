// islands/CreditScoreChExt.tsx

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import ScoreResult from "./ScoreResult.tsx";

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
      <ScoreResult
        username={scoreData.value?.username || "N/A"}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={scoreData.value?.riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={!scoreData.value && !error.value}
        urlPrefix="https://manifold.markets"
      />
    </div>
  );
}
