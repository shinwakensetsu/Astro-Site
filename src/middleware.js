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
  // dev モードでは Astro dev toolbar / HMR がインラインスタイル・スクリプトを注入するため
  // 'unsafe-inline' を許可。本番では不要（Astro が外部 CSS としてバンドル）。
  const isDev = import.meta.env.DEV;

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com"
    : "script-src 'self' https://www.google.com https://www.gstatic.com";

  // style-src: style 属性（inline）のフォールバック。背景画像は JS DOM 経由でセットするため
  // 本番では 'unsafe-inline' 不要。
  // style-src-elem: <style> 要素と <link rel="stylesheet">。Astro は本番で外部 CSS に抽出。
  const styleSrc = isDev
    ? "style-src 'self' 'unsafe-inline'"
    : "style-src 'self'";

  const styleSrcElem = isDev
    ? "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com"
    : "style-src-elem 'self' https://fonts.googleapis.com";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      styleSrc,
      styleSrcElem,
      "img-src 'self' data: https: *.microcms.io *.microcms-assets.io i.ytimg.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' *.microcms.io *.ssgform.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com",
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
