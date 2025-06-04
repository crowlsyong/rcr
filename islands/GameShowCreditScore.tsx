// islands/GameShowCreditScore.tsx

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import ScoreResult from "./ScoreResult.tsx";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
  userExists: boolean;
}

interface GameShowCreditScoreProps {
  usernames: string[];
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default function GameShowCreditScore(
  { usernames }: GameShowCreditScoreProps,
) {
  const user1Data = useSignal<CreditScoreData | null>(null);
  const user2Data = useSignal<CreditScoreData | null>(null);
  const user1Error = useSignal<string>("");
  const user2Error = useSignal<string>("");
  const isLoading = useSignal(true);

  async function fetchScoreData(
    user: string,
    dataSignal: typeof user1Data,
    errorSignal: typeof user1Error,
  ) {
    try {
      const res = await fetch(
        `/api/score?username=${encodeURIComponent(user)}`,
      );
      const rawData = await res.json();

      if (rawData.error) {
        errorSignal.value = rawData.error;
        dataSignal.value = null;
      } else if (!rawData.userExists) {
        errorSignal.value = `User '${user}' not found.`;
        dataSignal.value = null;
      } else {
        dataSignal.value = rawData as CreditScoreData;
        errorSignal.value = "";
      }
    } catch (e) {
      const msg = typeof e === "object" && e !== null && "message" in e
        ? (e as { message: string }).message
        : "Unknown error";
      errorSignal.value = `Error fetching data for ${user}: ${msg}`;
      dataSignal.value = null;
      console.error(`Error fetching data for ${user}:`, e);
    }
  }

  useEffect(() => {
    isLoading.value = true;
    user1Data.value = null;
    user2Data.value = null;
    user1Error.value = "";
    user2Error.value = "";

    const initiateFetches = async () => {
      isLoading.value = true;
      // Fetch user 1
      if (usernames[0]) {
        await fetchScoreData(usernames[0], user1Data, user1Error);
      } else {
        user1Data.value = null;
        user1Error.value = "No username provided for Contestant A.";
      }
      // Fetch user 2
      if (usernames[1]) {
        await fetchScoreData(usernames[1], user2Data, user2Error);
      } else {
        user2Data.value = null;
        user2Error.value = "No username provided for Contestant A.";
      }
      isLoading.value = false;
    };

    initiateFetches();
    const intervalId = setInterval(initiateFetches, FIVE_MINUTES_MS);
    return () => clearInterval(intervalId);
  }, [usernames]);

  const hasValidUsers = (usernames.length >= 1 && !!usernames[0]) ||
    (usernames.length >= 2 && !!usernames[1]);
  const hasData = user1Data.value || user2Data.value;

  if (!hasValidUsers) {
    return (
      <div class="flex items-center justify-center min-h-screen text-gray-300">
        Please provide at least two usernames in the URL, e.g.,
        `/gameshow/user1,user2`
      </div>
    );
  }

  return (
    <div
      style="background-color: #0F1729;"
      class="flex flex-col gap-4 md:flex-row w-full max-w-screen-xl mx-auto items-start justify-center"
    >
      {/* Contestant A */}
      <div class="w-full md:w-5/12 flex flex-col items-center">
        <h2 class="text-xl md:text-2xl font-bold text-white mb-4">
          Contestant A
        </h2>
        <div class="w-4/5">
          {isLoading.value && (!hasData)
            ? <p class="text-gray-400">Loading...</p>
            : user1Error.value
            ? <p class="text-red-500 text-center">{user1Error.value}</p>
            : (
              <ScoreResult
                username={user1Data.value?.username || "N/A"}
                creditScore={user1Data.value?.creditScore || 0}
                riskMultiplier={user1Data.value?.riskMultiplier || 0}
                avatarUrl={user1Data.value?.avatarUrl || null}
                isWaiting={false}
                urlPrefix="https://manifold.markets"
              />
            )}
        </div>
      </div>
      {/* Divider */}
      <div class="w-full md:w-auto h-1 md:h-64 bg-gray-700 md:my-0 my-4 md:mx-4">
      </div>{" "}
      {/* Added mx-4 for horizontal spacing */}

      {/* Contestant B */}
      <div class="w-full md:w-5/12 flex flex-col items-center">
        <h2 class="text-xl md:text-2xl font-bold text-white mb-4">
          Contestant B
        </h2>
        <div class="w-4/5">
          {isLoading.value && (!hasData)
            ? <p class="text-gray-400">Loading...</p>
            : user2Error.value
            ? <p class="text-red-500 text-center">{user2Error.value}</p>
            : (
              <ScoreResult
                username={user2Data.value?.username || "N/A"}
                creditScore={user2Data.value?.creditScore || 0}
                riskMultiplier={user2Data.value?.riskMultiplier || 0}
                avatarUrl={user2Data.value?.avatarUrl || null}
                isWaiting={false}
                urlPrefix="https://manifold.markets"
              />
            )}
        </div>
      </div>
    </div>
  );
}
