// islands/InfoHover.tsx
import { useSignal } from "@preact/signals";
import { useRef } from "preact/hooks";
import { JSX } from "preact";

interface InfoHoverProps {
  children: JSX.Element; // The trigger (e.g., "i" icon)
  content: JSX.Element; // The content to display on hover (e.g., a chart component)
  width?: string; // Optional width for the hover box, e.g., "w-80"
}

export default function InfoHover(props: InfoHoverProps): JSX.Element {
  const { children, content, width = "w-80" } = props;

  const showContent = useSignal(false);
  const hideTimeout = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    showContent.value = true;
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      showContent.value = false;
    }, 400); // Keeping 400ms delay for hover intent
  };

  return (
    <span
      class="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* The children prop is rendered here */}
      {children}
      {showContent.value && (
        <div
          class={`absolute right-0 bottom-full mb-2 z-10 ${width}`}
          onMouseEnter={handleMouseEnter} // Keep open if mouse moves onto the content
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>
      )}
    </span>
  );
}
