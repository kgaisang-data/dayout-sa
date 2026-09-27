/**
 * Accept only same-origin application paths. This prevents `next` parameters
 * from becoming open redirects after login/confirmation.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/saved") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  // Backslashes can be normalised as URL separators by some clients.
  if (value.includes("\\")) return fallback;

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return value;
}
