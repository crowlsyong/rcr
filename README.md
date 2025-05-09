# 🦝 RISK: Credit Score & Insurance Calculator

**https://risk.markets**

RISK is an app for [Manifold Markets](https://manifold.markets) that calculates
a user's credit score based on their account activity and can also estimate loan
insurance fees for underwriting purposes. It provides transparent, fast analysis
via a clean interface powered by Deno and Fresh.

## ✨ Features

- **Credit Score Calculation** – Instantly fetch and analyze any Manifold user's
  trading activity to produce a score.
- **Loan Insurance Estimator** – Simulate and calculate how much insurance would
  cost to cover a loan to a specific user.
- Built with [Fresh](https://fresh.deno.dev) and [Deno](https://deno.land),
  using the Manifold API.
- Mobile-first responsive layout.

## 🧰 Tech Stack

- **Deno** – Secure runtime for JavaScript and TypeScript.
- **Fresh** – A web framework for Deno using Preact and islands architecture.
  - **Preact** – Fast 3kB alternative to React with the same modern API.
  - **Tailwind CSS** – Utility-first CSS framework for rapid UI development.
- **Manifold API** – To fetch user account and market data for analysis.

## 🚀 Getting Started

1. If you haven't already, **install
   [Deno](https://deno.land/manual@v1.40.1/getting_started/installation)**:

   macOS

   `brew install deno`

   Windows (PowerShell)

   `irm https://deno.land/install.ps1 | iex`

   Linux (via Shell)

   `curl -fsSL https://deno.land/install.sh | sh`

2. **Clone the repo and start the server**

   `git clone https://github.com/YOUR_USERNAME/risk-app.git`

   `cd rcr`

   `deno task start`

## 📦 Deployment

This project can be deployed to [Deno Deploy](https://deno.com/deploy) with
minimal configuration.

1. Push your code to a GitHub repo.
2. Create a new Deno Deploy project and link it to your repo.
3. Set the entry point to `main.ts`.

## 🧠 How the Credit Score Works

The score is derived from weighted factors including balance, total profit,
account age, and activity level. While this is not a financial score in the
traditional sense, it helps visualize the relative risk of lending mana to a
user.

You can review the scoring algorithm in
[`/routes/api/score.ts`](./routes/api/score.ts).

## 🛡️ Insurance Calculator

The insurance calculator uses the credit score as a baseline and adds a risk
premium. Higher risk scores lead to lower insurance costs. This is experimental
and subject to change.

## 🤝 Contributing

Contributions are welcome. Please open an issue if you have suggestions, or a PR
if you'd like to fix or add a feature.

## 📜 License

MIT License

## Additional Info

The is a 3rd party app.
