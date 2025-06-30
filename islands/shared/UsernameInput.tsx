// islands/shared/UsernameInput.tsx
import { useSignal } from "@preact/signals";
import { useEffect, type Ref } from "preact/hooks";

interface UsernameInputProps {
  initialValue: string;
  onDebouncedChange: (value: string) => void;
  debounceTime?: number;
  isFetching: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

export default function UsernameInput({
  initialValue,
  onDebouncedChange,
  debounceTime = 200,
  isFetching,
  inputRef,
}: UsernameInputProps) {
  const username = useSignal(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDebouncedChange(username.value);
    }, debounceTime);

    return () => {
      clearTimeout(timer);
    };
  }, [username.value, debounceTime, onDebouncedChange]);

  useEffect(() => {
    if (inputRef && inputRef.current && !isFetching &&
        document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFetching, inputRef]);

  return (
    <div class="mb-6 relative">
      <label
        htmlFor="username-input"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Enter Manifold Username:
      </label>
      <input
        id="username-input"
        ref={inputRef}
        type="text"
        placeholder="e.g., Alice"
        value={username.value}
        onInput={(e) => {
          username.value = (e.target as HTMLInputElement).value;
        }}
        class={`w-full p-2 pr-10 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
          isFetching ? "border-blue-500" : ""
        }`}
      />
      {isFetching && (
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none top-8">
          <svg
            class="animate-spin h-5 w-5 text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            >
            </circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            >
            </path>
          </svg>
        </div>
      )}
    </div>
  );
}
