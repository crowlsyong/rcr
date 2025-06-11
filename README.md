# 🦝 RISK: Credit Score & Insurance Calculator

**https://risk.markets**

This is an app for [Manifold Markets](https://manifold.markets) that calculates
a user's credit score based on their account information and activity. It
provides fast analysis via a clean interface powered by Deno and Fresh. It can
also estimate loan insurance fees. It also generates credit history charts.

## ✨ Features

- **Credit Score Calculation** – Instantly fetch and analyze any Manifold user's
  trading activity to produce a score.
- **Loan Insurance Estimator** – Simulate and calculate how much insurance would
  cost to cover a loan to a specific user.
- Built with [Fresh](https://fresh.deno.dev) and [Deno](https://deno.land),
  using the Manifold API.
- **Mobile-first responsive layout.**
- **Credit History** - Creates a nice graph with chart.js to view credit
  history.

## 🧰 Tech Stack

- **Deno** – Secure runtime for JavaScript and TypeScript.
- **Deno KV** - Deno's key value database.
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

   `git clone https://github.com/crowlsyong/rcr`

   `cd rcr`

   `deno task start`

3. **Optional: Add Github OAuth**

- Register OAuth app in github here:
  https://github.com/settings/applications/new
  - **Homepage URL** In our case, we use https://risk.markets for the Homepage
    URL
  - **Authorization callback URL** and we use
    https://risk.markets/auth/oauth2callback (you can use
    http://localhost:somenumber/auth/oauth2callback)
  - Do not enable Device Flow
  - Register application

## 📦 Deployment

This project can be deployed to [Deno Deploy](https://deno.com/deploy) with
minimal configuration.

1. Push code to a GitHub repo.
2. Create a new Deno Deploy project and link it to your repo at
   https://dash.deno.com
3. Click settings tab and add environment variables
4. Set the entry point to `main.ts`.
5. (optional) Add auth environment variables in the Deno Dashboard at
   `https://dash.deno.com/projects/YOUR_PROJECT_NAME/settings`

## 🧠 How the Credit Score Works

The score is derived from weighted factors including balance, total profit,
account age, managram history, and activity level. While this is not a financial
score in the traditional sense, it helps visualize the relative risk of lending
mana to a user.

You can review the scoring algorithm in
[`/routes/api/score.ts`](./routes/api/score.ts).

## 🛡️ Insurance Calculator

The insurance calculator uses the credit score as a baseline and adds a risk
premium. Higher risk scores lead to lower insurance costs. This is experimental
and subject to change. More info on fees: https://manifold.markets/news/risk

## 🤝 Contributing

Contributions are welcome. Please open an issue if you have suggestions, or a PR
if you'd like to fix or add a feature. Messaging me on Discord or Manifold is
okay too.

## 📜 License

MIT License

## Additional Info

The is a 3rd party app.
