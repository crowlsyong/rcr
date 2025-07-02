// islands/InfoIcon.tsx
import { JSX } from "preact";
import { TbInfoCircle } from "@preact-icons/tb";
import { ComponentType } from "preact";

export default function InfoIcon(): JSX.Element {
  const InfoCircleIcon = TbInfoCircle as ComponentType<
    JSX.IntrinsicElements["svg"]
  >;

  return (
    <span class="ml-2 inline-flex items-center justify-center h-8 w-8 text-gray-500 cursor-pointer transition-colors duration-200
             rounded-full bg-transparent hover:bg-black hover:bg-opacity-50" // Apply rounded-full to base, and make default bg transparent
    >
      <InfoCircleIcon class="w-6 h-6 text-white" />
    </span>
  );
}
