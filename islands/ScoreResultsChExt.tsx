// ScoreResultChExt.tsx
import { TbExternalLink } from "@preact-icons/tb";
import { getScoreColor, getRiskLevelText } from "../utils/ScoreUtils.ts"; // Updated import

interface ScoreResultProps {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
  isWaiting: boolean;
  userExists?: boolean;
  fetchSuccess?: boolean;
}

export default function ScoreResultChExt({
  username,
  creditScore,
  riskMultiplier,
  avatarUrl,
  isWaiting,
}: ScoreResultProps) {
  // Calculate dynamic color for the credit score
  const colorClass = getScoreColor(creditScore); // Dynamic color from score

  // If waiting, override border color to gray
  const borderColorStyle = isWaiting
    ? { border: "2px solid #6b7280" } // Tailwind gray-500
    : { border: `2px solid ${colorClass}` }; // Use dynamic color for border

  // Determine if the container should be clickable
  const isClickable = username && username !== "nouserfound";

  // Common container classes
  const containerClasses =
    `block p-6 rounded-lg bg-slate-900 text-white transition-all duration-200 ${
      isClickable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
    }`;

  // Card content
  const content = (
    <div class="flex-col items-center mb-4">
      <div class="flex items-center mb-4">
        {avatarUrl
          ? (
            <img
              src={avatarUrl}
              alt={`${username}'s avatar`}
              class="w-12 h-12 rounded-full mr-4"
            />
          )
          : <div class="w-12 h-12 rounded-full bg-gray-500 mr-4" />}
        <div>
          <h2 class="text-xl font-semibold">{username}</h2>
          <p class="text-xs">
            Base Insurance Fee: {(riskMultiplier * 100).toFixed(0)}%
          </p>
        </div>
        <div class="flex flex-col mt-2 text-right ml-auto">
          <span class="text-xs text-gray-400">Credit Score:</span>
          <span class="text-3xl font-bold" style={{ color: colorClass }}>
            {creditScore}
          </span>
        </div>
      </div>
      <div
        class="mt-3 px-3 py-2 rounded-md relative"
        style={{ backgroundColor: colorClass }}
      >
        {/* Overlay to dull the background */}
        <div
          class="absolute inset-0 bg-black opacity-40 rounded-md"
          aria-hidden="true"
        />
        {/* Text remains on top, unaffected */}
        <div class="relative z-10">
          <p class="text-xs text-gray-100">Lending to this user is</p>
          <p class="text-sm text-white font-semibold">
            {getRiskLevelText(creditScore)}
          </p>
        </div>
        <TbExternalLink class="absolute top-4 right-2 w-5 h-5 text-white" />
      </div>
    </div>
  );

  if (isWaiting) {
    return (
      <div class={containerClasses} style={borderColorStyle}>
        <p class="text-gray-400">Waiting...</p>
      </div>
    );
  }

  return isClickable
    ? (
      <a
        href={`https://manifold.markets/${username}?tab=balance-changes`}
        target="_blank"
        rel="noopener noreferrer"
        class={containerClasses}
        style={borderColorStyle}
      >
        {content}
      </a>
    )
    : (
      <div class={containerClasses} style={borderColorStyle}>
        {content}
      </div>
    );
}
