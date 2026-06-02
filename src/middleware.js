/**
 * Astro Middleware - セキュリティヘッダ設定
 * 配置場所: src/middleware.js
 *
 * 実行タイミング: dev サーバー全リクエスト + 本番の SSR ルート(prerender=false)。
 * 静的ページ(Cloudflare 配信)には dist/_headers が適用される（security-headers integration が生成）。
 * ヘッダ定義は src/lib/security-headers.js に一元化（_headers 生成と共有 = DRY）。
 */
import { defineMiddleware } from "astro:middleware";
import { securityHeaders } from "./lib/security-headers.js";

export const onRequest = defineMiddleware(async (context, next) => {
  // 次の処理（ページ/API）を実行
  const response = await next();

  // 単一ソースから全セキュリティヘッダを付与
  // dev では CSP のインライン許可、本番では HSTS を有効化
  for (const [name, value] of securityHeaders({
    dev: import.meta.env.DEV,
    includeHsts: import.meta.env.PROD,
  })) {
    response.headers.set(name, value);
  }

  // サーバー情報を隠す
  response.headers.delete("X-Powered-By");

  return response;
});
