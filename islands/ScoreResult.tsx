// ScoreResults.tsx

import { h } from "preact";

// Function to interpolate colors based on credit score
function lerpColor(color1: [number, number, number], color2: [number, number, number], t: number): string {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
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
        <p class="text-2xl font-bold mt-2">
          Credit Score: <span style={{ color: colorClass }}>{creditScore}</span>
        </p>
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
