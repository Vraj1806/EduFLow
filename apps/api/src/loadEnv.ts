/**
 * Loads `.env` into process.env using Node's built-in loader (no dependency).
 * Existing environment variables take precedence, and a missing file is only
 * a warning outside production — tests set variables directly and never call this.
 */
export function loadEnvFile() {
  try {
    process.loadEnvFile();
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[api] .env file not found — using existing environment variables.');
    }
  }
}
