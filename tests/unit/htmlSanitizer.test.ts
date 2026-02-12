/**
 * htmlSanitizer.ts ユニットテスト
 */
import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../../src/utils/htmlSanitizer";

describe("sanitizeHtml", () => {
  describe("基本的なサニタイズ", () => {
    it("nullやundefinedは空文字を返す", () => {
      expect(sanitizeHtml(null)).toBe("");
      expect(sanitizeHtml(undefined)).toBe("");
    });

    it("空文字は空文字を返す", () => {
      expect(sanitizeHtml("")).toBe("");
    });
  });

  describe("許可されたタグ", () => {
    it("見出しタグ(h1-h6)は保持される", () => {
      expect(sanitizeHtml("<h1>見出し1</h1>")).toBe("<h1>見出し1</h1>");
      expect(sanitizeHtml("<h2>見出し2</h2>")).toBe("<h2>見出し2</h2>");
      expect(sanitizeHtml("<h6>見出し6</h6>")).toBe("<h6>見出し6</h6>");
    });

    it("段落・改行タグは保持される", () => {
      expect(sanitizeHtml("<p>段落</p>")).toBe("<p>段落</p>");
      expect(sanitizeHtml("一行目<br>二行目")).toContain("<br");
    });

    it("リストタグは保持される", () => {
      const input = "<ul><li>項目1</li><li>項目2</li></ul>";
      expect(sanitizeHtml(input)).toBe(input);
    });

    it("強調タグは保持される", () => {
      expect(sanitizeHtml("<strong>強調</strong>")).toBe(
        "<strong>強調</strong>",
      );
      expect(sanitizeHtml("<em>斜体</em>")).toBe("<em>斜体</em>");
    });

    it("imgタグは保持される（許可された属性のみ）", () => {
      const input =
        '<img src="https://example.com/image.jpg" alt="画像" width="100" height="100">';
      const result = sanitizeHtml(input);
      expect(result).toContain('src="https://example.com/image.jpg"');
      expect(result).toContain('alt="画像"');
    });
  });

  describe("危険なタグの除去", () => {
    it("scriptタグは除去される", () => {
      expect(sanitizeHtml("<script>alert(1)</script>")).toBe("");
    });

    it("iframeタグは除去される", () => {
      expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).toBe("");
    });

    it("styleタグは除去される", () => {
      expect(sanitizeHtml("<style>body{display:none}</style>")).toBe("");
    });

    it("formタグは除去される", () => {
      expect(sanitizeHtml('<form action="/evil"><input></form>')).toBe("");
    });
  });

  describe("危険な属性の除去", () => {
    it("onclickなどイベントハンドラは除去される", () => {
      const result = sanitizeHtml('<div onclick="alert(1)">クリック</div>');
      expect(result).not.toContain("onclick");
      expect(result).toContain("クリック");
    });

    it("onerrorイベントハンドラは除去される", () => {
      const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain("onerror");
    });

    it("style属性は除去される", () => {
      const result = sanitizeHtml(
        '<div style="background:url(javascript:alert(1))">テスト</div>',
      );
      expect(result).not.toContain("style=");
    });
  });

  describe("危険なURLスキームの除去", () => {
    it("javascript:スキームのhrefは除去される", () => {
      const result = sanitizeHtml('<a href="javascript:alert(1)">リンク</a>');
      expect(result).not.toContain("javascript:");
    });

    it("data:スキームのimgは除去される", () => {
      const result = sanitizeHtml(
        '<img src="data:text/html,<script>alert(1)</script>">',
      );
      expect(result).not.toContain("data:");
    });

    it("http/https/mailto/telスキームは許可される", () => {
      expect(
        sanitizeHtml('<a href="https://example.com">リンク</a>'),
      ).toContain("https://example.com");
      expect(
        sanitizeHtml('<a href="mailto:test@example.com">メール</a>'),
      ).toContain("mailto:test@example.com");
      expect(sanitizeHtml('<a href="tel:+81-3-1234-5678">電話</a>')).toContain(
        "tel:+81-3-1234-5678",
      );
    });
  });
});
