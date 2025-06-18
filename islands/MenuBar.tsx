import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { TbChevronDown, TbExternalLink } from "@preact-icons/tb";

import type { ComponentType } from "preact";
import type { JSX } from "preact/jsx-runtime";

const ExternalLinkIcon = TbExternalLink as ComponentType<
  JSX.IntrinsicElements["svg"]
>;
const ChevronDownIcon = TbChevronDown as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

const mainLinks = [
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
    label: "🧮 Limits",
    url: "/limits",
    targetBlank: false,
  },
  {
    label: "⚖️ Arbitrage",
    url: "/arbitrage",
    targetBlank: false,
  },
];

const servicesLinks = [
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
    label: "💵 BANK",
    url: "https://manifold.markets/news/placeholder",
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
  const isServicesOpen = useSignal(false);
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
      <div class="fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-[#0F1729] text-white bg-opacity-70 backdrop-blur-lg z-50">
        <a href="/">
          <img
            class="hidden md:block h-10"
            src="/risk-horizontal-transparent.png"
            alt="the RISK mascot: a raccoon"
          />
          <img
            class="md:hidden h-8"
            src="/risk-logo-mini-t.png"
            alt="the RISK mini mascot: a raccoon"
          />
        </a>

        <button
          type="button"
          class="text-white p-3 -m-3"
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
          class="absolute top-2 right-5 text-white text-2xl p-3 -m-3"
          tabIndex={isMenuOpen.value ? 0 : -1}
        >
          &times;
        </button>

        <div class="flex justify-center mb-8 md:hidden">
          <img
            src="/risk-logo-mini-t.png"
            alt="the RISK mascot: a raccoon"
            class="h-12"
          />
        </div>

        <div class="space-y-2 mt-10">
          {mainLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target={link.targetBlank ? "_blank" : "_self"}
              rel={link.targetBlank ? "noopener noreferrer" : undefined}
              class="relative flex items-center justify-center border border-[#334155] text-white py-2 px-3 rounded-md hover:bg-[#1E293B] transition-colors duration-200 text-sm"
              tabIndex={isMenuOpen.value ? 0 : -1}
            >
              <span>{link.label}</span>
              {link.targetBlank && typeof window !== "undefined" && (
                <ExternalLinkIcon class="absolute right-3 w-4 h-4 opacity-70" />
              )}
            </a>
          ))}

          <div>
            <button
              type="button"
              onClick={() => isServicesOpen.value = !isServicesOpen.value}
              class="w-full flex items-center justify-center gap-2 border border-[#334155] text-white py-2 px-3 rounded-md hover:bg-[#1E293B] transition-colors duration-200 text-sm"
              tabIndex={isMenuOpen.value ? 0 : -1}
            >
              <span>🛠️ Services</span>
              {typeof window !== "undefined" && (
                <ChevronDownIcon
                  class={`w-4 h-4 opacity-70 transition-transform duration-300 ${
                    isServicesOpen.value ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>
            <div
              class={`transition-all duration-300 ease-in-out overflow-hidden ${
                isServicesOpen.value ? "max-h-96 mt-2" : "max-h-0"
              }`}
            >
              <div class="space-y-2 pl-4 border-l-2 border-gray-700/50">
                {servicesLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target={link.targetBlank ? "_blank" : "_self"}
                    rel={link.targetBlank ? "noopener noreferrer" : undefined}
                    class="relative flex items-center justify-center border border-[#334155] text-white py-2 px-3 rounded-md hover:bg-[#1E293B] transition-colors duration-200 text-sm"
                    tabIndex={isMenuOpen.value ? 0 : -1}
                  >
                    <span>{link.label}</span>
                    {link.targetBlank && typeof window !== "undefined" && (
                      <ExternalLinkIcon class="absolute right-3 w-4 h-4 opacity-70" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div class="pt-2">
            <a
              href="https://manifold.markets/crowlsyong?tab=payments"
              target="_blank"
              rel="noopener noreferrer"
              class="relative flex items-center justify-center gap-2 border border-green-700/40 bg-green-600/10 text-white py-2 px-3 rounded-md hover:bg-green-600/30 transition-colors duration-200 text-sm"
              tabIndex={isMenuOpen.value ? 0 : -1}
            >
              <span>❤️ Donate Mana</span>
              {typeof window !== "undefined" && (
                <ExternalLinkIcon class="absolute right-3 w-4 h-4 opacity-70" />
              )}
            </a>
          </div>
        </div>
        <div class="pt-10 text-xs w-full text-center text-[10px] text-gray-500 mt-auto">
          <p>v2.1.5 | this is a 3rd party app</p>
          <hr class="my-2 border-gray-600" />
          <div class="flex items-center justify-center gap-1.5">
            <span>built by</span>
            <a
              href="https://manifold.markets/crowlsyong"
              class="underline hover:text-blue-500"
              tabIndex={isMenuOpen.value ? 0 : -1}
            >
              crowlsyong
            </a>
            {" | "}
            <a
              href="https://github.com/crowlsyong/rcr/tree/main"
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={isMenuOpen.value ? 0 : -1}
              aria-label="View source on GitHub"
            >
              <img
                src="/github-mark-white.svg"
                alt="GitHub logo"
                class="h-3 w-3 opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
