// islands/buttons/ChartButton.tsx

import { TbTimeline } from "@preact-icons/tb"; // Import the chart icon

interface ChartButtonProps {
  username: string;
}

export default function ChartButton({ username }: ChartButtonProps) {
  const handleClick = () => {
    // Navigate to the user's chart page
    globalThis.location.href = `/chart/${username}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class="px-3 md:px-6 py-2 rounded-md bg-slate-900 text-white border border-slate-700 transition-all duration-200 hover:bg-slate-800 cursor-pointer"
      title={`View ${username}'s credit score chart`} // Updated title
    >
      <TbTimeline class="w-5 h-5" /> {/* Use the chart icon */}
    </button>
  );
}
