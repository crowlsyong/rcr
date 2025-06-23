// islands/CreditScore.tsx

import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import ScoreResult from "../creditscore/ScoreResult.tsx";
import ShareButton from "../../buttons/ShareButton.tsx";
import ChartButton from "../../buttons/ChartButton.tsx";

interface CreditScoreData {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
  userExists: boolean;
  fetchSuccess: boolean;
  userDeleted?: boolean;
}

// Function to get the initial username from the URL
function getInitialUsernameFromUrl(): string {
  if (typeof globalThis.location === "undefined") {
    return "";
  }
  const params = new URLSearchParams(globalThis.location.search);
  return params.get("q") || "";
}

export default function CreditScore() {
  const initialUsernameFromUrl = getInitialUsernameFromUrl();
  const username = useSignal(initialUsernameFromUrl);
  const scoreData = useSignal<CreditScoreData | null>(null);
  const error = useSignal<string>("");
  const [debouncedUsername, setDebouncedUsername] = useState(
    initialUsernameFromUrl,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Store the chosen random placeholder for the current session
  const [randomPlaceholder, setRandomPlaceholder] = useState<string | null>(
    null,
  );

  // Derived state: Is the input currently empty (after debounce)?
  const isEmptyInput = debouncedUsername === "";

  // Effect to load example users from JSON and pick a random one
  useEffect(() => {
    async function fetchAndSetRandomExampleUser() {
      try {
        const response = await fetch("/example-users.json");
        if (!response.ok) {
          throw new Error("Failed to fetch example users");
        }
        const users: string[] = await response.json();

        // Pick a random user from the fetched list
        if (users.length > 0) {
          const randomIndex = Math.floor(Math.random() * users.length);
          setRandomPlaceholder(users[randomIndex]);
        } else {
          setRandomPlaceholder("Tumbles"); // Fallback if list is empty
        }
      } catch (e) {
        console.error("Error loading example users:", e);
        setRandomPlaceholder("Tumbles"); // Fallback if fetch fails
      }
    }
    fetchAndSetRandomExampleUser();
  }, []); // Empty dependency array means this runs once on mount

  // Effect for debouncing user input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.value), 200);
    return () => clearTimeout(timer);
  }, [username.value]);

  // Effect for fetching data and updating URL based on debounced username
  useEffect(() => {
    if (debouncedUsername) {
      fetchScoreData(debouncedUsername);
      const url = new URL(globalThis.location.href);
      url.searchParams.set("q", debouncedUsername);
      globalThis.history.replaceState(null, "", url.toString());
    } else {
      resetState();
      const url = new URL(globalThis.location.href);
      url.searchParams.delete("q");
      globalThis.history.replaceState(null, "", url.toString());
    }
  }, [debouncedUsername]);

  function resetState() {
    scoreData.value = null;
    error.value = "";
  }

  async function fetchScoreData(user: string) {
    error.value = "";

    try {
      const res = await fetch(`/api/score?username=${user}`);
      const data: CreditScoreData = await res.json();

      if (res.ok) {
        if (data.userExists) {
          scoreData.value = {
            username: data.username,
            creditScore: data.creditScore,
            riskMultiplier: data.riskMultiplier,
            avatarUrl: data.avatarUrl,
            userExists: true,
            fetchSuccess: true,
            userDeleted: data.userDeleted,
          };
          error.value = "";
        } else {
          scoreData.value = {
            username: user,
            creditScore: 0,
            riskMultiplier: 0,
            avatarUrl: null,
            userExists: false,
            fetchSuccess: true,
            userDeleted: data.userDeleted,
          };
          if (!data.userDeleted) {
            error.value = `User @${user} not found.`;
          } else {
            error.value = "";
          }
        }
      } else {
        type ErrorResponse = { error: string; userDeleted?: boolean };
        const errorMessage =
          (typeof data === "object" && data !== null && "error" in data &&
              typeof (data as ErrorResponse).error === "string"
            ? (data as ErrorResponse).error
            : res.statusText) || "Unknown error";
        error.value = `Error fetching data: ${errorMessage}`;
        scoreData.value = {
          username: user,
          creditScore: 0,
          riskMultiplier: 0,
          avatarUrl: null,
          userExists: false,
          fetchSuccess: false,
          userDeleted: (data as { userDeleted?: boolean }).userDeleted,
        };
      }
    } catch (e) {
      console.error("Fetch error:", e);
      error.value = `An unexpected network error occurred: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`;
      scoreData.value = {
        username: debouncedUsername,
        creditScore: 0,
        riskMultiplier: 0,
        avatarUrl: null,
        userExists: false,
        fetchSuccess: false,
        userDeleted: false,
      };
    }
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isWaiting = !!debouncedUsername && !scoreData.value && !error.value;

  const currentPlaceholder = randomPlaceholder
    ? `Ex. ${randomPlaceholder}`
    : ""; // Fallback if randomPlaceholder is null initially

  return (
    <div class="w-full max-w-md mx-auto pt-6 pb-6 px-0 sm:px-6">
      <ScoreResult
        username={debouncedUsername}
        creditScore={scoreData.value?.creditScore || 0}
        riskMultiplier={scoreData.value?.riskMultiplier || 0}
        avatarUrl={scoreData.value?.avatarUrl || null}
        isWaiting={isWaiting}
        userExists={scoreData.value?.userExists}
        fetchSuccess={scoreData.value?.fetchSuccess}
        isEmptyInput={isEmptyInput}
        userDeleted={scoreData.value?.userDeleted}
      />
      <div class="mt-4 relative group">
        <span
          class="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200"
        >
          @
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder={currentPlaceholder}
          value={username.value}
          onInput={(
            e,
          ) => (username.value = (e.target as HTMLInputElement).value)}
          class="w-full pl-8 p-3 bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="text-center pt-4">
        {isEmptyInput
          ? <p class="text-gray-500">Enter a username to see the score.</p>
          : error.value
          ? <p class="text-red-400">{error.value}</p>
          : scoreData.value?.userExists && !scoreData.value?.userDeleted
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
          : scoreData.value?.userDeleted
          ? (
            <p class="text-yellow-400">
              User @{debouncedUsername} is deleted.
            </p>
          )
          : null}
      </div>
    </div>
  );
}
