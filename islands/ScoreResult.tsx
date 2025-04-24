// ScoreResults.tsx

import { h } from "preact";

// Function to interpolate colors based on credit score
function lerpColor(color1: [number, number, number], color2: [number, number, number], t: number): string {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getRiskLevelText(score: number): string {
  if (score < 100) return "Outright Dangerous";
  if (score < 200) return "Extremely Risky";
  if (score < 300) return "Highly Risky";
  if (score < 400) return "Risky";
  if (score < 500) return "A Bit Risky";
  if (score < 600) return "Moderate Risk";
  if (score < 700) return "Fair";
  if (score < 800) return "Good";
  if (score < 900) return "Very Safe";
  return "Extremely Safe";
}

function getScoreColor(score: number): string {
  if (score >= 800) {
    const t = (score - 800) / 200; // 800 → 1000
    return lerpColor([100, 100, 255], [100, 255, 100], t); // soft blue → soft green
  } else if (score >= 600) {
    const t = (score - 600) / 200; // 600 → 800
    return lerpColor([255, 255, 0], [100, 100, 255], t); // soft yellow → soft blue
  } else {
    const t = score / 600; // 0 → 600
    return lerpColor([255, 100, 100], [255, 255, 100], t); // soft red → soft yellow
  }
}

interface ScoreResultProps {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  avatarUrl: string | null;
  isWaiting: boolean;
}

export default function ScoreResult({
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
    `block p-6 rounded-lg bg-gray-800 text-white transition-all duration-300 ${isClickable ? "hover:brightness-110 cursor-pointer" : "cursor-default"}`;

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
  <p class="text-sm">Risk Multiplier: {riskMultiplier}</p>

</div>
<div class="flex flex-col mt-2 text-right ml-auto">
  <span class="text-xs text-gray-400">Credit Score:</span>
  <span class="text-3xl font-bold" style={{ color: colorClass }}>{creditScore}</span>
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
  ></div>

  {/* Text remains on top, unaffected */}
  <div class="relative z-10">
    <p class="text-xs text-gray-100">Lending to this user is</p>
    <p class="text-sm text-white font-semibold">{getRiskLevelText(creditScore)}</p>
  </div>
</div>


        </div>
  );

  if (isWaiting) {
    return (
      <div class={containerClasses} style={borderColorStyle}>
        <p class="text-gray-400">...</p>
      </div>
    );
  }

  return isClickable
    ? (
      <a
        href={`https://manifold.markets/${username}`}
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
