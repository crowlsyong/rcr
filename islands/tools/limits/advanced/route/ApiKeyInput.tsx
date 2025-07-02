// islands/tools/limits/advanced/route/ApiKeyInput.tsx

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export default function ApiKeyInput(
  { apiKey, setApiKey }: ApiKeyInputProps,
) {
  return (
    <div>
      <label
        htmlFor="advanced-api-key"
        class="block text-sm font-medium text-gray-300 mb-1"
      >
        Manifold API Key:
      </label>
      <input
        type="password"
        id="api-key"
        name="apiKey"
        value={apiKey}
        onInput={(e) => setApiKey(e.currentTarget.value)}
        placeholder="xxxxx-xxxx-xxxx-xxxxxxxxxxxxxxx"
        class="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-gray-100"
        required // API key is now required for this route's functionality
      />
      <p class="text-xs text-gray-500 mt-1 mb-2">
        Required to place bets. We do not store this key.
      </p>
      <p class="text-xs text-gray-500 mt-1 mb-2">
        Find your API key on your Manifold profile page by clicking the gear
        icon and selecting Account Settings.
      </p>
    </div>
  );
}
