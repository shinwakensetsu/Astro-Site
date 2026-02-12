import { describe, it, expect } from "vitest";
import { contactSchema } from "../../src/lib/contactSchema";

describe("contactSchema", () => {
  it("必須項目が揃っていれば通る", () => {
    const data = {
      name: "テスト太郎",
      email: "test@example.com",
      subject: "件名",
      message: "お問い合わせ内容です",
    };
    expect(() => contactSchema.parse(data)).not.toThrow();
  });

  it("email形式が不正なら失敗する", () => {
    const data = {
      name: "テスト太郎",
      email: "invalid",
      subject: "件名",
      message: "お問い合わせ内容です",
    };
    expect(() => contactSchema.parse(data)).toThrow();
  });

  it("subjectは省略可能", () => {
    const data = {
      name: "テスト太郎",
      email: "test@example.com",
      message: "お問い合わせ内容です",
    };
    expect(() => contactSchema.parse(data)).not.toThrow();
  });

  it("messageが空なら失敗する", () => {
    const data = {
      name: "テスト太郎",
      email: "test@example.com",
      message: "",
    };
    expect(() => contactSchema.parse(data)).toThrow();
  });
});
