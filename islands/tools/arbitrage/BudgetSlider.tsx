interface BudgetSliderProps {
  budgetPercentage: number;
  setBudgetPercentage: (value: number) => void;
}

export default function BudgetSlider(
  { budgetPercentage, setBudgetPercentage }: BudgetSliderProps,
) {
  return (
    <div class="mt-6">
      <label
        htmlFor="budget-slider"
        class="block text-sm font-medium text-gray-300"
      >
        Adjust Investment Amount:{" "}
        <span class="font-bold text-white">{budgetPercentage}%</span>
      </label>
      <input
        id="budget-slider"
        type="range"
        min="0"
        max="100"
        value={budgetPercentage}
        onInput={(e) => setBudgetPercentage(Number(e.currentTarget.value))}
        class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
      />
    </div>
  );
}
