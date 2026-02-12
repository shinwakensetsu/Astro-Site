/**
 * Astro Middleware - セキュリティヘッダ設定
 * 配置場所: src/middleware.js
 */
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // 次の処理（ページ/API）を実行
  const response = await next();

  // セキュリティヘッダを追加
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  // Content-Security-Policy（microCMS + YouTube + SSGform 対応）
  // dev モードでは Astro dev toolbar がインラインスクリプトを注入するため 'unsafe-inline' を許可
  const scriptSrc = import.meta.env.DEV
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self'";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: *.microcms.io *.microcms-assets.io i.ytimg.com",
      "font-src 'self'",
      "connect-src 'self' *.microcms.io *.ssgform.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.ssgform.com",
    ].join("; "),
  );

  // 本番環境のみ HSTS を有効化
  if (import.meta.env.PROD) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  // サーバー情報を隠す
  response.headers.delete("X-Powered-By");

  return response;
});
