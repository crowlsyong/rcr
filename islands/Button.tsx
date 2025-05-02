import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  const redirectToUrl = "https://risk.deno.dev"; // Hardcoded URL for the button

  // Handle button click to navigate
  const handleClick = () => {
    // Use globalThis.location to navigate
    globalThis.location.href = redirectToUrl;
  };

  return (
    <button
      {...props}
      onClick={handleClick} // On click, navigate to the hardcoded URL
      disabled={!IS_BROWSER || props.disabled} // Make sure it's enabled only in the browser
      class={`px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 hover:bg-blue-600 transition-colors duration-150 disabled:opacity-50 ${props.class || ""}`}
    >
      {props.children}
    </button>
  );
}
