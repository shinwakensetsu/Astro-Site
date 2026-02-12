import { describe, it, expect } from "vitest";
import {
  optimizeImageUrl,
  generateSrcSet,
  imagePresets,
} from "../../src/utils/imageOptimizer";

describe("optimizeImageUrl", () => {
  it("パラメータが空なら元URLを返す", () => {
    expect(optimizeImageUrl("https://example.com/a.png")).toBe(
      "https://example.com/a.png",
    );
  });

  it("幅と品質のパラメータを付与する", () => {
    const result = optimizeImageUrl("https://example.com/a.png", {
      width: 400,
      quality: 80,
    });
    expect(result).toBe("https://example.com/a.png?w=400&q=80");
  });

  it("既存クエリがある場合は&で連結する", () => {
    const result = optimizeImageUrl("https://example.com/a.png?foo=1", {
      format: "webp",
    });
    expect(result).toBe("https://example.com/a.png?foo=1&fm=webp");
  });

  it("URLが空なら空文字を返す", () => {
    expect(optimizeImageUrl("", { width: 200 })).toBe("");
  });
});

describe("generateSrcSet", () => {
  it("指定幅のsrcsetを生成する", () => {
    const result = generateSrcSet("https://example.com/a.png", [320, 640], 70);
    expect(result).toBe(
      "https://example.com/a.png?w=320&q=70&fm=auto 320w, https://example.com/a.png?w=640&q=70&fm=auto 640w",
    );
  });
});

describe("imagePresets", () => {
  it("主要プリセットが存在する", () => {
    expect(imagePresets.hero).toBeDefined();
    expect(imagePresets.thumbnail).toBeDefined();
    expect(imagePresets.card).toBeDefined();
    expect(imagePresets.ogImage).toBeDefined();
  });
});
