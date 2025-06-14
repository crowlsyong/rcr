// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $admin_index from "./routes/admin/index.tsx";
import * as $api_history from "./routes/api/history.ts";
import * as $api_score from "./routes/api/score.ts";
import * as $auth_oauth2callback from "./routes/auth/oauth2callback.ts";
import * as $auth_signin from "./routes/auth/signin.ts";
import * as $auth_signout from "./routes/auth/signout.ts";
import * as $chart_username_ from "./routes/chart/[username].tsx";
import * as $ext_username_ from "./routes/ext/[username].tsx";
import * as $forbidden from "./routes/forbidden.tsx";
import * as $gameshow_usernames_ from "./routes/gameshow/[usernames].tsx";
import * as $iframe_credit_score from "./routes/iframe/credit-score.tsx";
import * as $iframe_insurance_fee_calculator from "./routes/iframe/insurance-fee-calculator.tsx";
import * as $index from "./routes/index.tsx";
import * as $insurance from "./routes/insurance.tsx";
import * as $qr_string_ from "./routes/qr/[string].tsx";
import * as $u_username_ from "./routes/u/[username].tsx";
import * as $Chart from "./islands/Chart.tsx";
import * as $CreditScore from "./islands/CreditScore.tsx";
import * as $CreditScoreChExt from "./islands/CreditScoreChExt.tsx";
import * as $GameShowCreditScore from "./islands/GameShowCreditScore.tsx";
import * as $InsuranceCalc from "./islands/InsuranceCalc.tsx";
import * as $MenuBar from "./islands/MenuBar.tsx";
import * as $PasswordGate from "./islands/PasswordGate.tsx";
import * as $ScoreResult from "./islands/ScoreResult.tsx";
import * as $buttons_Button from "./islands/buttons/Button.tsx";
import * as $buttons_ChartButton from "./islands/buttons/ChartButton.tsx";
import * as $buttons_ShareButton from "./islands/buttons/ShareButton.tsx";
import * as $buttons_ShareURL from "./islands/buttons/ShareURL.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/admin/index.tsx": $admin_index,
    "./routes/api/history.ts": $api_history,
    "./routes/api/score.ts": $api_score,
    "./routes/auth/oauth2callback.ts": $auth_oauth2callback,
    "./routes/auth/signin.ts": $auth_signin,
    "./routes/auth/signout.ts": $auth_signout,
    "./routes/chart/[username].tsx": $chart_username_,
    "./routes/ext/[username].tsx": $ext_username_,
    "./routes/forbidden.tsx": $forbidden,
    "./routes/gameshow/[usernames].tsx": $gameshow_usernames_,
    "./routes/iframe/credit-score.tsx": $iframe_credit_score,
    "./routes/iframe/insurance-fee-calculator.tsx":
      $iframe_insurance_fee_calculator,
    "./routes/index.tsx": $index,
    "./routes/insurance.tsx": $insurance,
    "./routes/qr/[string].tsx": $qr_string_,
    "./routes/u/[username].tsx": $u_username_,
  },
  islands: {
    "./islands/Chart.tsx": $Chart,
    "./islands/CreditScore.tsx": $CreditScore,
    "./islands/CreditScoreChExt.tsx": $CreditScoreChExt,
    "./islands/GameShowCreditScore.tsx": $GameShowCreditScore,
    "./islands/InsuranceCalc.tsx": $InsuranceCalc,
    "./islands/MenuBar.tsx": $MenuBar,
    "./islands/PasswordGate.tsx": $PasswordGate,
    "./islands/ScoreResult.tsx": $ScoreResult,
    "./islands/buttons/Button.tsx": $buttons_Button,
    "./islands/buttons/ChartButton.tsx": $buttons_ChartButton,
    "./islands/buttons/ShareButton.tsx": $buttons_ShareButton,
    "./islands/buttons/ShareURL.tsx": $buttons_ShareURL,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
