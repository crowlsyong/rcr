// routes/_middleware.ts
import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  console.log("Middleware handler executed for:", req.url); // Add this line
  const origin = req.headers.get("Origin") || "*";
  const resp = await ctx.next();
  const headers = resp.headers;

  // Existing CORS headers
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With",
  );
  headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS, GET, PUT, DELETE",
  );

  // --- Add Content-Security-Policy header ---
  // Define your CSP directives
  const cspDirectives: Record<string, string[]> = {
    defaultSrc: ["'self'"],
    // Allow scripts from self and manifold.markets (if needed for scripts)
    scriptSrc: [
      "'self'",
      "https://manifold.markets",
      "'unsafe-eval'",
      "'unsafe-inline'",
    ], // Added unsafe-eval and unsafe-inline for potential island/dynamic code needs
    // Allow styles from self, manifold.markets, and inline styles
    styleSrc: [
      "'self'",
      "https://manifold.markets",
      "'unsafe-inline'",
    ],
    // Allow images from self, specified external sources, AND data URLs
    imgSrc: [
      "'self'",
      "https://firebasestorage.googleapis.com",
      "https://lh3.googleusercontent.com",
      "data:", // **Added data: here to allow data URLs**
    ],
    // Allow fonts from self and manifold.markets
    fontSrc: ["'self'", "https://manifold.markets"],
    // Connect sources if your API or other fetches go to specific origins
    connectSrc: ["'self'", "https://manifold.markets"], // Example: if you fetch data from manifold directly on the client
    // Add other directives as needed (e.g., frameSrc, objectSrc)
  };

  // Format the directives into a CSP string
  const cspString = Object.entries(cspDirectives)
    .map(([directive, sources]) =>
      `${kebabCase(directive)} ${sources.join(" ")}`
    )
    .join("; ");

  headers.set("Content-Security-Policy", cspString);
  // --- End Add Content-Security-Policy header ---

  return resp;
}

// Helper function to convert camelCase to kebab-case for CSP directives
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}
