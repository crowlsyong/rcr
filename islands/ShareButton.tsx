import { useState } from "preact/hooks";

interface ShareButtonProps {
  username: string;
}

export default function ShareButton({ username }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    const currentUrl = globalThis.location.href;
    const urlWithoutTrailingSlash = currentUrl.endsWith("/")
      ? currentUrl.slice(0, -1)
      : currentUrl;
    const fullUrlToCopy = `${urlWithoutTrailingSlash}/u/${username}`;

    navigator.clipboard.writeText(fullUrlToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isClickable = true;

  return (
    <div class="relative inline-block">
      {copied && (
        <div class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-green-400 text-sm pointer-events-none">
          Copied to clipboard!
        </div>
      )}

      <button
        type="button"
        onClick={handleCopyClick}
        class={`px-6 py-2 rounded-md bg-slate-900 text-white border border-slate-700 transition-all duration-200 ${
          isClickable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
        }`}
      >
        Share
      </button>
    </div>
  );
}
