import { useSignal } from "@preact/signals";

const links = [
  { label: "📰 Dashboard", url: "https://manifold.markets/news/risk", targetBlank: true },
  { label: "📈 Credit Score", url: "https://risk.deno.dev", targetBlank: false },
  { label: "📊 Insurance", url: "https://risk.deno.dev/insurance", targetBlank: false },
  { label: "🏦 Payment Portal", url: "https://manifold.markets/crowlsyong/risk-payment-portal", targetBlank: true },
  { label: "💰 IMF", url: "https://manifold.markets/GastonKessler/test-bounty-gtduUIZPQR", targetBlank: true },
  { label: "✉️ Contact", url: "https://manifold.markets/crowlsyong", targetBlank: true },
];

export default function MenuBar() {
  const isMenuOpen = useSignal(false);

  return (
    <div class="fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-[#0F1729] text-white z-50">
      <a href="/">
        <img class="hidden md:block h-10" src="/risk.png" alt="the RISK mascot: a raccoon" />
        <img class="md:hidden h-8" src="/risk-logo-mini.png" alt="the RISK mini mascot: a raccoon" />
      </a>

      {/* Always visible hamburger button */}
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Unified menu panel */}
      {isMenuOpen.value && (
        <div class="fixed top-0 right-0 h-full w-full md:w-[300px] bg-[#0F1729] bg-opacity-90 backdrop-blur-lg text-white p-6 z-50 md:rounded-l-lg md:border-l-2 border-[#334155]">
          <button
            type="button"
            onClick={() => (isMenuOpen.value = false)}
            class="absolute top-2 right-5 text-white text-2xl"
          >
            &times;
          </button>

          {/* Show mascot only on mobile */}
          <div class="flex justify-center mb-8 md:hidden">
            <img src="/risk-logo-mini.svg" alt="the RISK mascot: a raccoon" class="h-12" />
          </div>

          {/* Added margin-top to create space between the close button and menu items */}
          <div class="space-y-4 mt-10">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target={link.targetBlank ? "_blank" : "_self"}  // Dynamically set target
                rel={link.targetBlank ? "noopener noreferrer" : undefined}
                class="block w-full text-center border border-[#334155] text-white py-3 px-4 rounded-md hover:bg-[#1E293B] transition-colors duration-200 text-base md:text-xs"
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
