// islands/buttons/ShareURL.tsx

import { TbShare2 } from "@preact-icons/tb";
import { useState } from "preact/hooks";

// Imports for casting
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

// Cast TbShare2 to a valid component type for JSX usage.
const ShareIcon = TbShare2 as ComponentType<JSX.IntrinsicElements["svg"]>;

export default function ShareURL() {
  const [copied, setCopied] = useState(false);
  // Check if we are in a browser environment
  const isBrowser = typeof globalThis.window !== "undefined";

  const handleCopyClick = () => {
    // Only attempt to copy if we are in a browser
    if (isBrowser) {
      const currentUrl = globalThis.location.href;
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch((err) => {
        // Handle potential errors during copy
        console.error("Failed to copy URL to clipboard:", err);
        // Optional: provide user feedback about the failure
      });
    }
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
        title="Share this page's URL"
      >
        {/* Conditionally render the icon only on the client */}
        {/* Use the casted icon */}
        {isBrowser && <ShareIcon class="w-5 h-5" />}
      </button>
    </div>
  );
}
