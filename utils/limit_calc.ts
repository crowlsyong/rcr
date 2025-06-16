// utils/manifold-api.ts

/**
 * Interface for the market data returned from the Manifold Markets API.
 * Only includes relevant fields for this application.
 */
export interface MarketData {
  id: string;
  question: string;
  url: string;
  probability: number;
  outcomeType: "BINARY" | "FREE_RESPONSE" | "PSEUDO_NUMERIC";
  // Add other fields from the API response if needed later
}

/**
 * Fetches market data from the Manifold Markets API using the market slug.
 * @param slug The slug of the Manifold Market (e.g., "will-carrick-flynn-win-the-general").
 * @returns A Promise that resolves to MarketData or null if not found/error, along with an error message.
 */
export async function getMarketDataBySlug(
  slug: string,
): Promise<{ data: MarketData | null; error: string | null }> {
  try {
    const apiUrl = `https://api.manifold.markets/v0/slug/${slug}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error:
          `Failed to fetch market data: ${response.status} ${response.statusText} - ${errorText}`,
      };
    }

    const marketData = (await response.json()) as MarketData;
    return { data: marketData, error: null };
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
