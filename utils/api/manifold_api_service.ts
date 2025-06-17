import { fetchWithRetries } from "./fetch_utilities.ts";
import {
  Answer,
  ManaPaymentTransaction,
  ManifoldUser,
  MarketData,
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
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
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
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
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
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
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
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
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

export async function getMarketDataBySlug(
  slug: string,
): Promise<{ data: MarketData | null; error: string | null }> {
  const { response, success, error } = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/slug/${slug}`,
  );

  if (!success || !response) {
    console.warn(
      `getMarketDataBySlug: Failed to fetch market data for slug '${slug}' after retries. Error: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
    );
    return { data: null, error: `Network/fetch error for slug '${slug}'.` };
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(
      `getMarketDataBySlug: Received non-OK status ${response.status} for slug '${slug}': ${errorText}`,
    );
    return {
      data: null,
      error:
        `Failed to fetch market data for '${slug}': ${response.status} ${response.statusText} - ${errorText}`,
    };
  }

  try {
    const marketData: MarketData = await response.json();
    if (
      typeof marketData.id !== "string" ||
      typeof marketData.question !== "string" ||
      typeof marketData.url !== "string" ||
      typeof marketData.volume !== "number" ||
      typeof marketData.slug !== "string" ||
      typeof marketData.outcomeType !== "string"
    ) {
      return {
        data: null,
        error: `Invalid or incomplete market data received for slug '${slug}'.`,
      };
    }
    return { data: marketData, error: null };
  } catch (jsonError) {
    console.error(
      `getMarketDataBySlug: Error parsing JSON for slug '${slug}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return {
      data: null,
      error: `Error parsing market data for slug '${slug}'.`,
    };
  }
}
