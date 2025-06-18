// islands/tools/limits/AnswerSelector.tsx

import { Answer } from "../../../utils/api/manifold_types.ts";

interface AnswerSelectorProps {
  answers: Answer[];
  selectedAnswerId: string | null;
  onAnswerSelect: (answerId: string) => void;
}

export default function AnswerSelector(
  { answers, selectedAnswerId, onAnswerSelect }: AnswerSelectorProps,
) {
  const sortedAnswers = answers.slice().sort((a, b) =>
    b.probability - a.probability
  );

  return (
    <div class="bg-gray-800 shadow sm:rounded-lg p-6 mb-6 border border-gray-700">
      <h3 class="text-lg font-semibold mb-4 text-white">
        Select an Answer to Bet On
      </h3>
      <fieldset class="space-y-4">
        <legend class="sr-only">Market Answers</legend>
        {sortedAnswers.map((answer) => (
          <div
            key={answer.id}
            class={`p-3 rounded-lg transition-colors duration-200 ${
              selectedAnswerId === answer.id
                ? "bg-blue-900/50 ring-2 ring-blue-500"
                : "bg-gray-900/50 hover:bg-gray-700/70"
            }`}
          >
            <label
              htmlFor={answer.id}
              class="flex items-center w-full cursor-pointer"
            >
              <input
                id={answer.id}
                name="answer-selection"
                type="radio"
                checked={selectedAnswerId === answer.id}
                onChange={() => onAnswerSelect(answer.id)}
                class="h-4 w-4 text-blue-600 bg-gray-700 border-gray-500 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <div class="ml-4 flex-grow">
                <div class="flex justify-between items-baseline mb-1.5">
                  <span class="font-medium text-gray-100">
                    {answer.text}
                  </span>
                  <span class="text-sm font-mono text-gray-300">
                    {(answer.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${answer.probability * 100}%` }}
                  >
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </fieldset>
    </div>
  );
}
