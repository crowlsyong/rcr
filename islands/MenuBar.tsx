import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { TbExternalLink } from "@preact-icons/tb";

const links = [
  {
    label: "📰 Dashboard",
    url: "https://manifold.markets/news/risk",
    targetBlank: true,
  },
  {
    label: "📈 Credit Score",
    url: "/",
    targetBlank: false,
  },
  {
    label: "📊 Insurance",
    url: "/insurance",
    targetBlank: false,
  },
  {
    label: "🏦 Payment Portal",
    url: "https://manifold.markets/crowlsyong/risk-payment-portal",
    targetBlank: true,
  },
  {
    label: "💰 IMF",
    url: "https://manifold.markets/GastonKessler/test-bounty-gtduUIZPQR",
    targetBlank: true,
  },
  {
    label: "✉️ Contact",
    url: "https://manifold.markets/crowlsyong",
    targetBlank: true,
  },
];

export default function MenuBar() {
  const isMenuOpen = useSignal(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        isMenuOpen.value = false;
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      {/* Top Bar */}
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

        {/* Hamburger */}
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

      {/* Slide-in Menu Panel */}
      <div
        ref={menuRef}
        class={`fixed top-0 right-0 h-full w-full md:w-[300px] bg-[#0F1729] bg-opacity-70 backdrop-blur-lg text-white p-6 z-50 md:rounded-l-lg md:border-l-2 border-[#334155] transform transition-transform duration-300 ease-in-out ${
          isMenuOpen.value
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-full pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={() => (isMenuOpen.value = false)}
          class="absolute top-2 right-5 text-white text-2xl"
        >
          &times;
        </button>

        {/* Mobile mascot */}
        <div class="flex justify-center mb-8 md:hidden">
          <img
            src="/risk-logo-mini.svg"
            alt="the RISK mascot: a raccoon"
            class="h-12"
          />
        </div>

        {/* Menu Links */}
        <div class="space-y-4 mt-10">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target={link.targetBlank ? "_blank" : "_self"}
              rel={link.targetBlank ? "noopener noreferrer" : undefined}
              class="flex items-center justify-center gap-1 border border-[#334155] text-white py-3 px-4 rounded-md hover:bg-[#1E293B] transition-colors duration-200 text-base md:text-xs"
            >
              <span>{link.label}</span>
              {link.targetBlank &&
                typeof window !== "undefined" && (
                <TbExternalLink class="w-4 h-4 opacity-70 absolute right-10" />
              )}
            </a>
          ))}
        </div>
        <div class="pt-10 text-xs w-full text-center text-[10px] text-gray-500 mt-auto">
          this is a 3rd party app | built by{" "}
          <a
            href="https://manifold.markets/crowlsyong"
            class="underline hover:text-blue-500"
          >
            crowlsyong
          </a>
        </div>
      </div>
    </div>
  );
}
