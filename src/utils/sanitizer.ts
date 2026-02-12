// src/utils/sanitizer.ts

/**
 * Dangerous URL schemes to block
 */
const DANGEROUS_SCHEMES = ["javascript:", "vbscript:", "data:", "livescript:"];

/**
 * Remove NULL bytes and decode common obfuscation patterns
 */
function decodeObfuscation(input: string): string {
  // Remove NULL bytes
  let cleaned = input.replace(/\0/g, "");

  // Decode HTML entities (&#xxx; and &#xXXX;)
  cleaned = cleaned.replace(/&#(\d+);?/gi, (_, code) =>
    String.fromCharCode(parseInt(code, 10)),
  );
  cleaned = cleaned.replace(/&#x([a-f0-9]+);?/gi, (_, code) =>
    String.fromCharCode(parseInt(code, 16)),
  );

  // Remove whitespace/control characters between scheme letters
  // e.g., "j a v a s c r i p t:" or "java\tscript:"
  cleaned = cleaned.replace(/[\s\x00-\x1F]+/g, "");

  return cleaned;
}

/**
 * Check if a string contains a dangerous URL scheme
 */
function hasDangerousScheme(input: string): boolean {
  const decoded = decodeObfuscation(input.toLowerCase());
  return DANGEROUS_SCHEMES.some((scheme) => decoded.includes(scheme));
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return "";

  // First decode any obfuscation to detect attack patterns
  const decoded = decodeObfuscation(input);

  // Block dangerous URL schemes
  let safe = decoded;
  DANGEROUS_SCHEMES.forEach((scheme) => {
    const pattern = new RegExp(scheme.replace(":", "\\s*:"), "gi");
    safe = safe.replace(pattern, "[BLOCKED]:");
  });

  // HTML escape
  safe = safe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  return safe;
}

/**
 * Sanitize a URL to prevent XSS via dangerous schemes
 * Returns empty string if URL is dangerous
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return "";

  // Trim and decode
  const trimmed = url.trim();

  // Check for dangerous schemes
  if (hasDangerousScheme(trimmed)) {
    return "";
  }

  // Only allow http, https, mailto, tel, and relative URLs
  const lowerUrl = trimmed.toLowerCase();
  const hasProtocol = /^[a-z]+:/i.test(trimmed);

  if (hasProtocol) {
    const isAllowedProtocol =
      lowerUrl.startsWith("http://") ||
      lowerUrl.startsWith("https://") ||
      lowerUrl.startsWith("mailto:") ||
      lowerUrl.startsWith("tel:");

    if (!isAllowedProtocol) {
      return "";
    }
  }

  return trimmed;
}
