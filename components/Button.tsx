// components/Button.tsx

import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class={`px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 hover:bg-blue-600 transition-colors duration-150 disabled:opacity-50 ${
        props.class || ""
      }`}
    />
  );
}
