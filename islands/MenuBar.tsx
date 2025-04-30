import { useSignal } from "@preact/signals";

// Define the links as a constant array
const links = [
  {
    label: "📟 Dashboard",
    url: "https://manifold.markets/news/risk",
  },
  {
    label: "🏦 Payment Portal",
    url: "https://manifold.markets/crowlsyong/risk-payment-portal",
  },
  {
    label: "💰 IMF",
    url: "https://manifold.markets/GastonKessler/test-bounty-gtduUIZPQR",
  },
  {
    label: "✉️ Contact",
    url: "https://manifold.markets/crowlsyong",
  },
];

export default function MenuBar() {
  // Use useSignal for mobile menu state
  const isMenuOpen = useSignal(false);

  return (
    <div class="fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-[#0F1729] text-white z-50">
      <a href="/">
        {/* Default logo for large screens */}
        <img
          class="hidden sm:block h-10"
          src="/risk.png"
          alt="the RISK mascot: a raccoon"
        />
        {/* Mini logo for tablet or smaller */}
        <img
          class="sm:hidden h-8"
          src="/risk-logo-mini.png"
          alt="the RISK mini mascot: a raccoon"
        />
      </a>

      {/* Links for large screens */}
      <div class="hidden sm:flex space-x-2 sm:space-x-4 text-xs sm:text-base">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-white hover:underline"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Hamburger icon for mobile/tablet */}
      <div class="sm:hidden">
        <button
          type="button"
          class="text-white"
          onClick={() => isMenuOpen.value = !isMenuOpen.value}
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

      {/* Full-screen mobile menu overlay */}
      {isMenuOpen.value && (
        <div class="sm:hidden fixed inset-0 bg-[#0F1729] bg-opacity-70 backdrop-blur-lg text-white p-6 transition-transform transform right-0 z-50 slide-in">
          <button
            type="button"
            onClick={() => isMenuOpen.value = false}
            class="absolute top-2 right-5 text-white text-2xl"
          >
            &times;
          </button>

          {/* RISK Logo in the menu */}
          <div class="flex justify-center mb-8">
            <img
              src="/risk-logo-mini.svg"
              alt="the RISK mascot: a raccoon"
              class="h-12"
            />
          </div>

          {/* Links */}
          <div class="space-y-4">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                class="block text-white text-lg hover:underline"
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
