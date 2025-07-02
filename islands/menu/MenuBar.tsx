// islands/menu/MenuBar.tsx

import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { ComponentType } from "preact";
import { JSX } from "preact/jsx-runtime";
import { TbExternalLink } from "@preact-icons/tb"; // Import ExternalLinkIcon for explicit size

import MenuDropdown from "./MenuDropdown.tsx";
import LinkDataProvider from "./LinkDataProvider.tsx";

const ExternalLinkIcon = TbExternalLink as ComponentType<
  JSX.IntrinsicElements["svg"]
>;

interface MenuBarProps {
  theme?: "dark" | "default"; // New prop to control theme
}

export default function MenuBar({ theme = "default" }: MenuBarProps) { // Default to 'default'
  const isMenuOpen = useSignal(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const [activePath, setActivePath] = useState("");
  const [isClient, setIsClient] = useState(false); // For client-side icon rendering

  useEffect(() => {
    setIsClient(true); // Set to true once component mounts on the client
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        isMenuOpen.value = false;
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(globalThis.location.pathname);

      const handlePopState = () => {
        setActivePath(globalThis.location.pathname);
      };
      globalThis.addEventListener("popstate", handlePopState);
      return () => {
        globalThis.removeEventListener("popstate", handlePopState);
      };
    }
  }, []);

  // Determine background classes based on theme prop
  const headerBgClass = theme === "dark" ? "bg-black" : "bg-[#0F1729]";

  const menuBgClass = theme === "dark" ? "bg-black" : "bg-[#0F1729]";

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }

          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div>
        <div
          class={`fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 ${headerBgClass} text-white bg-opacity-70 backdrop-blur-lg z-50`}
        >
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
          class={`fixed top-0 right-0 h-full w-full md:w-[300px] ${menuBgClass} bg-opacity-70 backdrop-blur-lg text-white p-6 z-50 md:rounded-l-lg md:border-l-2 border-[#334155] transform transition-transform duration-300 ease-in-out ${
            isMenuOpen.value
              ? "translate-x-0 pointer-events-auto"
              : "translate-x-full pointer-events-none"
          } flex flex-col`}
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

          <div
            ref={scrollableContentRef}
            class="space-y-2 mt-10 flex-grow overflow-y-auto hide-scrollbar pb-10"
          >
            <LinkDataProvider>
              {(data) => (
                <>
                  <MenuDropdown
                    title="✨ Apps"
                    links={data.appsLinks}
                    isMenuOpen={isMenuOpen.value}
                    activePath={activePath}
                  />
                  <MenuDropdown
                    title="🏦 Banks"
                    links={data.banksLinks}
                    isMenuOpen={isMenuOpen.value}
                    activePath={activePath}
                  />
                  <MenuDropdown
                    title="🌐 Globular Conglomerate"
                    links={data.globularConglomerateLinks}
                    isMenuOpen={isMenuOpen.value}
                    activePath={activePath}
                  />
                  <MenuDropdown
                    title="🛠️ Services"
                    links={data.servicesLinks}
                    isMenuOpen={isMenuOpen.value}
                    activePath={activePath}
                  />
                </>
              )}
            </LinkDataProvider>

            <div class="pt-2">
              <a
                href="https://manifold.markets/crowlsyong?tab=payments"
                target="_blank"
                rel="noopener noreferrer"
                class="relative flex items-center justify-center gap-2 border border-green-700/40 bg-green-600/10 text-white py-2 px-3 rounded-md hover:bg-green-600/30 transition-colors duration-200 text-sm"
                tabIndex={isMenuOpen.value ? 0 : -1}
              >
                <span>❤️ Donate Mana</span>
                {isClient && ( // Conditionally render icon on client
                  <ExternalLinkIcon
                    size={16}
                    class="absolute right-3 w-4 h-4 opacity-70"
                  /> // Added size prop
                )}
              </a>
            </div>
          </div>

          <div class="pt-10 text-xs w-full text-center text-[10px] text-gray-500 mt-auto">
            <p>v2.1.8 | this is a 3rd party app</p>
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
    </>
  );
}
