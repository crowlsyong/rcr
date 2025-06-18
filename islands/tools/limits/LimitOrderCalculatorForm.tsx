// islands/tools/limits/LimitOrderCalculatorForm.tsx
import { MarketData } from "../../../utils/api/manifold_types.ts";
import VolatilityToggle from "../../buttons/VolatilityToggle.tsx";
import MarketInfoDisplay from "./MarketInfoDisplay.tsx";

interface LimitOrderFormProps {
  marketUrlInput: string;
  setMarketUrlInput: (value: string) => void;
  lowerProbabilityInput: number;
  setLowerProbabilityInput: (value: number) => void;
  upperProbabilityInput: number;
  setUpperProbabilityInput: (value: number) => void;
  totalBetAmountInput: number;
  setTotalBetAmountInput: (value: number) => void;
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  loading: boolean;
  onSubmit: (e: Event) => void;
  isVolatilityBet: boolean;
  setIsVolatilityBet: (value: boolean) => void;
  granularityInput: number;
  setGranularityInput: (value: number) => void;
  marketData: MarketData | null;
}

export default function LimitOrderCalculatorForm(props: LimitOrderFormProps) {
  const showVolatilityToggle = props.apiKeyInput.length > 7;

  return (
    <form onSubmit={props.onSubmit} class="space-y-6 mb-8">
      <div>
        <label
          htmlFor="market-url"
          class="block text-sm font-medium text-gray-300"
        >
          Manifold Market URL:
        </label>
        <input
          type="url"
          id="market-url"
          name="marketUrl"
          value={props.marketUrlInput}
          onInput={(e) => props.setMarketUrlInput(e.currentTarget.value)}
          placeholder="e.g. https://manifold.markets/Austin/will-carrick-flynn-win-the-general"
          class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
          required
        />
        {props.loading && (
          <p class="text-xs text-gray-400 mt-2">Loading market data...</p>
        )}
        {props.marketData && (
          <MarketInfoDisplay
            marketData={props.marketData}
          />
        )}
      </div>

      <div>
        <label
          htmlFor="total-bet-amount"
          class="block text-sm font-medium text-gray-300"
        >
          Total Mana Budget (M):
        </label>
        <input
          type="number"
          id="total-bet-amount"
          name="totalBetAmount"
          value={props.totalBetAmountInput}
          onInput={(e) =>
            props.setTotalBetAmountInput(Number(e.currentTarget.value))}
          min="1"
          step="1"
          class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
          required
        />
      </div>

      <div>
        <p class="block text-sm font-medium text-gray-300 mb-2">
          Desired Probability Range:
        </p>
        <div class="flex space-x-4">
          <div class="flex-1">
            <label htmlFor="lower-probability" class="sr-only">
              Lower Probability (0-100%) for YES bet:
            </label>
            <input
              type="number"
              id="lower-probability"
              name="lowerProbability"
              value={props.lowerProbabilityInput}
              onInput={(e) =>
                props.setLowerProbabilityInput(Number(e.currentTarget.value))}
              min="0"
              max="100"
              step="0.01"
              placeholder="Lower (%) for YES"
              class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              required
            />
          </div>
          <div class="flex-1">
            <label htmlFor="upper-probability" class="sr-only">
              Upper Probability (0-100%) for NO bet:
            </label>
            <input
              type="number"
              id="upper-probability"
              name="upperProbability"
              value={props.upperProbabilityInput}
              onInput={(e) =>
                props.setUpperProbabilityInput(Number(e.currentTarget.value))}
              min="0"
              max="100"
              step="0.01"
              placeholder="Upper (%) for NO"
              class="block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="api-key"
          class="block text-sm font-medium text-gray-300"
        >
          Manifold API Key (optional)
        </label>
        <p class="text-xs text-gray-500 mt-1">
          Generates additional options. We do not store this key
        </p>
        <input
          type="password"
          id="api-key"
          name="apiKey"
          value={props.apiKeyInput}
          onInput={(e) => props.setApiKeyInput(e.currentTarget.value)}
          placeholder="xxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx"
          class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
        />
        <p class="mt-1 text-sm text-gray-400">
          Find your API key on your Manifold profile page by clicking the gear
          icon and selecting Account Settings.
        </p>
      </div>

      {showVolatilityToggle && (
        <VolatilityToggle
          label="Volatility Bet:"
          isVolatilityBet={props.isVolatilityBet}
          setIsVolatilityBet={props.setIsVolatilityBet}
          granularity={props.granularityInput}
          setGranularity={props.setGranularityInput}
        />
      )}
    </form>
  );
}
