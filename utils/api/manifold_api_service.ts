// utils/api/manifold_api_service.ts

import { fetchWithRetries } from "./fetch_utilities.ts";
import {
  ManaPaymentTransaction,
  ManifoldUser,
  UserPortfolio,
} from "./manifold_types.ts";

const MANIFOLD_API_BASE_URL = "https://api.manifold.markets/v0";

export async function fetchUserData(
  username: string,
): Promise<{
  userData: ManifoldUser | null;
  fetchSuccess: boolean;
  userDeleted: boolean;
}> {
  let userDeleted = false;

  const { response, success, error } = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/user/${username}`,
  );

  if (!success || !response) {
    console.warn(
      `fetchUserData: Failed to fetch data for '${username}' after retries. Error: ${
        error ? error.message : (response ? response.statusText : "Unknown")
      }`,
    );
    return { userData: null, fetchSuccess: false, userDeleted };
  }

  if (response.status === 404) {
    console.info(`fetchUserData: User '${username}' not found (404).`);
    return { userData: null, fetchSuccess: false, userDeleted };
  }

  if (!response.ok) {
    console.warn(
      `fetchUserData: Received non-OK status ${response.status} for '${username}' after retries.`,
    );
    return { userData: null, fetchSuccess: false, userDeleted };
  }

  try {
    const userData: ManifoldUser = await response.json();
    userDeleted = userData.userDeleted === true;
    console.debug(
      `fetchUserData: Successfully fetched data for '${username}'.`,
    );
    return { userData, fetchSuccess: true, userDeleted };
  } catch (jsonError) {
    console.error(
      `fetchUserData: Error parsing JSON for '${username}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { userData: null, fetchSuccess: false, userDeleted };
  }
}

export async function fetchUserPortfolio(
  userId: string,
): Promise<{ portfolio: UserPortfolio | null; success: boolean }> {
  const { response, success, error } = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/get-user-portfolio?userId=${userId}`,
  );

  if (!success || !response) {
    console.warn(
      `fetchUserPortfolio: Failed for userId '${userId}' after retries. Error: ${
        error ? error.message : (response ? response.statusText : "Unknown")
      }`,
    );
    return { portfolio: null, success: false };
  }

  try {
    const userPortfolio: UserPortfolio = await response.json();
    return { portfolio: userPortfolio, success: true };
  } catch (jsonError) {
    console.error(
      `fetchUserPortfolio: Error parsing JSON for userId '${userId}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { portfolio: null, success: false };
  }
}

export async function fetchManaAndRecentRank(
  userId: string,
): Promise<{ total: number; latestRank: number | null; success: boolean }> {
  const { response, success, error } = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/leagues?userId=${userId}`,
  );

  if (!success || !response) {
    console.warn(
      `fetchManaAndRecentRank: Failed for userId '${userId}' after retries. Error: ${
        error ? error.message : (response ? response.statusText : "Unknown")
      }`,
    );
    return { total: 0, latestRank: null, success: false };
  }

  try {
    const leaguesData = await response.json();
    let total = 0;
    let latestRank: number | null = null;

    for (const season of leaguesData) {
      total += season.manaEarned;
    }

    if (leaguesData.length > 0) {
      const mostRecent = leaguesData.reduce((
        a: { season?: number; rankSnapshot?: number },
        b: { season?: number; rankSnapshot?: number },
      ) => (a.season ?? 0) > (b.season ?? 0) ? a : b);
      latestRank = mostRecent.rankSnapshot ?? null;
    }
    return { total, latestRank, success: true };
  } catch (jsonError) {
    console.error(
      `fetchManaAndRecentRank: Error parsing JSON for userId '${userId}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { total: 0, latestRank: null, success: false };
  }
}

export async function fetchTransactionCount(
  username: string,
): Promise<{ count: number; success: boolean }> {
  const { response, success, error } = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/bets?username=${username}`,
  );

  if (!success || !response) {
    console.warn(
      `fetchTransactionCount: Failed for '${username}' after retries. Error: ${
        error ? error.message : (response ? response.statusText : "Unknown")
      }`,
    );
    return { count: 0, success: false };
  }

  try {
    const data = await response.json();
    return { count: Array.isArray(data) ? data.length : 0, success: true };
  } catch (jsonError) {
    console.error(
      `fetchTransactionCount: Error parsing JSON for '${username}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { count: 0, success: false };
  }
}

export async function fetchLoanTransactions(
  userId: string,
): Promise<{ transactions: ManaPaymentTransaction[]; success: boolean }> {
  const receivedResult = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/txns?limit=100&category=MANA_PAYMENT&toId=${userId}`,
  );
  const sentResult = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/txns?limit=100&category=MANA_PAYMENT&fromId=${userId}`,
  );

  if (
    !receivedResult.success || !receivedResult.response ||
    !sentResult.success || !sentResult.response
  ) {
    console.warn(
      `fetchLoanTransactions: Failed to fetch one or both transaction sets for userId '${userId}' after retries.`,
    );
    return { transactions: [], success: false };
  }

  try {
    const receivedTxns: ManaPaymentTransaction[] = await receivedResult.response
      .json();
    const sentTxns: ManaPaymentTransaction[] = await sentResult.response.json();
    return { transactions: [...receivedTxns, ...sentTxns], success: true };
  } catch (jsonError) {
    console.error(
      `fetchLoanTransactions: Error parsing JSON for userId '${userId}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { transactions: [], success: false };
  }
}
