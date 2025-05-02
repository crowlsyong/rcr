import { useSignal } from "@preact/signals";

const links = [
  { label: "📰 Dashboard", url: "https://manifold.markets/news/risk" },
  { label: "📈 Credit Score", url: "https://risk.deno.dev" },
  { label: "📊 Insurance", url: "https://risk.deno.dev/insurance" },
  {
    label: "🏦 Payment Portal",
    url: "https://manifold.markets/crowlsyong/risk-payment-portal",
  },
  {
    label: "💰 IMF",
    url: "https://manifold.markets/GastonKessler/test-bounty-gtduUIZPQR",
  },
  { label: "✉️ Contact", url: "https://manifold.markets/crowlsyong" },
];

export default function MenuBar() {
  const isMenuOpen = useSignal(false);

  return (
    <div class="fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-[#0F1729] text-white z-50">
      <a href="/">
        <img
          class="hidden md:block h-10"
          src="/risk.png"
          alt="the RISK mascot: a raccoon"
        />
        <img
          class="md:hidden h-8"
          src="/risk-logo-mini.png"
          alt="the RISK mini mascot: a raccoon"
        />
      </a>

      {/* Desktop buttons */}
      <div class="hidden md:flex space-x-2 md:space-x-1 text-xs md:text-base">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs px-3 py-1 border border-[#334155] rounded-md hover:bg-[#1E293B] transition-colors duration-200"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Mobile menu icon */}
      <div class="md:hidden">
        <button
          type="button"
          class="text-white"
          onClick={() => (isMenuOpen.value = !isMenuOpen.value)}
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen.value && (
        <div class="md:hidden fixed inset-0 bg-[#0F1729] bg-opacity-90 backdrop-blur-lg text-white p-6 z-50">
          <button
            type="button"
            onClick={() => (isMenuOpen.value = false)}
            class="absolute top-2 right-5 text-white text-2xl"
          >
            &times;
          </button>

          <div class="flex justify-center mb-8">
            <img
              src="/risk-logo-mini.svg"
              alt="the RISK mascot: a raccoon"
              class="h-12"
            />
          </div>

          {/* Mobile buttons */}
          <div class="space-y-4">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                class="block w-full text-center border border-[#334155] text-white text-lg py-3 px-4 rounded-md hover:bg-[#1E293B] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
