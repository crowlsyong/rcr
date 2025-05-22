export default function Version() {
  return (
    <div class="p-4 text-center text-sm text-gray-600">
      <div class="flex justify-center items-center gap-2 text-xs text-gray-500">
        <span>
          Built for{" "}
          <a
            href="https://manifold.markets/"
            class="underline hover:text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            manifold.markets
          </a>
        </span>
        <span class="text-gray-400">|</span>
        <span class="text-gray-500 text-xs">Version 2.1.0</span>
      </div>
    </div>
  );
}
