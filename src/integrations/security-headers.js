/**
 * Astro Integration: security-headers
 *
 * ビルド後に dist/_headers を単一ソース src/lib/security-headers.js から生成する。
 * 静的ページ（Cloudflare Pages 配信）はこの _headers でのみセキュリティヘッダが付く
 * （middleware は prerender=false の SSR ルートでのみ実行されるため）。
 *
 * fail-closed: 生成内容に CSP が含まれない／書き込みに失敗した場合は throw して
 * ビルドを中断する。ヘッダ欠落のまま本番へ出荷しないための安全策。
 */
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { securityHeaders } from "../lib/security-headers.js";

export default function securityHeadersIntegration() {
  return {
    name: "security-headers",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const headers = securityHeaders({ dev: false, includeHsts: true });
        const body =
          "/*\n" +
          headers.map(([name, value]) => `  ${name}: ${value}`).join("\n") +
          "\n";

        // fail-closed: CSP 必須。欠落ならビルドを止める。
        if (!body.includes("Content-Security-Policy")) {
          throw new Error(
            "security-headers: 生成された _headers に Content-Security-Policy がありません。ビルドを中断します。",
          );
        }

        const outPath = join(fileURLToPath(dir), "_headers");
        await writeFile(outPath, body, "utf-8");
        logger.info("security-headers: dist/_headers を生成しました");
      },
    },
  };
}
