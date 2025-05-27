// islands/PasswordGate.tsx

import { h } from "preact";
import { useState } from "preact/hooks";

export default function PasswordGate(
  { children }: { children: h.JSX.Element },
) {
  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");

  const PASSWORD = "!*IMFracc00n*!"; // <-- plaintext password lol come hack me bro!

  if (!authorized) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[#0F1729] text-white">
        <div class="flex flex-col items-center space-y-4">
          <h1 class="text-xl font-bold">🦝Enter Password</h1>
          <div class="flex flex-row items-center space-x-2">
            <input
              type="password"
              class="p-2 rounded text-black"
              value={input}
              onInput={(e) => setInput((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input === PASSWORD) {
                  setAuthorized(true);
                }
              }}
            />
            <button
              type="button"
              class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              onClick={() => {
                if (input === PASSWORD) {
                  setAuthorized(true);
                } else {
                  alert("Incorrect password.");
                }
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
