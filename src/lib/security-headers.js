/**
 * セキュリティヘッダの単一ソース（DRY）。
 *
 * 利用箇所:
 *  - src/middleware.js … dev + SSRルート(prerender=false: news/[slug], works/[slug]) の実行時付与
 *  - src/integrations/security-headers.js … astro:build:done で dist/_headers を生成（静的ページ用）
 *
 * フレームワーク非依存の純JS（astro: import や import.meta.env を参照しない）。
 * 環境差分は呼び出し側が引数で渡す。
 */

/**
 * Content-Security-Policy 文字列を組み立てる。
 *
 * 許可の根拠:
 *  - script/frame/connect の www.google.com + gstatic.com … reCAPTCHA (contact.astro)
 *  - frame-src www.google.com … Google Maps 埋め込み (AboutAccess.astro) も同ホスト
 *  - style-src-elem fonts.googleapis.com / font-src fonts.gstatic.com … Google Fonts
 *  - *.microcms.io / *.microcms-assets.io … microCMS API・画像
 *  - form-action は apex https://ssgform.com を必ず含む（フォーム送信先が apex。
 *    *.ssgform.com はサブドメインのみで apex に一致しない）
 *
 * @param {{ dev: boolean }} opts dev=true で HMR/devツールバー向けに 'unsafe-inline' を許可
 * @returns {string} CSP ヘッダ値
 */
export function buildCsp({ dev }) {
  const scriptSrc = dev
    ? "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com"
    : "script-src 'self' https://www.google.com https://www.gstatic.com";

  const styleSrc = dev
    ? "style-src 'self' 'unsafe-inline'"
    : "style-src 'self'";

  const styleSrcElem = dev
    ? "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com"
    : "style-src-elem 'self' https://fonts.googleapis.com";

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    styleSrcElem,
    "img-src 'self' data: https: *.microcms.io *.microcms-assets.io",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' *.microcms.io *.ssgform.com https://www.google.com",
    "frame-src 'self' https://www.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://ssgform.com https://*.ssgform.com",
  ].join("; ");
}

/**
 * 全セキュリティヘッダを [name, value] の配列で返す。
 *
 * @param {{ dev: boolean, includeHsts: boolean }} opts
 *   dev: CSP のインライン許可を切替。includeHsts: 本番のみ HSTS を付与。
 * @returns {Array<[string, string]>}
 */
export function securityHeaders({ dev, includeHsts }) {
  const headers = [
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["X-XSS-Protection", "1; mode=block"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "geolocation=(), microphone=(), camera=()"],
    ["Content-Security-Policy", buildCsp({ dev })],
  ];

  if (includeHsts) {
    headers.push([
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    ]);
  }

  return headers;
}
