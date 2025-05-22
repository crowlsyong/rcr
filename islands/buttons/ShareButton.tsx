// islands/buttons/ShareButton.tsx

import { TbShare2 } from "@preact-icons/tb";
import { useState } from "preact/hooks";

interface ShareButtonProps {
  username: string; // Still useful for the button title/label
}

export default function ShareButton({ username }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    // Simply copy the current URL including any query parameters
    const currentUrl = globalThis.location.href;

    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // This button is always intended to be clickable
  const isClickable = true;

  return (
    <div class="relative inline-block">
      {copied && (
        <div class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-green-400 text-xs pointer-events-none whitespace-nowrap">
          {/* Added whitespace-nowrap */}
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
        <TbShare2 class="w-5 h-5" />
      </button>
    </div>
  );
}
