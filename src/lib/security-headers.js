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
 *  - 'unsafe-inline'（script-src / style-src / style-src-elem）… 本サイトは
 *    背景画像をインライン style 属性（例 style="--banner-bg: url(...)"）で渡し、
 *    Astro は inlineStylesheets:'auto' でクリティカルCSSを inline <style> に、
 *    小さなコンポーネントJSを inline <script type="module"> に埋め込む。
 *    背景URLは動的（CMS/データ由来）でハッシュ化できないため、本番でも
 *    inline 許可が必須。CSP は dev/prod 同一（HMR も unsafe-inline を要する）。
 *
 * @returns {string} CSP ヘッダ値
 */
export function buildCsp() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
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
 * @param {{ includeHsts: boolean }} opts includeHsts: 本番のみ HSTS を付与。
 * @returns {Array<[string, string]>}
 */
export function securityHeaders({ includeHsts }) {
  const headers = [
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["X-XSS-Protection", "1; mode=block"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "geolocation=(), microphone=(), camera=()"],
    ["Content-Security-Policy", buildCsp()],
  ];

  if (includeHsts) {
    headers.push([
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    ]);
  }

  return headers;
}
