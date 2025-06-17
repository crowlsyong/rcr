// Interface for a single bet payload
interface BetPayload {
  amount: number;
  contractId: string;
  outcome: "YES" | "NO";
  limitProb?: number;
  expiresMillisAfter?: number;
  expiresAt?: number;
}

// Response interface from Manifold API for a successful bet
export interface ManifoldBetResponse {
  id: string;
  userId: string;
  contractId: string;
  createdTime: number;
  amount: number;
  outcome: "YES" | "NO";
  shares: number;
  probBefore: number;
  probAfter: number;
  isFilled: boolean;
  isCancelled: boolean;
}

// Helper to place a single bet on Manifold
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

// Helper to cancel a bet on Manifold
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
