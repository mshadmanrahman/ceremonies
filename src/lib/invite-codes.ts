/**
 * Generate a short, URL-safe invite code.
 * 8 chars from a 36-char alphabet = ~2.8 trillion possibilities.
 * No external dependencies.
 */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function nanoid(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
