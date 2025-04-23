import { h } from "preact";

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
  // Define color class based on credit score
  const colorClass = creditScore >= 800
    ? "text-green-500"
    : creditScore >= 700
    ? "text-blue-500"
    : creditScore >= 600
    ? "text-yellow-500"
    : "text-red-500";

  // If waiting, override border color to gray
  const borderColorClass = isWaiting
    ? "border-gray-500"
    : creditScore >= 800
    ? "border-green-500"
    : creditScore >= 700
    ? "border-blue-500"
    : creditScore >= 600
    ? "border-yellow-500"
    : "border-red-500";

  // Determine if the container should be clickable
  const isClickable = username && username !== "nouserfound";

  // Common container classes
  const containerClasses = `block border p-6 rounded-lg bg-gray-800 text-white transition-all duration-300 ${borderColorClass} ${isClickable ? "hover:brightness-110 cursor-pointer" : "cursor-default"}`;

  // Card content
  const content = (
    <div class="flex items-center mb-4">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${username}'s avatar`}
          class="w-12 h-12 rounded-full mr-4"
        />
      ) : (
        <div class="w-12 h-12 rounded-full bg-gray-500 mr-4" />
      )}
      <div>
        <h2 class="text-xl font-semibold">{username}</h2>
        <p class="text-sm">Risk Multiplier: {riskMultiplier}</p>
        <p class="text-2xl font-bold mt-2">
          Credit Score: <span class={colorClass}>{creditScore}</span>
        </p>
      </div>
    </div>
  );

  if (isWaiting) {
    return (
      <div class={containerClasses}>
        <p class="text-gray-400">Waiting...</p>
      </div>
    );
  }

  return isClickable ? (
    <a
      href={`https://manifold.markets/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      class={containerClasses}
    >
      {content}
    </a>
  ) : (
    <div class={containerClasses}>
      {content}
    </div>
  );
}
