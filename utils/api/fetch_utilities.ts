// utils/api/fetch_utilities.ts

// Helper for fetch with retries
export async function fetchWithRetries(
  url: string,
  options?: RequestInit,
  retries = 2,
  delayMs = 1000,
  // deno-lint-ignore no-explicit-any
): Promise<{ response: Response | null; error?: any; success: boolean }> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return { response, success: true };
      }

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
      return { response, success: false };
    } catch (error) {
      if (i < retries) {
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error);
        console.warn(
          `Fetch error for ${url}: ${errorMessage}. Retrying in ${
            delayMs * (i + 1)
          }ms... (Attempt ${i + 1} of ${retries + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
      const finalErrorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error);
      console.error(
        `Fetch error for ${url} after ${
          retries + 1
        } attempts: ${finalErrorMessage}`,
      );
      return { response: null, error, success: false };
    }
  }
  return {
    response: null,
    error: new Error("Exhausted retries unexpectedly"),
    success: false,
  };
}
