// islands/tools/limits/advanced/BetInputs.tsx
import { Signal } from "@preact/signals";
import { useState, useEffect } from "preact/hooks";

interface BetInputsProps {
  betAmount: Signal<number>;
}

export default function BetInputs({ betAmount }: BetInputsProps) {
  const SLIDER_RAW_MIN = 10;
  const SLIDER_RAW_MAX = 1000;
  const MIN_BET_AMOUNT = 10;

  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [inputValue, setInputValue] = useState(String(betAmount.value));

  useEffect(() => {
    setInputValue(String(betAmount.value));
  }, [betAmount.value]);

  const showMessage = (msg: string, error: boolean) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => {
      setMessage(null);
      setIsError(false);
    }, 3000);
  };

  const mapSliderValueToBetAmount = (rawValue: number): number => {
    const clampedRawValue = Math.max(SLIDER_RAW_MIN, Math.min(
      SLIDER_RAW_MAX,
      rawValue,
    ));
    const effectiveRange = SLIDER_RAW_MAX - SLIDER_RAW_MIN;
    const percentage = (clampedRawValue - SLIDER_RAW_MIN) / effectiveRange;

    let result = MIN_BET_AMOUNT;

    if (percentage <= 0.33) {
      const segmentPercentage = percentage / 0.33;
      result = Math.round(
        MIN_BET_AMOUNT + segmentPercentage * (1000 - MIN_BET_AMOUNT),
      );
    } else if (percentage <= 0.66) {
      const segmentPercentage = (percentage - 0.33) / (0.66 - 0.33);
      const startValue = 1000;
      const endValue = 10000;
      const logStart = Math.log(startValue);
      const logEnd = Math.log(endValue);
      const interpolatedLog = logStart + segmentPercentage * (logEnd - logStart);
      result = Math.round(Math.exp(interpolatedLog));
    } else {
      const segmentPercentage = (percentage - 0.66) / (1 - 0.66);
      const startValue = 10000;
      const endValue = 100000;
      const logStart = Math.log(startValue);
      const logEnd = Math.log(endValue);
      const interpolatedLog = logStart + segmentPercentage * (logEnd - logStart);
      result = Math.round(Math.exp(interpolatedLog));
    }
    return Math.max(MIN_BET_AMOUNT, result);
  };

  const mapBetAmountToSliderValue = (bet: number): number => {
    const clampedBet = Math.max(MIN_BET_AMOUNT, Math.min(100000, bet));

    let percentage = 0;
    if (clampedBet >= MIN_BET_AMOUNT && clampedBet <= 1000) {
      percentage = (clampedBet - MIN_BET_AMOUNT) / (1000 - MIN_BET_AMOUNT) *
        0.33;
    } else if (clampedBet > 1000 && clampedBet <= 10000) {
      const startValue = 1000;
      const endValue = 10000;
      const logStart = Math.log(startValue);
      const logEnd = Math.log(endValue);
      const logBet = Math.log(clampedBet);

      const segmentPercentage = (logBet - logStart) / (logEnd - logStart);
      percentage = 0.33 + segmentPercentage * (0.66 - 0.33);
    } else if (clampedBet > 10000 && clampedBet <= 100000) {
      const startValue = 10000;
      const endValue = 100000;
      const logStart = Math.log(startValue);
      const logEnd = Math.log(endValue);
      const logBet = Math.log(clampedBet);

      const segmentPercentage = (logBet - logStart) / (logEnd - logStart);
      percentage = 0.66 + segmentPercentage * (1 - 0.66);
    } else {
      percentage = clampedBet > 100000 ? 1 : 0;
    }
    const effectiveRange = SLIDER_RAW_MAX - SLIDER_RAW_MIN;
    return Math.round(SLIDER_RAW_MIN + percentage * effectiveRange);
  };

  const handleSliderInput = (value: string) => {
    const rawSliderValue = parseInt(value, 10);
    if (!isNaN(rawSliderValue)) {
      const newBetAmount = mapSliderValueToBetAmount(rawSliderValue);
      betAmount.value = newBetAmount;
      setInputValue(String(newBetAmount));
    }
  };

  const handleTextInput = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const value = target.value;
    setInputValue(value);

    const parsedValue = parseInt(value, 10);

    if (value === "" || isNaN(parsedValue) || parsedValue < MIN_BET_AMOUNT) {
      showMessage(
        `Input cannot be less than ${MIN_BET_AMOUNT}. Resetting to ${MIN_BET_AMOUNT}.`,
        true,
      );
      betAmount.value = MIN_BET_AMOUNT;
      // Set input value back to 10 immediately
      setInputValue(String(MIN_BET_AMOUNT));
    } else {
      betAmount.value = parsedValue;
    }
  };

  const handleInputBlur = () => {
    // This handles cases where user types something invalid and tabs out
    if (betAmount.value < MIN_BET_AMOUNT) {
      betAmount.value = MIN_BET_AMOUNT;
      setInputValue(String(MIN_BET_AMOUNT));
    }
    // Also re-sync input value with betAmount.value in case it was auto-corrected
    setInputValue(String(betAmount.value));
  };

  return (
    <div class="p-2 space-y-4 text-xxs bg-gray-900 rounded-lg shadow-md">
      <div>
        <div class="flex justify-between items-baseline mb-1">
          <label for="bet-amount-input" class="block text-gray-300 font-medium">
            Bet Amount:
          </label>
          <div class="flex items-baseline space-x-1">
            <input
              id="bet-amount-input"
              type="number"
              value={inputValue}
              onInput={handleTextInput}
              onBlur={handleInputBlur}
              min={MIN_BET_AMOUNT}
              max="100000"
              class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 text-xs text-right"
            />
            <span class="text-gray-300">Mana</span>
          </div>
        </div>
        {message && (
          <p
            class={`text-center mt-2 text-xxs ${
              isError ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}
        <input
          type="range"
          value={mapBetAmountToSliderValue(betAmount.value)}
          onInput={(e) => handleSliderInput(e.currentTarget.value)}
          min={SLIDER_RAW_MIN}
          max={SLIDER_RAW_MAX}
          step="1"
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
