// ShareButton.tsx

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
      setTimeout(() => setCopied(false), 2000); // Hide "Copied" message after 2 seconds
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleCopyClick}
        class="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
      >
        Share
      </button>
      {copied && <p class="mt-2 text-green-400">Copied to clipboard!</p>}
    </div>
  );
}
