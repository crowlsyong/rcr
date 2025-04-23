// components/MenuBar.tsx
export default function MenuBar() {
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
        <div class="flex space-x-4">
          <a
            href="https://manifold.markets/news/risk"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white hover:underline"
          >
            Dashboard
          </a>
          <a
            href="https://manifold.markets/crowlsyong"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white hover:underline"
          >
            Contact
          </a>
        </div>
      </div>
    );
  }
  