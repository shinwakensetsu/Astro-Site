import { describe, it, expect } from "vitest";
import { formatDate, categoryColors } from "../../src/utils/formatters";

describe("formatDate", () => {
  it("日付を YYYY.MM.DD 形式に変換する", () => {
    expect(formatDate("2024-01-15")).toBe("2024.01.15");
  });

  it("無効な日付は空文字を返す", () => {
    expect(formatDate("invalid")).toBe("");
  });
});

describe("categoryColors", () => {
  it("主要カテゴリに色が割り当てられている", () => {
    expect(categoryColors["お知らせ"]).toBeDefined();
    expect(categoryColors["プレスリリース"]).toBeDefined();
    expect(categoryColors["イベント"]).toBeDefined();
  });
});
