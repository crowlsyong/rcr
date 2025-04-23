interface ScoreResultProps {
  username: string;
  creditScore: number;
  riskMultiplier: number;
  isWaiting: boolean;
}

function getScoreColor(score: number) {
  const percentage = Math.min(Math.max(score / 1000, 0), 1);
  const red = Math.round(255 * (1 - percentage));
  const green = Math.round(200 * percentage);
  return `rgba(${red}, ${green}, 100, 0.5)`; // 50% transparent background only
}

export default function ScoreResult({
  username,
  creditScore,
  riskMultiplier,
  isWaiting,
}: ScoreResultProps) {
  const bgColor = isWaiting
    ? "rgba(255, 255, 255, 0.1)"
    : getScoreColor(creditScore);

  return (
    <div
      class="w-full p-6 rounded-lg shadow-lg text-center relative"
      style={{ backgroundColor: bgColor }}
    >
      {/* Username with link */}
      <div class="text-sm text-white mb-2">
        {isWaiting
          ? (
            "Waiting..."
          )
          : (
            <a
              href={`https://manifold.markets/${username}`}
              target="_blank"
              class="text-white underline"
              rel="noopener noreferrer"
            >
              {username}
            </a>
          )}
      </div>

      {/* Credit Score */}
      <div class="text-4xl font-bold text-white">
        {isWaiting ? "..." : creditScore}
      </div>
      
      {/* Risk Multiplier */}
      <div class="mt-2 text-white text-base">
        Risk Multiplier: {isWaiting ? "Waiting..." : riskMultiplier}
      </div>
    </div>
  );
}
