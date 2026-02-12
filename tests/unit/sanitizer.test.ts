/**
 * sanitizer.ts ユニットテスト
 */
import { describe, it, expect } from "vitest";
import { sanitizeInput, sanitizeUrl } from "../../src/utils/sanitizer";

describe("sanitizeInput", () => {
  describe("基本的なサニタイズ", () => {
    it("nullやundefinedは空文字を返す", () => {
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
    });

    it("通常のテキストはHTMLエスケープされる", () => {
      expect(sanitizeInput("<script>alert(1)</script>")).toContain(
        "&lt;script&gt;",
      );
      expect(sanitizeInput("Hello & Goodbye")).toContain("&amp;");
    });

    it("引用符がエスケープされる", () => {
      expect(sanitizeInput('"test"')).toContain("&quot;");
      expect(sanitizeInput("'test'")).toContain("&#x27;");
    });
  });

  describe("XSS攻撃対策", () => {
    it("javascript:スキームがブロックされる", () => {
      const result = sanitizeInput("javascript:alert(1)");
      expect(result).not.toContain("javascript:");
      expect(result).toContain("[BLOCKED]");
    });

    it("大文字小文字混在のjavascript:がブロックされる", () => {
      const result = sanitizeInput("JaVaScRiPt:alert(1)");
      expect(result).not.toContain("javascript:");
      expect(result).toContain("[BLOCKED]");
    });

    it("HTMLエンティティで難読化されたjavascript:がブロックされる", () => {
      const result = sanitizeInput("&#106;avascript:alert(1)");
      expect(result).not.toContain("javascript:");
    });

    it("NULL文字を含むjavascript:がブロックされる", () => {
      const result = sanitizeInput("java\0script:alert(1)");
      expect(result).not.toContain("javascript:");
    });

    it("vbscript:がブロックされる", () => {
      const result = sanitizeInput("vbscript:msgbox(1)");
      expect(result).not.toContain("vbscript:");
      expect(result).toContain("[BLOCKED]");
    });

    it("data:がブロックされる", () => {
      const result = sanitizeInput("data:text/html,<script>alert(1)</script>");
      expect(result).not.toContain("data:");
      expect(result).toContain("[BLOCKED]");
    });
  });
});

describe("sanitizeUrl", () => {
  describe("有効なURL", () => {
    it("nullやundefinedは空文字を返す", () => {
      expect(sanitizeUrl(null)).toBe("");
      expect(sanitizeUrl(undefined)).toBe("");
    });

    it("httpスキームは許可される", () => {
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
    });

    it("httpsスキームは許可される", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    });

    it("mailtoスキームは許可される", () => {
      expect(sanitizeUrl("mailto:test@example.com")).toBe(
        "mailto:test@example.com",
      );
    });

    it("telスキームは許可される", () => {
      expect(sanitizeUrl("tel:+81-3-1234-5678")).toBe("tel:+81-3-1234-5678");
    });

    it("相対URLは許可される", () => {
      expect(sanitizeUrl("/path/to/page")).toBe("/path/to/page");
      expect(sanitizeUrl("./relative")).toBe("./relative");
    });
  });

  describe("危険なURL", () => {
    it("javascript:は空文字を返す", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    });

    it("vbscript:は空文字を返す", () => {
      expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("");
    });

    it("data:は空文字を返す", () => {
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    });

    it("難読化されたjavascript:は空文字を返す", () => {
      expect(sanitizeUrl("&#106;avascript:alert(1)")).toBe("");
      expect(sanitizeUrl("java\0script:alert(1)")).toBe("");
    });

    it("ftpなど許可されていないスキームは空文字を返す", () => {
      expect(sanitizeUrl("ftp://example.com")).toBe("");
      expect(sanitizeUrl("file:///etc/passwd")).toBe("");
    });
  });
});
