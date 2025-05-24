// islands/buttons/ChartButton.tsx
import { TbTimeline } from "@preact-icons/tb"; // Import the chart icon

interface ChartButtonProps {
  username: string;
}

// Cast TbTimeline to a valid component type for JSX usage.
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";
const IconToUse = TbTimeline as ComponentType<JSX.IntrinsicElements["svg"]>;

export default function ChartButton({ username }: ChartButtonProps) {
  const handleClick = () => {
    // Navigate to the user's chart page
    // Corrected template literal syntax here
    globalThis.location.href = `/chart/${username}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      class="px-3 md:px-6 py-2 rounded-md bg-slate-900 text-white border border-slate-700 transition-all duration-200 hover:bg-slate-800 cursor-pointer"
      // Corrected template literal syntax for the title
      title={`View ${username}'s credit score chart`}
    >
      <IconToUse class="w-5 h-5" /> {/* Use the casted icon */}
    </button>
  );
}
