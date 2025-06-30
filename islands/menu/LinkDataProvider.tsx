// islands/menu/LinkDataProvider.tsx
import { JSX } from "preact/jsx-runtime";

interface Link {
  label: string;
  url?: string;
  targetBlank?: boolean;
  children?: Link[];
  isSpecialNestedDropdown?: boolean;
}

interface LinkData {
  appsLinks: Link[];
  banksLinks: Link[];
  globularConglomerateLinks: Link[];
  servicesLinks: Link[];
}

const appsLinks: Link[] = [
  { label: "⚖️ Arbitrage", url: "/arbitrage", targetBlank: false },
  { label: "📈 Credit Score", url: "/", targetBlank: false },
  { label: "📦 Extension", url: "/extension", targetBlank: false },
  { label: "📊 Insurance", url: "/insurance", targetBlank: false },
  { label: "🧮 Limits", url: "/limits", targetBlank: false },
];

const banksLinks: Link[] = [
  {
    label: "💵 BANK",
    url: "https://manifold.markets/news/placeholder",
    targetBlank: true,
  },
  {
    label: "💰 IMF",
    url: "https://manifold.markets/GastonKessler/test-bounty-gtduUIZPQR",
    targetBlank: true,
  },
];

const globularConglomerateLinks: Link[] = [
  {
    label: "⚖️ LAWS",
    url: "https://manifold.markets/news/laws",
    targetBlank: true,
  },
  {
    label: "⛑️ POOR",
    url: "https://manifold.markets/news/poor",
    targetBlank: true,
  },
  {
    label: "📖 RIPE",
    url: "https://manifold.markets/news/ripe",
    targetBlank: true,
  },
  {
    label: "🦝 RISK",
    url: "https://manifold.markets/news/risk",
    targetBlank: true,
  },
  {
    label: "🦝 RISKBLOG",
    url: "https://manifold.markets/news/risk",
    targetBlank: true,
  },
  {
    label: "📈 Reports",
    isSpecialNestedDropdown: true,
    children: [
      {
        label: "2025 Reports",
        children: [
          {
            label: "Q2 Report",
            url: "/reports/2025/q2/RISK_2025_Q2_REPORT.pdf", // DIRECT STATIC PDF URL
            targetBlank: true, // Open PDF in new tab
          },
        ],
      },
    ],
  },
];

const servicesLinks: Link[] = [
  {
    label: "✉️ Contact",
    url: "https://manifold.markets/crowlsyong",
    targetBlank: true,
  },
  {
    label: "📝 Make a claim",
    url: "https://manifold.markets/crowlsyong/risk-payment-portal",
    targetBlank: true,
  },
  {
    label: "🏦 Payment Portal",
    url: "https://manifold.markets/crowlsyong/risk-payment-portal",
    targetBlank: true,
  },
];

export default function LinkDataProvider(
  props: { children: (data: LinkData) => JSX.Element },
) {
  const data: LinkData = {
    appsLinks,
    banksLinks,
    globularConglomerateLinks,
    servicesLinks,
  };

  return props.children(data);
}
