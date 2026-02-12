// src/utils/htmlSanitizer.ts
import sanitizeHtmlLib from "sanitize-html";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe HTML tags commonly used in CMS content
 */
export function sanitizeHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";

  return sanitizeHtmlLib(dirty, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "a",
      "strong",
      "em",
      "b",
      "i",
      "blockquote",
      "pre",
      "code",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "div",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["class", "id"],
    },
    disallowedTagsMode: "discard",
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
  });
}
