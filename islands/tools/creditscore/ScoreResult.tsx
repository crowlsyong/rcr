// islands/ScoreResult.tsx
import { TbExternalLink } from "@preact-icons/tb";
import { getRiskLevelText, getScoreColor } from "../../../utils/score_utils.ts";
import type { CSSProperties } from "preact/compat"; // Import CSSProperties for inline styles

// Casting
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

interface ScoreResultProps {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
  isWaiting: boolean;
  userExists?: boolean;
  fetchSuccess?: boolean;
  isEmptyInput?: boolean;
  urlPrefix?: string; // optional override
  userDeleted?: boolean;
}

// Casted icon component
const ExternalLinkIcon = TbExternalLink as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

export default function ScoreResult({
  username,
  creditScore,
  riskMultiplier,
  avatarUrl,
  isWaiting,
  userExists = true,
  fetchSuccess = true,
  isEmptyInput = false,
  urlPrefix = "https://manifold.markets",
  userDeleted = false,
}: ScoreResultProps) {
  // --- Declare state determination variables here ---
  let isUserNotFound: boolean;
  let isFetchFailed: boolean;
  let isDataAvailable: boolean;
  let isUserDeleted: boolean;

  // Determine display values and styling based on state
  let displayRiskText: string;
  let displayCreditScore: number | string;
  let displayUsername: string;
  let displayColor: string;
  let displayAvatarUrl: string | null = null;

  // --- Prioritize isEmptyInput state ---
  if (isEmptyInput) {
    isUserNotFound = false;
    isFetchFailed = false;
    isDataAvailable = false;
    isUserDeleted = false;

    displayRiskText = "Incomprehensible";
    displayCreditScore = "---";
    displayUsername = "Enter username";
    displayColor = "rgb(55, 65, 81)"; // Tailwind gray-700 as RGB
  } // --- Then check other states ONLY if input is NOT empty ---
  else {
    // Determine the isUserDeleted state first if userExists and fetchSuccess are true
    isUserDeleted = !isWaiting && userExists && fetchSuccess && userDeleted;

    // Now determine other states, considering if the user is deleted
    isUserNotFound = !isWaiting && !userExists && fetchSuccess;
    isFetchFailed = !isWaiting && !fetchSuccess;
    isDataAvailable = !isWaiting && userExists && fetchSuccess && !userDeleted; // Data is available only if not deleted

    if (isWaiting) {
      displayRiskText = "Checking...";
      displayCreditScore = "...";
      displayUsername = username || "Loading...";
      displayColor = "rgb(107, 114, 128)"; // Tailwind gray-500 as RGB
    } else if (isUserDeleted) {
      displayRiskText = "N/A (User Deleted)";
      displayCreditScore = creditScore;
      displayUsername = `${username} (Deleted)`;
      displayColor = "rgb(100, 100, 100)"; // Tailwind gray-600 as RGB
      displayAvatarUrl = avatarUrl;
    } else if (isUserNotFound) {
      displayRiskText = "Impossible";
      displayCreditScore = "N/A";
      displayUsername = username || "User not found";
      displayColor = "rgb(75, 85, 99)"; // Tailwind gray-600 as RGB
    } else if (isFetchFailed) {
      displayRiskText = "Error";
      displayCreditScore = "Error";
      displayUsername = username || "Error";
      displayColor = "rgb(185, 28, 28)"; // Tailwind red-700 as RGB
    } else if (isDataAvailable) {
      displayRiskText = getRiskLevelText(creditScore);
      displayCreditScore = creditScore;
      displayUsername = username;
      displayColor = getScoreColor(creditScore); // Get dynamic color from utils/score_utils.ts
      displayAvatarUrl = avatarUrl;
    } else {
      // Fallback state
      displayRiskText = "Unknown State";
      displayCreditScore = "?";
      displayUsername = username || "Unknown User";
      displayColor = "rgb(0, 0, 0)";
      isUserNotFound = false;
      isFetchFailed = false;
      isDataAvailable = false;
      isUserDeleted = false;
    }
  }

  // Determine border color based on state
  const borderColor: string = displayColor;

  const containerStyle: CSSProperties = {
    borderColor: borderColor,
    borderWidth: "2px",
    borderStyle: "solid",
  };

  // Make clickable only if data is available (not deleted, not not found, etc.)
  const isClickable = isDataAvailable && username && username !== "nouserfound";

  // Combine base and interactive classes
  const containerClasses =
    `block p-4 md:p-6 rounded-lg bg-slate-900 text-white transition-all duration-200 ${
      isClickable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
    }`;

  const content = (
    <div class="flex-col items-center">
      <div class="flex items-center mb-4">
        {displayAvatarUrl
          ? (
            <img
              src={displayAvatarUrl}
              alt={`${displayUsername}'s avatar`}
              class="w-12 h-12 rounded-full mr-2"
            />
          )
          : <div class="w-12 h-12 rounded-full bg-gray-500 mr-4" />}
        <div>
          <h2 class="text-xl font-semibold">{displayUsername}</h2>
          {/* Only show risk multiplier if data is available (not deleted) */}
          {isDataAvailable
            ? (
              <p class="text-xs">
                Base Insurance Fee: {(riskMultiplier * 100).toFixed(0)}%
              </p>
            )
            : null}
        </div>
        <div class="flex flex-col mt-2 text-right ml-auto">
          <span class="text-xs text-gray-400">Credit Score:</span>
          {/* Apply dynamic color using inline style */}
          <span class="text-3xl font-bold" style={{ color: displayColor }}>
            {displayCreditScore}
          </span>
        </div>
      </div>
      <div
        class="mt-3 px-3 py-2 rounded-md relative"
        // Apply dynamic background color using inline style
        style={{ backgroundColor: displayColor }}
      >
        <div
          class="absolute inset-0 bg-black opacity-40 rounded-md"
          aria-hidden="true"
        />
        <div class="relative z-10">
          <p class="text-xs text-gray-100">Lending to this user is</p>
          <p class="text-sm text-white font-semibold">
            {displayRiskText}
          </p>
        </div>
        {/* Only show link icon if clickable */}
        {isClickable
          ? (
            <ExternalLinkIcon class="absolute top-4 right-2 w-5 h-5 text-white" />
          )
          : null}
      </div>
    </div>
  );

  // Render as an anchor tag if clickable, otherwise a div
  return isClickable
    ? (
      <a
        href={`${urlPrefix}/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        class={containerClasses}
        style={containerStyle}
      >
        {content}
      </a>
    )
    : (
      <div
        class={containerClasses}
        style={containerStyle}
      >
        {content}
      </div>
    );
}
