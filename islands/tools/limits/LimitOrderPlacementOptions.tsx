// islands/tools/limits/LimitOrderPlacementOptions.tsx
import { ExpirationSettings } from "./LimitOrderCalculatorForm.tsx";
import DirectExecution from "./DirectExecution.tsx";
import ManualExecution from "./ManualExecution.tsx";

interface PlacementOptionsProps {
  yesLimitOrderAmount: number;
  noLimitOrderAmount: number;
  lowerProbability: number;
  upperProbability: number;
  apiKey: string;
  contractId: string;
  marketUrl: string;
  expirationSettings: ExpirationSettings;
}

export default function LimitOrderPlacementOptions(
  props: PlacementOptionsProps,
) {
  return (
    <div class="mt-8 border-t border-gray-700 pt-6">
      <h3 class="text-lg font-semibold mb-3 text-white">
        Place Limit Orders
      </h3>
      <DirectExecution {...props} />
      <ManualExecution {...props} />
    </div>
  );
}
