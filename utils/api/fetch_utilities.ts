// utils/api/fetch_utilities.ts

// Helper for fetch with retries
export async function fetchWithRetries(
  url: string,
  options?: RequestInit,
  retries = 2,
  delayMs = 1000,
): Promise<{ response: Response | null; error: Error | null; success: boolean }> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return { response, success: true, error: null }; // Explicitly return error: null on success
      }

      // Handle non-OK responses that are worth retrying
      if (
        (response.status === 503 || response.status === 500 ||
          response.status === 502 || response.status === 504 ||
          response.status === 429) && i < retries
      ) {
        console.warn(
          `Fetch failed for ${url} with status ${response.status}. Retrying in ${
            delayMs * (i + 1)
          }ms... (Attempt ${i + 1} of ${retries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
      // For non-OK responses not subject to retry (e.g., 404, 401, etc.)
      // Create a specific error to propagate.
      const errorText = response.statusText ||
        `Request failed with status ${response.status}`;
      return { response, success: false, error: new Error(errorText) };
    } catch (caughtError: unknown) { // Use unknown for caught errors
      // Safely extract message from caught error
      const errorMessage =
        typeof caughtError === "object" && caughtError !== null &&
          "message" in caughtError
          ? (caughtError as { message: string }).message
          : String(caughtError);

      if (i < retries) {
        console.warn(
          `Fetch error for ${url}: ${errorMessage}. Retrying in ${
            delayMs * (i + 1)
          }ms... (Attempt ${i + 1} of ${retries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
      // Final attempt failed due to network error. Return an Error object.
      console.error(
        `Fetch error for ${url} after ${
          retries + 1
        } attempts: ${errorMessage}`,
      );
      return { response: null, error: new Error(errorMessage), success: false };
    }
  }
  // This return should technically be unreachable if logic is perfect,
  // but acts as a final safeguard to guarantee a return type.
  return {
    response: null,
    error: new Error("Fetch retries exhausted unexpectedly or logic error."),
    success: false,
  };
}
