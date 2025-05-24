// islands/buttons/ShareButton.tsx

import { TbShare2 } from "@preact-icons/tb";
import { useState } from "preact/hooks";

// Imports for casting
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

interface ShareButtonProps {
  username: string; // Still useful for the button title/label
}

// Cast TbShare2 to a valid component type for JSX usage.
const ShareIcon = TbShare2 as ComponentType<JSX.IntrinsicElements["svg"]>;

export default function ShareButton({ username }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    // Simply copy the current URL including any query parameters
    const currentUrl = globalThis.location.href;

    // navigator.clipboard.writeText is generally well-supported for text
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      // Clear the copied message after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      // Handle potential errors during copy (e.g., not in a secure context)
      console.error("Failed to copy URL to clipboard:", err);
      // Optionally, provide user feedback about the failure
      // alert('Failed to copy URL. Please copy it manually.');
    });
  };

  // This button is always intended to be clickable
  // isClickable variable is not strictly necessary if the class handling is based on other state
  // but keeping it here if you use it elsewhere or for clarity
  const isClickable = true;

  return (
    <div class="relative inline-block">
      {copied && (
        <div class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-green-400 text-xs pointer-events-none whitespace-nowrap">
          Link copied!
        </div>
      )}

      <button
        type="button"
        onClick={handleCopyClick}
        class={`px-3 md:px-6 py-2 rounded-md bg-slate-900 text-white border border-slate-700 transition-all duration-200 ${
          isClickable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
        }`}
        title={`Share ${username}'s credit score page`} // Updated title
      >
        {/* Use the casted icon */}
        <ShareIcon class="w-5 h-5" />
      </button>
    </div>
  );
}
