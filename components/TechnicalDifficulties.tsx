// components/TechnicalDifficulties.tsx

export default function TechnicalDifficulties() {
  return (
    <div class="flex items-center gap-3 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-md shadow-sm text-yellow-900">
      <svg
        class="w-6 h-6 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.618-1.14 1.054-2l-6.928-12c-.526-.91-1.842-.91-2.368 0l-6.928 12c-.564.86 0 2 1.054 2z"
        />
      </svg>
      <div class="flex flex-col space-y-2">
        <p class="text-md">
          <strong>This product is in Alpha testing!</strong>
        </p>
        <hr />
        <p class="text-sm">
          <strong>Technical Difficulties:</strong>{" "}
          Some users have a credit score of less than 0, this is not supposed to
          be possible. We are looking into the issue.
        </p>
        <p class="text-sm">
          <strong>Update #1:</strong>{" "}
          Implimented a patch for negative credit scores.
        </p>
        <p class="text-sm">
          <strong>Update #2:</strong>{" "}
          Implimented a in improvement on the algorithm to better determine
          alltime profit
        </p>
        <p class="text-sm mt-2">
          To report a negative credit score or any other bugs, send{" "}
          <strong>
            <a
              href="https://manifold.markets/crowlsyong"
              target="_blank"
              class="text-blue-600 hover:underline"
            >
              @crowlsyong
            </a>
          </strong>{" "}
          a DM on Manifold.
        </p>
      </div>
    </div>
  );
}
