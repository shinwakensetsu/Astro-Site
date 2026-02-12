// src/pages/api/contact.ts
import type { APIRoute } from "astro";
import { sanitizeInput } from "../../utils/sanitizer";
import { contactSchema } from "../../lib/contactSchema";

// Allowed origins for CSRF protection
// Production: only allow production site URL
// Development: also allow localhost for testing
const ALLOWED_ORIGINS = import.meta.env.PROD
  ? ([import.meta.env.SITE_URL].filter(Boolean) as string[])
  : ([
      "http://localhost:4321",
      "http://localhost:3000",
      import.meta.env.SITE_URL,
    ].filter(Boolean) as string[]);

/**
 * Validate Origin/Referer header for CSRF protection
 */
function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");

  // Check Origin header first
  if (origin) {
    return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
  }

  // Fall back to Referer header
  if (referer) {
    return ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed));
  }

  // Reject if neither header is present (likely cross-origin request)
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // CSRF protection: validate Origin/Referer
    if (!validateOrigin(request)) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Invalid origin" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await request.formData();

    // Extract form fields
    const rawData = {
      name: data.get("name")?.toString() ?? "",
      email: data.get("email")?.toString() ?? "",
      subject: data.get("subject")?.toString() ?? "",
      message: data.get("message")?.toString() ?? "",
    };

    // Step 1: Validate with Zod schema (same as client-side)
    const validationResult = contactSchema.safeParse(rawData);

    if (!validationResult.success) {
      // Return validation errors
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map((issue) => ({
            field: issue.path[0],
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 2: Sanitize validated data
    const safeData = {
      name: sanitizeInput(validationResult.data.name),
      email: sanitizeInput(validationResult.data.email),
      subject: sanitizeInput(validationResult.data.subject),
      message: sanitizeInput(validationResult.data.message),
    };

    // Success response with sanitized data
    return new Response(
      JSON.stringify({
        success: true,
        data: safeData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("API Error Details:", e);
    return new Response(JSON.stringify({ error: "Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
