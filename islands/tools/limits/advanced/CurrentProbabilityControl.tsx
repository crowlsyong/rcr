// islands/tools/limits/advanced/CurrentProbabilityControl.tsx
import { Signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { TbLockFilled, TbLockOpen } from "@preact-icons/tb";
import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

const LockFilledIcon = TbLockFilled as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const LockOpenIcon = TbLockOpen as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface CurrentProbabilityControlProps {
  currentProbability: Signal<number>;
  centerShift: Signal<number>;
  isShiftLockedToCurrentProb: Signal<boolean>;
  marketProbability?: number;
}

export default function CurrentProbabilityControl(
  {
    currentProbability,
    centerShift,
    isShiftLockedToCurrentProb,
    marketProbability,
  }: CurrentProbabilityControlProps,
) {
  const [useCustom, setUseCustom] = useState(false);
  const [localProbability, setLocalProbability] = useState(
    String(currentProbability.value),
  );
  const [localCurveCenterProbability, setLocalCurveCenterProbability] =
    useState(
      String(50 + centerShift.value),
    );
  const [isClient, setIsClient] = useState(false); // New state for client-side check

  useEffect(() => {
    setIsClient(true); // Set to true once component mounts on the client
  }, []);

  useEffect(() => {
    setLocalProbability(String(currentProbability.value));
  }, [currentProbability.value]);

  useEffect(() => {
    setLocalCurveCenterProbability(String(50 + centerShift.value));
  }, [centerShift.value]);

  useEffect(() => {
    if (typeof marketProbability === "number" && !useCustom) {
      currentProbability.value = Math.round(marketProbability);
    } else if (!useCustom && typeof marketProbability !== "number") {
      currentProbability.value = 50;
    }
  }, [marketProbability, useCustom]);

  const handleToggle = () => {
    const newState = !useCustom;
    setUseCustom(newState);
    if (!newState && typeof marketProbability === "number") {
      currentProbability.value = Math.round(marketProbability);
    }
  };

  const handleProbabilityInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
      setLocalProbability(String(numValue));
      currentProbability.value = numValue;
    } else if (value === "") {
      setLocalProbability("");
    }
  };

  const handleCurveCenterProbabilityInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      const newShift = numValue - 50;
      setLocalCurveCenterProbability(String(numValue));
      centerShift.value = Math.max(-50, Math.min(50, newShift));
    } else if (value === "") {
      setLocalCurveCenterProbability("");
    }
  };

  const isDisabledByMarket = typeof marketProbability !== "number";
  const isProbabilitySliderDisabled = !useCustom;

  const probabilitySliderTooltip =
    isProbabilitySliderDisabled && !isDisabledByMarket
      ? "Click the blue lock button to unlock"
      : "";

  const curveShiftTooltip = isShiftLockedToCurrentProb.value
    ? "Click the blue lock button to unlock"
    : "";

  // Calculate the displayed shift relative to the current market probability
  const effectiveCurveCenter = 50 + centerShift.value;
  const relativeShift = effectiveCurveCenter - currentProbability.value;

  const displayRelativeShift = relativeShift > 0
    ? `+${relativeShift}%`
    : `${relativeShift}%`;

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
      {/* Marker Probability */}
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label
            for="current-probability-input"
            class="block text-gray-300 font-medium"
          >
            Marker Probability:
          </label>
          <div class="flex items-center space-x-2">
            <input
              id="current-probability-input"
              type="number"
              value={localProbability}
              onInput={(e) =>
                handleProbabilityInputChange(e.currentTarget.value)}
              disabled={isProbabilitySliderDisabled}
              min="1"
              max="99"
              class={`w-12 px-1 py-1 rounded text-xs border text-center ${
                isProbabilitySliderDisabled
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600"
                  : "bg-gray-800 text-gray-100 border-gray-600 focus:outline-none focus:border-blue-500"
              }`}
            />
            <span class="text-gray-300">%</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <input
            id="current-probability-slider"
            type="range"
            min="1"
            max="99"
            value={currentProbability.value}
            onInput={(e) => {
              const val = parseInt(e.currentTarget.value) || 1;
              currentProbability.value = val;
              setLocalProbability(String(val));
            }}
            disabled={isProbabilitySliderDisabled}
            title={probabilitySliderTooltip}
            class="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            id="override-toggle"
            onClick={handleToggle}
            disabled={isDisabledByMarket}
            aria-pressed={useCustom}
            aria-label={useCustom
              ? "Lock to market probability"
              : "Unlock for custom probability"}
            class={`flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDisabledByMarket ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isClient // Conditionally render icon
              ? (useCustom
                ? <LockOpenIcon size={16} class="w-4 h-4 text-gray-600" />
                : <LockFilledIcon size={16} class="w-4 h-4 text-blue-500" />)
              : ( // Placeholder for SSR
                <div class="w-4 h-4 bg-gray-700 rounded animate-pulse">
                </div>
              )}
          </button>
        </div>
      </div>

      {/* Curve Shift / Shift */}
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label
            for="curve-center-probability-input"
            class="block text-gray-300 font-medium"
          >
            Shift:
          </label>
          <div class="flex items-center space-x-2">
            <span class="text-gray-400 mr-1">{displayRelativeShift}</span>
            <input
              id="curve-center-probability-input"
              type="number"
              value={localCurveCenterProbability}
              onInput={(e) =>
                handleCurveCenterProbabilityInputChange(e.currentTarget.value)}
              disabled={isShiftLockedToCurrentProb.value}
              min="0"
              max="100"
              class={`w-12 px-1 py-1 rounded text-xs border text-center ${
                isShiftLockedToCurrentProb.value
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600"
                  : "bg-gray-800 text-gray-100 border-gray-600 focus:outline-none focus:border-blue-500"
              }`}
            />
            <span class="text-gray-300">%</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <input
            id="center-shift"
            type="range"
            min="-50"
            max="50"
            value={centerShift.value}
            onInput={(e) => {
              const val = parseInt(e.currentTarget.value) || 0;
              centerShift.value = val;
              setLocalCurveCenterProbability(String(50 + val));
            }}
            disabled={isShiftLockedToCurrentProb.value}
            title={curveShiftTooltip}
            class={`flex-1 h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 ${
              isShiftLockedToCurrentProb.value
                ? "bg-gray-700 disabled:cursor-not-allowed"
                : "bg-gray-600"
            }`}
          />
          <button
            type="button"
            id="lock-shift"
            onClick={() =>
              isShiftLockedToCurrentProb.value = !isShiftLockedToCurrentProb
                .value}
            aria-pressed={isShiftLockedToCurrentProb.value}
            aria-label={isShiftLockedToCurrentProb.value
              ? "Unlock curve shift"
              : "Lock curve shift to current probability"}
            title="Locks to market probability slider"
            class="flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isClient // Conditionally render icon
              ? (isShiftLockedToCurrentProb.value
                ? <LockFilledIcon size={16} class="h-4 w-4 text-blue-500" />
                : <LockOpenIcon size={16} class="h-4 w-4 text-gray-600" />)
              : ( // Placeholder for SSR
                <div class="w-4 h-4 bg-gray-700 rounded animate-pulse">
                </div>
              )}
          </button>
        </div>
      </div>
    </div>
  );
}
