import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface ButtonProps extends JSX.HTMLAttributes<HTMLAnchorElement> {
  url: string;
  disabled?: boolean;
}

export function Button({ url, disabled, ...props }: ButtonProps) {
  const isDisabled = disabled || !IS_BROWSER || !url;

  return (
    <a
      {...props}
      href={isDisabled ? undefined : url}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      class={`inline-block px-4 py-2 rounded-lg bg-slate-900 text-white border border-gray-700 transition-all duration-200 ${
        isDisabled
          ? "opacity-50 pointer-events-none"
          : "hover:bg-slate-800 cursor-pointer"
      } ${props.class || ""}`}
    >
      {props.children}
    </a>
  );
}
