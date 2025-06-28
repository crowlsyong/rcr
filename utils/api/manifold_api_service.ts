// utils/api/manifold_api_service.ts
import { fetchWithRetries } from "./fetch_utilities.ts";
import {
  ManaPaymentTransaction,
  ManifoldComment,
  ManifoldUser,
  MarketData,
  UserPortfolio,
} from "./manifold_types.ts";
import { BetPayload, ManifoldBetResponse } from "./manifold_types.ts";

const MANIFOLD_API_BASE_URL = "https://api.manifold.markets/v0";

interface PostResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  status: number | null;
}

export async function postDataToManifoldApi<T>(
  endpoint: string,
  data: Record<string, unknown>,
  apiKey: string,
): Promise<PostResponse<T>> {
  if (!apiKey) {
    return {
      success: false,
      data: null,
      error: "Manifold API key is missing. Please provide it.",
      status: 400,
    };
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Key ${apiKey}`,
  };

  const { response, success, error } = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}${endpoint}`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    },
  );

  if (!success || !response) {
    return {
      success: false,
      data: null,
      error: `Network or fetch error: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      status: 500,
    };
  }

  if (!response.ok) {
    let errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      errorText = errorJson.message || errorText;
    } catch {
      // Not JSON, use as is
    }
    console.error(
      `Manifold API POST error to ${endpoint}: ${response.status} ${response.statusText} - ${errorText}`,
    );
    return {
      success: false,
      data: null,
      error: `Manifold API error (${response.status}): ${
        errorText || response.statusText
      }`,
      status: response.status,
    };
  }

  try {
    const json: T = await response.json();
    return { success: true, data: json, error: null, status: response.status };
  } catch (jsonError) {
    console.error(
      `Manifold API POST: Error parsing JSON response for ${endpoint}: ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return {
      success: false,
      data: null,
      error: `Error parsing API response for ${endpoint}`,
      status: 200,
    };
  }
}

export async function sendManagram(
  toIds: string[],
  amount: number,
  message: string,
  apiKey: string,
): Promise<PostResponse<ManaPaymentTransaction>> {
  return await postDataToManifoldApi<ManaPaymentTransaction>(
    "/managram",
    { toIds, amount, message },
    apiKey,
  );
}

export async function addBounty(
  marketId: string,
  amount: number,
  commentId: string | null,
  apiKey: string,
): Promise<PostResponse<ManaPaymentTransaction>> {
  if (commentId) {
    return await postDataToManifoldApi<ManaPaymentTransaction>(
      `/market/${marketId}/award-bounty`,
      { amount, commentId },
      apiKey,
    );
  } else {
    return await postDataToManifoldApi<ManaPaymentTransaction>(
      `/market/${marketId}/add-bounty`,
      { amount },
      apiKey,
    );
  }
}

export async function postComment(
  contractId: string,
  text: string,
  apiKey: string,
): Promise<PostResponse<ManifoldComment>> {
  return await postDataToManifoldApi<ManifoldComment>(
    "/comment",
    { contractId, markdown: text },
    apiKey,
  );
}

// fetchUserData expects a string username
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

// fetchUserDataLiteById expects a string userId
export async function fetchUserDataLiteById(
  userId: string,
): Promise<{
  userData: { id: string; username: string; avatarUrl: string | null } | null;
  fetchSuccess: boolean;
}> {
  const { response, success, error } = await fetchWithRetries(
    `${MANIFOLD_API_BASE_URL}/user/by-id/${userId}/lite`,
  );

  if (!success || !response) {
    console.warn(
      `fetchUserDataLiteById: Failed for userId '${userId}' after retries. Error: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
    );
    return { userData: null, fetchSuccess: false };
  }

  if (response.status === 404) {
    console.info(`fetchUserDataLiteById: User with ID '${userId}' not found (404).`);
    return { userData: null, fetchSuccess: false };
  }

  if (!response.ok) {
    console.warn(
      `fetchUserDataLiteById: Received non-OK status ${response.status} for userId '${userId}' after retries.`,
    );
    return { userData: null, fetchSuccess: false };
  }

  try {
    const userDataLite = await response.json();
    // Ensure the response structure is as expected and has the critical username field
    if (
      userDataLite && typeof userDataLite.id === "string" &&
      typeof userDataLite.username === "string"
    ) {
      return {
        userData: {
          id: userDataLite.id,
          username: userDataLite.username,
          avatarUrl: userDataLite.avatarUrl || null,
        },
        fetchSuccess: true,
      };
    }
    console.warn(
      `fetchUserDataLiteById: Malformed lite user data for ID '${userId}'. Missing ID or username.`,
    );
    return { userData: null, fetchSuccess: false }; // Malformed lite data
  } catch (jsonError) {
    console.error(
      `fetchUserDataLiteById: Error parsing JSON for userId '${userId}': ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { userData: null, fetchSuccess: false };
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

export async function getCommentsForContract(
  contractId: string,
  userId?: string,
): Promise<
  { success: boolean; data: ManifoldComment[] | null; error: string | null }
> {
  let url = `${MANIFOLD_API_BASE_URL}/comments?contractId=${contractId}`;
  if (userId) {
    url += `&userId=${userId}`;
  }
  url += `&order=newest`;
  url += `&limit=1000`;

  const { response, success, error } = await fetchWithRetries(url);

  if (!success || !response) {
    return {
      success: false,
      data: null,
      error: `Network or fetch error: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Manifold API GET comments error: ${response.status} ${response.statusText} - ${errorText}`,
    );
    return {
      success: false,
      data: null,
      error: `Failed to fetch comments (${response.status}): ${
        errorText || response.statusText
      }`,
    };
  }

  try {
    const comments: ManifoldComment[] = await response.json();
    return { success: true, data: comments, error: null };
  } catch (jsonError) {
    console.error(
      `Error parsing JSON for comments: ${
        typeof jsonError === "object" && jsonError !== null &&
          "message" in jsonError
          ? (jsonError as { message: string }).message
          : String(jsonError)
      }`,
    );
    return { success: false, data: null, error: "Error parsing comments data" };
  }
}

export async function placeManifoldBet(
  apiKey: string,
  betData: BetPayload,
): Promise<{ data: ManifoldBetResponse | null; error: string | null }> {
  try {
    const response = await fetch("https://api.manifold.markets/v0/bet", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(betData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: responseData.message || "Manifold API returned an error",
      };
    }
    return { data: responseData as ManifoldBetResponse, error: null };
  } catch (e) {
    return {
      data: null,
      error: `Network/fetch error: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`,
    };
  }
}

export async function cancelManifoldBet(apiKey: string, betId: string) {
  try {
    const response = await fetch(
      `https://api.manifold.markets/v0/bet/cancel/${betId}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Failed to cancel bet ${betId}: ${JSON.stringify(errorData)}`,
      );
      return { success: false, error: errorData.message || "Failed to cancel" };
    }
    return { success: true, error: null };
  } catch (e) {
    console.error(`Network error canceling bet ${betId}: ${String(e)}`);
    return {
      success: false,
      error: `Network error: ${
        typeof e === "object" && e !== null && "message" in e
          ? (e as { message: string }).message
          : String(e)
      }`,
    };
  }
}