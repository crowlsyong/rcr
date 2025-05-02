// ScoreResults.tsx

// Function to interpolate colors based on credit score
function lerpColor(
  color1: [number, number, number],
  color2: [number, number, number],
  t: number,
): string {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getRiskLevelText(score: number): string {
  if (score < 100) return "Outrageously Dangerous";
  if (score < 200) return "Extremely Risky";
  if (score < 300) return "Highly Risky";
  if (score < 400) return "Risky";
  if (score < 500) return "A Bit Risky";
  if (score < 600) return "Moderately Safe";
  if (score < 700) return "Safe";
  if (score < 800) return "Very Safe";
  if (score < 900) return "Super Safe";
  return "Extremely Safe";
}
function getScoreColor(score: number): string {
  if (score >= 800) {
    const t = (score - 800) / 200; // 800 → 1000
    return lerpColor([100, 100, 255], [96, 225, 105], t); // soft purple → soft green
  } else if (score >= 600) {
    const t = (score - 600) / 200; // 600 → 800
    return lerpColor([50, 150, 200], [100, 100, 255], t); // soft blue → soft purple
  } else {
    const t = score / 600; // 0 → 600
    return lerpColor([255, 100, 100], [180, 100, 255], t); // soft red → soft purple
  }
}

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
        >
        </div>

        {/* Text remains on top, unaffected */}
        <div class="relative z-10">
          <p class="text-xs text-gray-100">Lending to this user is</p>
          <p class="text-sm text-white font-semibold">
            {getRiskLevelText(creditScore)}
          </p>
        </div>
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
